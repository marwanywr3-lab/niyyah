const json=(x,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store'}});
export async function vault(request,body,user,db){
 if(request.method==='GET'){
  const record=await db.prepare('SELECT version,salt,iv,ciphertext,updated_at FROM vaults WHERE user_id=?').bind(user.id).first();
  const history=await db.prepare('SELECT version,updated_at FROM vault_history WHERE user_id=? ORDER BY version DESC').bind(user.id).all();
  return json({record,history:history.results||[]});
 }
 if(request.method!=='POST')return json({error:'POST required'},405);
 if(!Number.isSafeInteger(body.version)||body.version<0||!/^([a-f0-9]{2}){16}$/.test(body.salt)||!/^([a-f0-9]{2}){12}$/.test(body.iv)||!/^([a-f0-9]{2}){16,200000}$/.test(body.ciphertext))return json({error:'نسخة مشفرة غير صالحة'},400);
 const now=Date.now();
 const row=body.version===0?
 await db.prepare('INSERT INTO vaults(user_id,version,salt,iv,ciphertext,updated_at) VALUES(?,1,?,?,?,?) ON CONFLICT(user_id) DO NOTHING RETURNING version,updated_at').bind(user.id,body.salt,body.iv,body.ciphertext,now).first():
 await db.prepare('UPDATE vaults SET version=version+1,salt=?,iv=?,ciphertext=?,updated_at=? WHERE user_id=? AND version=? RETURNING version,updated_at').bind(body.salt,body.iv,body.ciphertext,now,user.id,body.version).first();
 if(row)return json(row);
 return json({error:'تغيّرت نسخة السحابة من جهاز آخر. أوقفنا الرفع لحماية بياناتك؛ افتح المزامنة لمراجعة النسختين.',code:'SYNC_CONFLICT'},409);
}
