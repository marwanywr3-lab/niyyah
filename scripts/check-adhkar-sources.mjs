import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import {entries} from '../data/adhkar-source.mjs';
const normalize=t=>t.normalize('NFKC').replace(/<[^>]*>/g,'').replace(/&[^;]+;/g,'').replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u202A-\u202E\uFEFF]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/[^\u0621-\u064A]/g,'');
const seen=new Set();for(const e of entries){assert.ok(!seen.has(e.id));seen.add(e.id);assert.ok(e.source.url.startsWith('https://sunnah.com/'));assert.ok(e.text.length>3);assert.ok(e.count===null||Number.isSafeInteger(e.count)&&e.count>0);assert.equal(e.review.independentScholarReview,false);}
const expected={'morning100':100,'evening100':100,'daily100':100,'after-forgive':3,'after-subhan':33,'after-hamd':33,'after-takbir':33,'after-tahlil':1,'weight':3};for(const e of entries)assert.equal(e.count,expected[e.id]??null,e.id);
if(process.argv.includes('--online')){
 fs.mkdirSync('../work/source-checks',{recursive:true});const results=[];
 for(const url of new Set(entries.map(e=>e.source.url))){const r=await fetch(url);if(!r.ok)throw Error('Source fetch failed '+r.status+' '+url);const html=await r.text();const plain=normalize(html);for(const e of entries.filter(e=>e.source.url===url)){const ok=plain.includes(normalize(e.text));results.push({id:e.id,url,matched:ok,textSha256:crypto.createHash('sha256').update(e.text).digest('hex')});}}
 fs.writeFileSync('../work/source-checks/adhkar-check.json',JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));const failed=results.filter(e=>!e.matched);console.log(JSON.stringify({verified:results.length-failed.length,failed}));assert.equal(failed.length,0,'Invocation text must occur in the linked source');
}else console.log('Adhkar metadata, unique IDs, source URLs and attested counts passed');
