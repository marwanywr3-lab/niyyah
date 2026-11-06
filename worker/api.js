import {sana,apiKeys} from './sana.js';
import {publishedEntries} from './religious-library.js';
import {knowledge} from '../data/knowledge-source.mjs';
import {discoverArticles} from '../data/discover-source.mjs';
const json=(x,status=200,headers={})=>new Response(JSON.stringify(x),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store',...headers}});
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const digest=async s=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
async function hash(password,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},k,256));}
function equal(a,b){let v=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)v|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return v===0;}
export async function handle(request,env){
 const url=new URL(request.url),origin=request.headers.get('origin');
 const allowed=[url.origin,'https://niyyah.marwanbarbood.com','https://marwanywr3-lab.github.io'];
 if(origin&&!allowed.includes(origin))return json({error:'Origin rejected'},403);
 const cors=origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}:{};
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 let result;try{result=await api(request,env,url);}catch{result=json({error:'الخدمة غير متاحة مؤقتًا'},503);}for(const [k,v]of Object.entries(cors))result.headers.set(k,v);result.headers.set('X-Content-Type-Options','nosniff');return result;
}
async function api(request,env,url){
 const path=url.pathname.slice(5);
 if(path==='health')return json({ok:true,database:!!env.DB,aiEnabled:!!apiKeys(env).length&&env.SANA_DISABLED!=='true',aiScope:'app-support-and-sourced-adhkar',model:'gemini-3.5-flash-lite',libraryEntries:publishedEntries.length,version:'0.4.0',requestTokenLimit:500});
 if(path==='library'&&request.method==='GET')return json({version:'1.1.0',review:'source_checked; independent scholar review pending',entries:publishedEntries,knowledge,discover:discoverArticles});
 if(!env.DB)return json({error:'قاعدة البيانات لم تُربط بعد'},503);
 const db=env.DB;
 let body={};if(request.method==='POST'){if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON required'},415);const text=await request.text();if(text.length>500000)return json({error:'الطلب كبير جدًا'},413);try{body=JSON.parse(text);}catch{return json({error:'JSON غير صالح'},400);}}
 if(['register','login','recover'].includes(path)){
  if(request.method!=='POST')return json({error:'POST required'},405);
  const ip=await digest(request.headers.get('cf-connecting-ip')||'unknown');const bucket=Math.floor(Date.now()/900000);const rk=ip+':'+bucket;
  const rate=await db.prepare('INSERT INTO rate_limits(key,count) VALUES(?,1) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(rk).first();if(rate.count>15)return json({error:'محاولات كثيرة. انتظر 15 دقيقة'},429);
  const username=String(body.username||'').toLowerCase(),password=String(body.password||'');if(!/^[a-z0-9_]{3,30}$/.test(username)||password.length<12||password.length>128)return json({error:'اسم من 3–30 حرفًا إنجليزيًا ورقمًا وشرطة سفلية، وكلمة مرور من 12–128 حرفًا'},400);
  let user=await db.prepare('SELECT * FROM users WHERE username=?').bind(username).first(),recoveryCode;
  if(path==='register'){if(user)return json({error:'تعذر إنشاء الحساب بهذا الاسم'},400);const salt=random(),id=crypto.randomUUID();recoveryCode=random();await db.prepare('INSERT INTO users(id,username,password_hash,salt,recovery_hash,created_at) VALUES(?,?,?,?,?,?)').bind(id,username,await hash(password,salt),salt,await digest(recoveryCode),new Date().toISOString()).run();user={id,username};}
  else if(path==='recover'){if(!user||!equal(user.recovery_hash,await digest(String(body.recoveryCode||''))))return json({error:'بيانات الاستعادة غير صحيحة'},401);const salt=random();recoveryCode=random();await db.batch([db.prepare('UPDATE users SET password_hash=?,salt=?,recovery_hash=? WHERE id=?').bind(await hash(password,salt),salt,await digest(recoveryCode),user.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id)]);}
  else {const salt=user?.salt||'dummy-salt';const h=await hash(password,salt);if(!user||!equal(user.password_hash,h))return json({error:'اسم المستخدم أو كلمة المرور غير صحيحة'},401);}
  const token=random();await db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await digest(token),user.id,Date.now()+86400000).run();return json({token,user:{id:user.id,username:user.username},...(recoveryCode?{recoveryCode}:{})});
 }
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)return json({error:'سجل الدخول أولًا'},401);
 const user=await db.prepare('SELECT u.id,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token),Date.now()).first();if(!user)return json({error:'انتهت الجلسة'},401);
 if(path==='me'&&request.method==='GET')return json({user});
 if(path==='sana/status'&&request.method==='GET'){
  if(!env.GEMINI_API_KEY)return json({configured:false},503);
  const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models',{headers:{'x-goog-api-key':env.GEMINI_API_KEY}});if(!r.ok)return json({configured:true,providerStatus:r.status},502);
  const data=await r.json();return json({configured:true,models:data.models?.filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name).filter(n=>n.includes('flash'))||[]});
 }
 if(path==='logout'&&request.method==='POST'){await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();return json({ok:true});}
 if(path==='vault'&&request.method==='GET'){const record=await db.prepare('SELECT version,salt,iv,ciphertext FROM vaults WHERE user_id=?').bind(user.id).first();return json({record});}
 if(path==='vault'&&request.method==='POST'){
  if(!Number.isSafeInteger(body.version)||body.version<0||!/^\w{32}$/.test(body.salt)||!/^\w{24}$/.test(body.iv)||!/^([a-f0-9]{2}){16,200000}$/.test(body.ciphertext))return json({error:'نسخة غير صالحة'},400);
  const row=await db.prepare('INSERT INTO vaults(user_id,version,salt,iv,ciphertext) SELECT ?,1,?,?,? WHERE ?=0 ON CONFLICT(user_id) DO UPDATE SET version=version+1,salt=excluded.salt,iv=excluded.iv,ciphertext=excluded.ciphertext WHERE vaults.version=? RETURNING version').bind(user.id,body.salt,body.iv,body.ciphertext,body.version,body.version).first();
  // Existing rows must use a conditional update when version > 0.
  if(!row&&body.version>0){const updated=await db.prepare('UPDATE vaults SET version=version+1,salt=?,iv=?,ciphertext=? WHERE user_id=? AND version=? RETURNING version').bind(body.salt,body.iv,body.ciphertext,user.id,body.version).first();if(updated)return json(updated);}
  return row?json(row):json({error:'تعارض إصدارات؛ لم يتم استبدال نسخة الخادم'},409);
 }
 if(path==='account/delete'&&request.method==='POST'){const u=await db.prepare('SELECT password_hash,salt FROM users WHERE id=?').bind(user.id).first();if(!equal(u.password_hash,await hash(String(body.password||''),u.salt)))return json({error:'كلمة المرور غير صحيحة'},401);await db.batch([db.prepare('DELETE FROM vaults WHERE user_id=?').bind(user.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id),db.prepare('DELETE FROM users WHERE id=?').bind(user.id)]);return json({ok:true});}
 if(path==='sana')return sana(request,body,user,env);
 return json({error:'Not found'},404);
}
