import assert from 'node:assert/strict';
import {handle} from '../worker/api.js';
const r=await handle(new Request('https://example.com/api/me'),{DB:{}});assert.equal(r.status,401);
const cross=await handle(new Request('https://example.com/api/me',{headers:{Origin:'https://attacker.example'}}),{DB:{}});assert.equal(cross.status,403);
const allowed=await handle(new Request('https://example.com/api/health',{headers:{Origin:'https://marwanywr3-lab.github.io'}}),{DB:{}});assert.equal(allowed.headers.get('Access-Control-Allow-Origin'),'https://marwanywr3-lab.github.io');
const tooBig=await handle(new Request('https://example.com/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(500001)}),{DB:{}});assert.equal(tooBig.status,413);
const {default:worker}=await import('../worker/index.js');for(const p of ['/','/app.js','/style.css','/manifest.webmanifest','/quran.json']){const response=await worker.fetch(new Request('https://example.com'+p),{});assert.equal(response.status,200,p);}
console.log('Access isolation, CORS, body limit and built routes passed');
