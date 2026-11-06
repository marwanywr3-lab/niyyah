import {spreadPages,turnTarget,useFacingPages,swipeTurn} from '../lib/mushaf-navigation.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>s.normalize('NFD').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/\s+/g,' ').trim();
const fullscreenIcon='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
export function pageTextMarkup(text,surah){return esc(text).replace(/\{(\d+)\}/g,(_,n)=>'<button class="mushaf-stop" data-sana-surah="'+surah+'" data-sana-ayah="'+n+'" aria-label="اسأل سَنا عن الآية '+n+' حسب ترقيم الملف">'+Number(n).toLocaleString('ar-SA')+'</button>').replace(/\{\s*س\s*\}/g,'<span class="sajdah" title="علامة سجدة من الملف">۩</span>');}
function pageHTML(p,selected,bookmarks){
 return '<article class="mushaf-page '+(p.number%2?'right-page':'left-page')+'" data-mushaf-page="'+p.number+'" aria-label="صفحة '+p.number+'"'+(selected===p.number?' data-current="true"':'')+'><div class="mushaf-inner"><div class="mushaf-running"><span>'+p.sections.map(s=>esc(s.name)).join(' • ')+'</span><span>الجزء '+p.juz+'</span><button class="mushaf-page-save" data-bookmark-page="'+p.number+'" aria-pressed="'+bookmarks.includes(p.number)+'" aria-label="'+(bookmarks.includes(p.number)?'إلغاء حفظ':'حفظ')+' الصفحة '+p.number+'">'+(bookmarks.includes(p.number)?'◆ محفوظة':'◇ حفظ')+'</button></div>'+p.sections.map(s=>'<section class="mushaf-section" data-mushaf-surah="'+s.surah+'">'+(s.isStart?'<h2 class="mushaf-surah">سورة '+esc(s.name)+'</h2>':'')+s.lines.map(line=>plain(line)==='بسم الله الرحمن الرحيم'&&s.surah!==1?'<p class="mushaf-basmala">'+esc(line)+'</p>':'<div class="mushaf-line">'+pageTextMarkup(line,s.surah)+'</div>').join('')+'</section>').join('')+'<div class="mushaf-page-number">'+p.number.toLocaleString('ar-SA')+'</div></div></article>';
}
export class MushafReader{
 constructor(options){
  Object.assign(this,options);this.page=Math.max(1,Math.min(604,+this.page||1));this.events=new AbortController();this.full=false;this.fallback=false;
  this.host.innerHTML='<section id="mushaf-reader" class="mushaf-reader"><div class="mushaf-content"></div><div class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div></section>';
  this.root=this.host.querySelector('#mushaf-reader');this.content=this.root.querySelector('.mushaf-content');this.announcer=this.root.querySelector('[role=status]');this.modal=document.querySelector('#modal');
  const signal=this.events.signal;
  window.addEventListener('resize',()=>this.resize(),{signal});
  document.addEventListener('fullscreenchange',()=>this.fullscreenChanged(),{signal});
  document.addEventListener('keydown',e=>this.keydown(e),{signal});
  this.root.addEventListener('pointerdown',e=>this.pointerDown(e),{signal});
  window.addEventListener('pointermove',e=>this.pointerMove(e),{signal,passive:false});
  window.addEventListener('pointerup',e=>this.pointerUp(e),{signal});
  window.addEventListener('pointercancel',()=>this.cancelPointer(),{signal});
  this.root.addEventListener('click',e=>{if(this.suppressClick&&e.target.closest('#mushafsurface')){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,signal});
  this.paired=this.layout();this.draw();
  if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.root);}
 }
 layout(){return useFacingPages(window.innerWidth,window.innerHeight,this.root.clientWidth);}
 resize(){cancelAnimationFrame(this.resizeFrame);this.resizeFrame=requestAnimationFrame(()=>{if(!this.root.isConnected)return;const paired=this.layout();if(paired!==this.paired){this.paired=paired;this.draw();}});}
 range(){const pages=spreadPages(this.page,this.paired);return pages.length===2?'الصفحتان '+pages[0]+'–'+pages[1]:'الصفحة '+pages[0];}
 draw(){
  const focused=document.activeElement?.id,open=this.content.querySelector('#mushaf-options')?.open||false;
  this.drawEvents?.abort();this.drawEvents=new AbortController();const signal=this.drawEvents.signal;
  const indices=spreadPages(this.page,this.paired),pages=indices.map(n=>this.book.pages[n-1]),p=this.book.pages[this.page-1];
  const activeSurah=p.sections.some(s=>s.surah===+this.surah)?+this.surah:p.sections[0].surah;this.surah=activeSurah;
  this.onPosition(this.page,activeSurah);
  const back=turnTarget(this.page,-1,this.paired),next=turnTarget(this.page,1,this.paired),previousLabel=this.paired?'الصفحتان السابقتان':'الصفحة السابقة',nextLabel=this.paired?'الصفحتان التاليتان':'الصفحة التالية';
  this.content.innerHTML='<div class="section-title mushaf-heading"><div><span class="eyebrow">القرآن الكريم</span><h1>المصحف</h1></div><button id="continuousview">عرض الآيات والدراسة</button></div><div class="mushaf-commandbar"><button id="previouspage" data-turn="-1" aria-label="'+previousLabel+'" '+(back===null?'disabled':'')+'>→ <span>السابق</span></button><span class="mushaf-range">'+this.range()+' <small>من 604</small></span><button id="nextpage" data-turn="1" aria-label="'+nextLabel+'" '+(next===null?'disabled':'')+'><span>التالي</span> ←</button><button id="mushaf-fullscreen" class="mushaf-fullscreen" aria-label="'+(this.full?'الخروج من ملء الشاشة':'ملء الشاشة')+'" title="'+(this.full?'الخروج من ملء الشاشة':'ملء الشاشة')+'" aria-pressed="'+this.full+'">'+fullscreenIcon+'<span class="fullscreen-caption">'+(this.full?'خروج':'ملء الشاشة')+'</span></button></div><details id="mushaf-options" class="mushaf-options" '+(open?'open':'')+'><summary>السورة والجزء وحجم الخط</summary><div class="mushaf-tools"><label>السورة<select id="mushafsurah">'+this.book.surahs.map(s=>'<option value="'+s.number+'" '+(s.number===activeSurah?'selected':'')+'>'+s.number+'. '+esc(s.name)+'</option>').join('')+'</select></label><label>الجزء<select id="mushafjuz">'+Array.from({length:30},(_,i)=>'<option value="'+(i+1)+'" '+(p.juz===i+1?'selected':'')+'>'+(i+1)+'</option>').join('')+'</select></label><label>الصفحة<input id="mushafnumber" type="number" inputmode="numeric" min="1" max="604" value="'+this.page+'"></label><button id="gotopage">انتقال</button><label class="mushaf-size">حجم الخط<input type="range" id="mushafscale" min="0.85" max="1.4" step="0.05" value="'+this.getScale()+'"></label><button id="downloadpages">حفظ دون اتصال</button><p id="mushaf-jump-error" role="alert"></p></div></details><p class="mushaf-gesture-hint">'+(this.paired?'وجهان متقابلان':'وجه واحد')+' • اسحب لليسار للتالي، ولليمين للسابق</p><div id="mushafsurface" class="mushaf-spread '+(this.paired?'is-paired':'is-single')+'" style="--reading-scale:'+this.getScale()+'" tabindex="0" aria-label="'+this.range()+'؛ اسحب أو استخدم سهمي لوحة المفاتيح">'+pages.map(page=>pageHTML(page,this.page,this.getBookmarks())).join('')+'</div><div class="mushaf-bottom-nav"><button data-turn="-1" aria-label="'+previousLabel+' من أسفل المصحف" '+(back===null?'disabled':'')+'>→ السابق</button><span>'+this.range()+'</span><button data-turn="1" aria-label="'+nextLabel+' من أسفل المصحف" '+(next===null?'disabled':'')+'>التالي ←</button></div><div class="mushaf-foot"><p>تنسيق صفحات من ملف ARQURAN.TXT وخط Amiri Quran. ليس صورة أو مطابقة طباعية لمصحف المدينة. النص وترقيمه يحتاجان مراجعة مستقلة. <a href="page-import-report.json" target="_blank" rel="noopener">تفاصيل المصدر والمطابقة</a></p>'+(pages.some(x=>x.issues.length)?'<p class="notice">يوجد ترقيم غير منتظم في مصدر بعض الصفحات المعروضة؛ أُبقي كما ورد دون تصحيح صامت.</p>':'')+'</div>';
  const $=s=>this.content.querySelector(s),on=(s,type,fn)=>$(s).addEventListener(type,fn,{signal});
  this.content.querySelectorAll('[data-turn]').forEach(b=>b.addEventListener('click',()=>this.turn(+b.dataset.turn),{signal}));
  this.content.querySelectorAll('[data-sana-ayah]').forEach(b=>b.addEventListener('click',()=>this.onAsk({kind:'verse',surah:+b.dataset.sanaSurah,ayah:+b.dataset.sanaAyah}),{signal}));
  this.content.querySelectorAll('[data-bookmark-page]').forEach(b=>b.addEventListener('click',()=>{this.onBookmark(+b.dataset.bookmarkPage);this.draw();},{signal}));
  on('#gotopage','click',()=>this.jump(+$('#mushafnumber').value));
  on('#mushafnumber','keydown',e=>{if(e.key==='Enter'){e.preventDefault();this.jump(+e.target.value);}});
  on('#mushafsurah','change',e=>this.go(this.book.surahs.find(s=>s.number===+e.target.value).firstPage,+e.target.value));
  on('#mushafjuz','change',e=>this.go(this.book.pages.find(x=>x.juz===+e.target.value).number));
  on('#continuousview','click',()=>this.onStudy(this.surah));
  on('#mushafscale','input',e=>{this.onScale(+e.target.value);$('#mushafsurface').style.setProperty('--reading-scale',+e.target.value);});
  on('#downloadpages','click',()=>this.onDownload());
  on('#mushaf-fullscreen','click',()=>this.toggleFullscreen());
  if(focused){const target=this.content.querySelector('#'+CSS.escape(focused));target?.focus({preventScroll:true});}
  this.announcer.textContent=this.range()+' من 604';
 }
 jump(n){if(!Number.isInteger(n)||n<1||n>604){this.content.querySelector('#mushaf-jump-error').textContent='أدخل رقم صفحة من 1 إلى 604';return;}this.go(n);}
 go(n,surah=null){if(!Number.isInteger(n)||n<1||n>604)return;this.page=n;this.surah=surah;this.draw();this.content.querySelector('#mushafsurface').scrollIntoView({block:'start',behavior:'instant'});}
 turn(direction){const target=turnTarget(this.page,direction,this.paired);if(target!==null)this.go(target);}
 keydown(e){
  if(this.modal?.open||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||e.target.isContentEditable||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==='Escape'&&this.fallback){e.preventDefault();this.leaveFocus();return;}
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();this.turn(e.key==='ArrowLeft'?1:-1);}
 }
 pointerDown(e){
  if(e.isPrimary===false){if(this.pointer)this.pointer.multiple=true;return;}
  if(e.button!==0||this.modal?.open||!e.target.closest('#mushafsurface')||e.target.closest('a,input,select,textarea,.mushaf-page-save'))return;
  this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),type:e.pointerType};
  // A mouse can drag the sheet; touch remains native for vertical scroll and pinch zoom.
  if(e.pointerType==='mouse')e.preventDefault();
 }
 pointerMove(e){
  if(!this.pointer||e.pointerId!==this.pointer.id)return;
  const dx=e.clientX-this.pointer.x,dy=e.clientY-this.pointer.y;
  if(Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.5){this.root.classList.add('is-swiping');if(e.cancelable)e.preventDefault();}
 }
 pointerUp(e){
  if(!this.pointer||e.pointerId!==this.pointer.id)return;
  const direction=swipeTurn(this.pointer,{x:e.clientX,y:e.clientY,time:performance.now()});this.cancelPointer();
  if(direction){this.suppressClick=true;clearTimeout(this.clickTimer);this.clickTimer=setTimeout(()=>this.suppressClick=false,350);this.turn(direction);}
 }
 cancelPointer(){this.pointer=null;this.root.classList.remove('is-swiping');}
 moveModal(){if(this.modal&&!this.root.contains(this.modal))this.root.appendChild(this.modal);}
 restoreModal(){if(this.modal&&this.root.contains(this.modal))document.body.appendChild(this.modal);}
 async toggleFullscreen(){
  if(this.full){if(document.fullscreenElement===this.root){try{await document.exitFullscreen();}catch{this.leaveFocus();}}else this.leaveFocus();return;}
  this.moveModal();
  if(document.fullscreenEnabled&&this.root.requestFullscreen){try{await this.root.requestFullscreen();return;}catch{}}
  this.fallback=true;this.full=true;this.root.classList.add('is-focus');document.body.classList.add('mushaf-fullscreen-active');this.draw();this.root.scrollTop=0;
 }
 fullscreenChanged(){
  if(document.fullscreenElement===this.root){this.full=true;document.body.classList.add('mushaf-fullscreen-active');this.moveModal();this.paired=this.layout();this.draw();this.root.scrollTop=0;}
  else if(this.full&&!this.fallback)this.leaveFocus();
 }
 leaveFocus(){this.full=false;this.fallback=false;this.root.classList.remove('is-focus');document.body.classList.remove('mushaf-fullscreen-active');this.restoreModal();this.paired=this.layout();this.draw();}
 destroy(){
  this.events.abort();this.drawEvents?.abort();this.observer?.disconnect();cancelAnimationFrame(this.resizeFrame);clearTimeout(this.clickTimer);this.restoreModal();
  if(document.fullscreenElement===this.root)document.exitFullscreen().catch(()=>{});
  document.body.classList.remove('mushaf-fullscreen-active');this.root.classList.remove('is-focus');
 }
}
