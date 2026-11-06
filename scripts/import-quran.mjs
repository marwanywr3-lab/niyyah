import fs from 'node:fs';
import crypto from 'node:crypto';
const source=process.argv[2];
if(!source) throw Error('Supply the approved ARQURAN.TXT path');
const bytes=fs.readFileSync(source), text=bytes.toString('utf8');
const surahs=[]; let current=null, buffer='',page=0,juz=0,issues=[];
function consume(){if(!current)return; let m; while((m=/([\s\S]*?)\{(\d+)\}/.exec(buffer))){const n=Number(m[2]);current.verses.push({number:n,text:m[1].trim(),page,juz});buffer=buffer.slice(m[0].length);}}
for(const line of text.split(/\r?\n/)){
 if(line.startsWith('*2*')&&!/^\*2\*[.\s]*\d/.test(line))continue;
 if(line.startsWith('*2*')){if(buffer.trim())issues.push({surah:current?.number,trailing:buffer.trim()});buffer='';const m=line.match(/\*2\*[.\s]*(\d+)[.\s]+(?:سورة\s*)?(.*)/);if(!m)throw Error(line);current={number:+m[1],name:m[2].trim(),verses:[]};surahs.push(current);continue;}
 if(line.startsWith('*1*')){juz++;continue;}
 if(line.startsWith('*3*')){const m=line.match(/ص\s*(\d+)/);if(m)page=+m[1];continue;}
 if(line.startsWith('*'))continue;
 if(current){buffer+=(buffer?'\n':'')+line.replace(/^@\s*/,'');consume();}
}
if(buffer.trim())issues.push({trailing:buffer.trim()});
for(const s of surahs)for(let i=0;i<s.verses.length;i++)if(s.verses[i].number!==i+1)issues.push({surah:s.number,index:i,number:s.verses[i].number});
const count=surahs.reduce((n,s)=>n+s.verses.length,0);
const report={source:'ARQURAN.TXT',edition:'2.08 (file header)',sha256:crypto.createHash('sha256').update(bytes).digest('hex'),surahs:surahs.length,verses:count,issues,review:'Structural validation only; licensing and independent textual review pending',whitespace:'Line breaks preserved within each verse; only surrounding whitespace and organizational markers removed; initial basmala remains with first numbered verse where present in source'};
fs.mkdirSync('data',{recursive:true});fs.writeFileSync('data/quran.json',JSON.stringify(surahs));fs.writeFileSync('data/import-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,issues:issues.slice(0,5)}));
if(surahs.length!==114||count!==6236||issues.length)process.exitCode=1;

