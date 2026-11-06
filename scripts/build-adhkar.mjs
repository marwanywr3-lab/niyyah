import fs from 'node:fs';
import crypto from 'node:crypto';
import {entries,categories} from '../data/adhkar-source.mjs';
const data={version:'1.0.0',checkedAt:'2026-11-06',scope:'مختارات من الأذكار والأدعية في الصحيحين، وليست حصرًا لجميع الأذكار أو نسخة كاملة من حصن المسلم',review:'مطابقة مصدرية وتقنية؛ لم تُنجز مراجعة شرعية مستقلة',categories,entries:entries.map(e=>({...e,sha256:crypto.createHash('sha256').update(e.text).digest('hex')}))};
fs.writeFileSync('data/adhkar.json',JSON.stringify(data,null,2));
const sql=s=>"'"+String(s).replaceAll("'","''")+"'";
const rows=data.entries.map(e=>`INSERT INTO content(id,kind,language,title,body,source,license,reviewer,status,version) VALUES(${["dhikr:"+e.id,'hadith','ar',e.title,JSON.stringify(e),JSON.stringify(e.source),e.rights.basis,'source comparison; independent scholar review pending','source_checked',1].map(sql).join(',')}) ON CONFLICT(id) DO UPDATE SET body=excluded.body,source=excluded.source,license=excluded.license,status=excluded.status,version=excluded.version;`);
fs.mkdirSync('seeds',{recursive:true});fs.writeFileSync('seeds/adhkar-v1.sql',rows.join('\n'));
console.log(`Prepared ${data.entries.length} source-checked classical Arabic entries and D1 seed`);
