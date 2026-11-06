import {validVerse} from '../data/verse-counts.mjs';
const $=s=>document.querySelector(s);
export function openSana({context,user,dialog,api,esc,account}){
 const verse=context?.kind==='verse';
 dialog('سَنا','<div class="sana-quick"><p>'+(verse?'عن الآية المختارة':'مساعدة قصيرة، أينما كنت')+'</p>'+(verse?'<div class="sana-reference"><label>رقم السورة<input id="quick-surah" type="number" min="1" max="114" value="'+context.surah+'"></label><label>رقم الآية<input id="quick-ayah" type="number" min="1" max="286" value="'+context.ayah+'"></label></div><p class="muted">المرجع من ترقيم ملفك الذي يحتاج مراجعة. تحقق منه أو عدّله قبل فتح التفسير.</p><button id="quick-tafsir" class="primary">اقرأ التفسير الميسر لهذه الآية</button><div id="quick-source"></div><hr>':'')+'<p>اسأل عن التطبيق أو الأذكار والمكتبة. '+(verse?'لمعنى الآية استخدم زر التفسير أعلاه.':'')+'</p>'+(!user?'<button id="quick-account">دخول للحديث مع سَنا</button>':'<form id="quick-form"><label>سؤالك<textarea id="quick-message" maxlength="240" required placeholder="اكتب سؤالًا قصيرًا…">'+(verse?'ما معنى هذه الآية؟':'')+'</textarea></label><label class="sana-consent"><input id="quick-consent" type="checkbox" required> أوافق على إرسال السؤال الحالي فقط إلى Google Gemini.</label><button id="quick-send" class="primary">إرسال</button></form>')+'<div id="quick-answer" role="status" aria-live="polite"></div><small>500 توكن كحد أقصى للطلب، شاملًا المدخلات والمخرجات. لا نرسل سجلاتك أو المحادثات السابقة.</small></div>');
 if(verse)$('#quick-tafsir').onclick=()=>{
  const surah=+$('#quick-surah').value,ayah=+$('#quick-ayah').value;
  if(!validVerse({surah,ayah})){$('#quick-source').textContent='تحقق من رقم السورة والآية';return;}
  $('#quick-source').innerHTML='<p>التفسير الميسر — موسوعة القرآن الكريم. النص كامل في مصدره دون إرسال إلى Gemini (0 توكن).</p><a class="tafsir-link" target="_blank" rel="noopener" href="https://quranenc.com/ar/browse/arabic_moyassar/'+surah+'/'+ayah+'">فتح تفسير الآية '+surah+':'+ayah+' ←</a>';
 };
 if(!user){$('#quick-account').onclick=account;return;}
 $('#quick-form').onsubmit=async e=>{
  e.preventDefault();const message=$('#quick-message').value.trim(),send=$('#quick-send'),answer=$('#quick-answer');if(!message)return;
  send.disabled=true;answer.textContent='جارٍ الرد…';
  try{const b=await api('sana',{message,consent:$('#quick-consent').checked,requestId:crypto.randomUUID(),...(verse&&/معنى|معني|تفسير|اشرح|شرح/.test(message)?{context:{kind:'verse',surah:+$('#quick-surah').value,ayah:+$('#quick-ayah').value}}:{})});answer.innerHTML='<article class="sana-turn"><strong>سَنا</strong><p>'+esc(b.reply)+'</p>'+(b.references||[]).map(r=>'<a target="_blank" rel="noopener" href="'+esc(r.url)+'">'+esc(r.title)+'</a>').join(' • ')+'<small>استهلاك الطلب: '+b.usage.chargedTokens+' / 500 توكن</small></article>';}
  catch(err){answer.textContent=err.message;}finally{send.disabled=false;}
 };
}
