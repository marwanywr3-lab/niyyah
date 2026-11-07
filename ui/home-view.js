import {uiIcon} from './icons.js';
export function homeMarkup({p,tomorrow,state,labels,fmt,esc}){
 const next=p.nextPrayer(),time=next?p.timeForPrayer(next):tomorrow.fajr;
 return `<div class="intro home-intro"><h1>يومك في نِيّة</h1><p>مواقيتك وقراءتك، من مكان واحد.</p></div>
 <div class="install-section" id="install-section"><div class="install-copy"><strong>نِيّة أقرب إليك</strong><p>أضف التطبيق إلى شاشتك الرئيسية.</p></div><button id="install-niyyah" class="install-button"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3"/></svg><span>تحميل نِيّة</span></button></div>
 <div class="grid home-grid">
 <section class="card prayer"><div class="row"><span>الصلاة القادمة</span><button id="city">${esc(state.city)}</button></div>
 <div class="prayer-main"><h2>${labels[next]||'الفجر غدًا'}</h2><div class="big">${time?fmt(time):'—'}</div></div>
 <p id="next-prayer-remaining">${time?'متبقي '+Math.max(0,Math.ceil((time-new Date())/60000))+' دقيقة':'اكتملت مواقيت اليوم'}</p>
 <div class="times">${Object.entries(labels).map(([k,l])=>`<div class="${next===k?'current':''}"><small>${l}</small><strong>${fmt(p[k])}</strong></div>`).join('')}</div>
 <small>${esc(state.city)} • ${esc(state.method)} • توقيت الجهاز</small></section>
 <section class="card verse"><div class="reading-label">${uiIcon('quran')}<span>القرآن الكريم</span></div><h2>متابعة القراءة</h2>
 <p>${state.lastPage?'آخر موضع: الصفحة '+esc(state.lastPage):'افتح المصحف وابدأ من الموضع الذي تختاره.'}</p>
 <button class="primary" id="resume">افتح المصحف <span aria-hidden="true">←</span></button><small>النص قيد المراجعة؛ تفاصيل المصدر داخل المصحف.</small></section>
 <section class="home-shortcut"><div><h2>عباداتي</h2><p>سجل الصلاة، الأذكار ودعواتك الخاصة.</p></div><button data-go="2">فتح عباداتي <span aria-hidden="true">←</span></button></section>
 <section class="home-shortcut sana-card"><div class="mascot"><i></i><i></i></div><div><h2>سَنا</h2><p>المساعدة في التطبيق والبحث في المكتبة الموثقة.</p></div><button data-go="4">تحدث مع سَنا <span aria-hidden="true">←</span></button></section>
 </div><div class="local-data-note"><span>الحفظ على هذا الجهاز</span><p>تجد تصدير بياناتك والنسخ الاحتياطي في الإعدادات.</p></div>`;
}
