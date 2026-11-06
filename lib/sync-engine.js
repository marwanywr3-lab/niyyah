import {vaultKey,newSalt,encryptState,decryptState} from './vault-crypto.js';
export class SyncEngine{
 constructor({api,getState,applyState,backup,onStatus}){Object.assign(this,{api,getState,applyState,backup,onStatus});this.lock();}
 lock(){clearTimeout(this.timer);clearInterval(this.poller);this.epoch=(this.epoch||0)+1;this.key=null;this.enabled=false;this.busy=false;this.dirty=0;this.version=0;this.status='المزامنة مقفلة';this.onStatus?.(this.status);}
 statusText(text){this.status=text;this.onStatus?.(text);}
 async inspect(pass){
  const epoch=this.epoch;const {record,history}=await this.api('vault');const salt=record?.salt||newSalt(),key=await vaultKey(pass,salt),remote=record?await decryptState(record,key):null;
  if(epoch!==this.epoch)throw Error('تغير الحساب؛ افتح المزامنة مجددًا');
  return {record,history,salt,key,remote,epoch};
 }
 async start(prepared,choice){
  if(prepared.epoch!==this.epoch)throw Error('تغير الحساب؛ افتح المزامنة مجددًا');
  const epoch=this.epoch;
  this.key=prepared.key;this.salt=prepared.salt;this.version=prepared.record?.version||0;
  if(choice==='remote'){
   if(!prepared.remote)throw Error('لا توجد نسخة سحابية بعد');
   this.backup(this.getState());this.applyState(prepared.remote);this.dirty=0;
  }else{
   // The user explicitly chose this device. CAS below protects changes since the preview.
   this.dirty++;
  }
  this.enabled=true;
  if(this.dirty)await this.flush();
  if(epoch!==this.epoch)return;
  if(this.enabled){this.statusText('المزامنة مفعّلة');this.poller=setInterval(()=>this.refresh(),30000);}
 }
 changed(){if(!this.enabled)return;this.dirty++;clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),1500);}
 pause(message){this.enabled=false;clearTimeout(this.timer);clearInterval(this.poller);this.statusText(message);}
 async flush(){
  if(!this.enabled||this.busy||!this.dirty)return;
  const epoch=this.epoch,tick=this.dirty,key=this.key,version=this.version,salt=this.salt;
  this.busy=true;this.statusText('جارٍ حفظ نسخة مشفرة…');
  try{
   const sealed=await encryptState(this.getState(),key,salt);
   if(epoch!==this.epoch||!this.enabled)return;
   const result=await this.api('vault',{version,...sealed});
   if(epoch!==this.epoch)return;
   this.version=result.version;this.dirty-=tick;this.statusText('حُفظت النسخة المشفرة');
  }catch(error){if(epoch===this.epoch){if(error.status===409||error.status===401)this.pause(error.message);else this.statusText('لم تتم المزامنة؛ بياناتك محفوظة على الجهاز. أعد المحاولة عند الاتصال.');}}
  finally{if(epoch===this.epoch){this.busy=false;if(this.dirty&&this.enabled)this.timer=setTimeout(()=>this.flush(),10000);}}
 }
 async refresh(){
  if(!this.enabled||this.busy||this.dirty||globalThis.document?.hidden)return;
  const epoch=this.epoch,tick=this.dirty;this.busy=true;
  try{const {record}=await this.api('vault');if(epoch!==this.epoch||!this.enabled||!record||record.version===this.version)return;
   const remote=await decryptState(record,this.key);
   if(epoch!==this.epoch||!this.enabled)return;
   if(this.dirty!==tick){this.pause('تغيّرت بيانات الجهاز والسحابة معًا. افتح المزامنة لمراجعة النسختين.');return;}
   this.backup(this.getState());this.applyState(remote);this.version=record.version;this.statusText('استُعيدت آخر تغييراتك من السحابة');
  }catch(error){if(epoch===this.epoch)this.statusText('تعذر التحقق من السحابة؛ نسخة الجهاز محفوظة');}
  finally{if(epoch===this.epoch)this.busy=false;}
 }
}
