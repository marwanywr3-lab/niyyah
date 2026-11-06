import fs from 'node:fs';import crypto from 'node:crypto';
const source=process.argv[2];if(!source)throw Error('Supply the owner-approved ARQURAN.TXT');
const bytes=fs.readFileSync(source),text=bytes.toString('utf8'),pages=[],surahs=[],anomalies=[];let surah=null,page=null,section=null,juz=0,start=false,lastVerse=0;
const sourceLines=[];
for(const [index,line] of text.split(/\r?\n/).entries()){
 if(line.startsWith('*1*')){if(!line.includes('نهاية'))juz++;continue;}
 if(line.startsWith('*2*')){const m=line.match(/^\*2\*[.\s]*(\d+)[.\s]+(?:سورة\s*)?(.*)/);if(m){surah={number:surahs.length+1,sourceNumber:+m[1],name:m[2].trim(),firstPage:null};surahs.push(surah);start=true;lastVerse=0;if(surah.sourceNumber!==surah.number)anomalies.push({kind:'surah-number',surah:surah.number,sourceNumber:surah.sourceNumber,line:index+1});}continue;}
 if(line.startsWith('*3*')){const number=+line.match(/ص\s*(\d+)/)?.[1];if(!number||!surah)throw Error('Invalid page marker at line '+(index+1));page=pages.find(p=>p.number===number);if(!page){page={number,juz,sections:[],issues:[]};pages.push(page);}section=page.sections.at(-1);if(!section||section.surah!==surah.number){section={surah:surah.number,name:surah.name,isStart:start,lines:[]};page.sections.push(section);}start=false;if(surah.firstPage===null)surah.firstPage=number;continue;}
 if(line.startsWith('*')||!line.trim())continue;
 if(!page||!section)throw Error('Text without page at line '+(index+1));
 const cleaned=line.replace(/^@\s*/,'');if(!cleaned.trim())continue;section.lines.push(cleaned);sourceLines.push(cleaned);
 for(const m of cleaned.matchAll(/([\{\(])(\d+)([\}\)])/g)){const n=+m[2];if(m[1]!=='{'||m[3]!=='}'||n!==lastVerse+1){const issue={kind:'verse-marker',surah:surah.number,page:page.number,previous:lastVerse,sourceMarker:m[0],line:index+1};page.issues.push(issue);anomalies.push(issue);}lastVerse=n;}
}
if(pages.length!==604||pages.some((p,i)=>p.number!==i+1)||surahs.length!==114)throw Error('Page/surah completeness check failed');
const reconstructed=pages.flatMap(p=>p.sections.flatMap(s=>s.lines)).join('\n');if(reconstructed!==sourceLines.join('\n'))throw Error('Page ordering or source text changed');
const report={source:'ARQURAN.TXT',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),pages:pages.length,surahs:surahs.length,textLines:sourceLines.length,losslessPageText:true,anomalies,validation:'Page order and all non-organizational source lines verified. This does not certify verse numbering, orthography, printed Madinah line layout, riwaya or licensing.',transformations:['Remove organizational *BOOK*, *1*, *2*, *3* lines from body','Remove leading @ separator and following whitespace only','Keep every non-empty body line, including malformed source markers, unchanged and in order']};
fs.writeFileSync('data/quran-pages.json',JSON.stringify({version:1,sourceHash:report.sha256,surahs,pages}));fs.writeFileSync('data/page-import-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({pages:pages.length,surahs:surahs.length,lines:sourceLines.length,lossless:true,anomalies:anomalies.length}));
