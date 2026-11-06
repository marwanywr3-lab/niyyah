import {entries,categories} from '../data/adhkar-source.mjs';
import {knowledge} from '../data/knowledge-source.mjs';
export const publishedEntries=entries.filter(e=>e.status==='source_checked');
export const religiousTopics=Object.fromEntries([
 ...Object.entries(categories).filter(([id])=>id!=='all').map(([id,title])=>['adhkar_'+id,'أذكار وأدعية: '+title]),
 ...publishedEntries.map(e=>['hadith_'+e.id,e.title]),
 ...knowledge.map(e=>['knowledge_'+e.id,e.title])
]);
export function religiousAnswer(topic){
 const item=topic.startsWith('knowledge_')?knowledge.find(e=>e.id===topic.slice(10)&&e.status==='source_checked'):null;
 if(item)return {reply:item.title+'\n\n'+item.text+'\n\n'+item.note+'\nالمصدر: '+item.source.collection+'، الحديث '+item.source.number+'.',references:[{id:item.id,title:item.source.collection+' '+item.source.number,url:item.source.url}],source:'مادة موثقة بالمصدر؛ المراجعة الشرعية المستقلة لم تُنجز',scope:'sourced-knowledge'};
 let selected=[];
 if(topic.startsWith('adhkar_'))selected=publishedEntries.filter(e=>e.categories.includes(topic.slice(7)));
 if(topic.startsWith('hadith_'))selected=publishedEntries.filter(e=>e.id===topic.slice(7));
 if(!selected.length)return null;
 return {reply:'من مختارات المكتبة الموثقة بالمصدر (ليست قائمة شاملة):\n\n'+selected.map((e,i)=>`${i+1}. ${e.title}\n${e.text}\n${e.count!==null?'العدد الوارد: '+e.count+'\n':''}${e.countEvidence}\nالمصدر: ${e.source.collection}، الحديث ${e.source.number}.`).join('\n\n'),references:selected.map(e=>({id:e.id,title:e.source.collection+' '+e.source.number,url:e.source.url})),source:'المأثور العربي من الصحيحين — مطابقة مصدرية، والمراجعة الشرعية المستقلة لم تُنجز',scope:'sourced-adhkar'};
}
