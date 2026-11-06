const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const unhex=s=>Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16));
const encoder=new TextEncoder();
export function validState(s){return !!s&&typeof s==='object'&&!Array.isArray(s)&&!!s.prayers&&typeof s.prayers==='object'&&!Array.isArray(s.prayers)&&Array.isArray(s.notes)&&Array.isArray(s.duas)&&Array.isArray(s.bookmarks)&&s.notes.every(x=>x&&typeof x.id==='string'&&typeof x.text==='string')&&s.duas.every(x=>x&&typeof x.id==='string'&&typeof x.text==='string')&&s.bookmarks.every(x=>typeof x==='string');}
export async function vaultKey(pass,salt){
 if(typeof pass!=='string'||pass.length<16)throw Error('استخدم عبارة خزنة من 16 حرفًا على الأقل');
 const raw=await crypto.subtle.importKey('raw',encoder.encode(pass),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt:unhex(salt),iterations:250000,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export const newSalt=()=>hex(crypto.getRandomValues(new Uint8Array(16)));
export async function encryptState(state,key,salt){
 if(!validState(state))throw Error('بيانات الجهاز غير متوافقة');
 const iv=crypto.getRandomValues(new Uint8Array(12)),clear=encoder.encode(JSON.stringify(state));
 if(clear.length>199984)throw Error('النسخة كبيرة؛ صدّر نسخة احتياطية وقلّل حجم الملاحظات');
 return {salt,iv:hex(iv),ciphertext:hex(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,clear))};
}
export async function decryptState(record,key){
 try{const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unhex(record.iv)},key,unhex(record.ciphertext));const state=JSON.parse(new TextDecoder().decode(plain));if(!validState(state))throw Error();return state;}
 catch{throw Error('تعذر فتح النسخة؛ تحقق من عبارة الخزنة. بيانات الجهاز لم تتغير.');}
}
