import assert from 'node:assert/strict';import {religiousTopics,religiousAnswer,publishedEntries} from '../worker/religious-library.js';
import {handle} from '../worker/api.js';
assert.equal(publishedEntries.length,22);
for(const e of publishedEntries){const result=religiousAnswer('hadith_'+e.id);assert.ok(result.reply.includes(e.text));assert.equal(result.references.length,1);assert.equal(result.references[0].url,e.source.url);assert.equal(result.references[0].id,e.id);assert.equal(result.scope,'sourced-adhkar');}
assert.equal(religiousAnswer('hadith_invented'),null);assert.equal(religiousAnswer('https://evil.example'),null);assert.equal(religiousAnswer('__proto__'),null);assert.equal(religiousAnswer('adhkar_fatwa'),null);
const morning=religiousAnswer('adhkar_morning');assert.ok(morning.reply.includes('100'));assert.ok(morning.references.some(r=>r.id==='weight'));assert.ok(morning.references.every(r=>new URL(r.url).hostname==='sunnah.com'));
assert.ok(!Object.hasOwn(religiousTopics,'fatwa'));
const catalog=await handle(new Request('https://example.com/api/library'),{});assert.equal(catalog.status,200);assert.equal((await catalog.json()).entries.length,22);
console.log('Religious retrieval: exact stored text, correct reference mapping, unknown/hostile IDs rejected, category filtering and public catalog passed');
