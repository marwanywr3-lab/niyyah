const URL='https://niyyah.marwanbarbood.com';
const message='هذه الآية من المصحف الشريف. يمديك تجرب تتصفح القرآن بطريقة أسهل وتقنية أكثر مع نِيّة. '+URL;
function toBlob(canvas,type,quality){return new Promise(resolve=>canvas.toBlob(resolve,type,quality));}
function bytes(s){return new TextEncoder().encode(s);}
async function makePDF(canvas){
 const jpeg=new Uint8Array(await (await toBlob(canvas,'image/jpeg',.93)).arrayBuffer()),parts=[],offsets=[0];let length=0;
 const add=x=>{const b=typeof x==='string'?bytes(x):x;parts.push(b);length+=b.length;};
 add('%PDF-1.4\n');const obj=(n,body)=>{offsets[n]=length;add(n+' 0 obj\n');body();add('\nendobj\n');};
 obj(1,()=>add('<< /Type /Catalog /Pages 2 0 R >>'));obj(2,()=>add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
 obj(3,()=>add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'));
 obj(4,()=>{add('<< /Type /XObject /Subtype /Image /Width '+canvas.width+' /Height '+canvas.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n');add(jpeg);add('\nendstream');});
 const stream='q\n600 0 0 800 0 0 cm\n/Im0 Do\nQ\n';obj(5,()=>add('<< /Length '+bytes(stream).length+' >>\nstream\n'+stream+'endstream'));
 const xref=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');return new Blob(parts,{type:'application/pdf'});
}
function layout(ctx,text,width,fontSize){ctx.font=fontSize+'px AmiriQuran, serif';const words=text.split(/\s+/),lines=[];let line='';for(const word of words){const candidate=line?line+' '+word:word;if(ctx.measureText(candidate).width>width&&line){lines.push(line);line=word;}else line=candidate;}if(line)lines.push(line);return lines;}
export async function shareVerse(context,type){
 if(context.unverified||!context.words)throw Error('تعذر مشاركة هذا الموضع قبل التحقق من ترقيمه ونصه.');
 await document.fonts.load('68px AmiriQuran');await document.fonts.ready;const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1600;const ctx=canvas.getContext('2d');ctx.fillStyle='#faf7ed';ctx.fillRect(0,0,1200,1600);ctx.strokeStyle='#b5a16f';ctx.lineWidth=5;ctx.strokeRect(35,35,1130,1530);
 ctx.textAlign='center';ctx.direction='rtl';ctx.fillStyle='#435846';ctx.font='bold 66px sans-serif';ctx.fillText('نِيّة',600,160);
 let size=68,lines;do{lines=layout(ctx,context.words,990,size);if(lines.length*size*1.65<=1050)break;size-=3;}while(size>=24);
 if(lines.length*size*1.65>1050)throw Error('الآية طويلة جدًا لتناسب بطاقة المشاركة دون اقتطاع.');
 ctx.fillStyle='#292e27';ctx.font=size+'px AmiriQuran, serif';const lineHeight=size*1.65;let y=750-(lines.length-1)*lineHeight/2;for(const line of lines){ctx.fillText(line,600,y);y+=lineHeight;}
 ctx.fillStyle='#526a57';ctx.font='32px sans-serif';ctx.fillText('السورة '+context.surah+' • الآية '+context.ayah,600,1380);ctx.font='26px sans-serif';ctx.fillText('niyyah.marwanbarbood.com',600,1450);
 const blob=type==='pdf'?await makePDF(canvas):await toBlob(canvas,'image/png');if(!blob)throw Error('تعذر إنشاء ملف المشاركة');const file=new File([blob],'niyyah-'+context.surah+'-'+context.ayah+'.'+(type==='pdf'?'pdf':'png'),{type:blob.type});
 if(navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({files:[file],title:'آية من نِيّة',text:message});return;}catch(e){if(e.name==='AbortError')return;}}
 const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),60000);
 try{await navigator.clipboard.writeText(message);}catch{}
}
