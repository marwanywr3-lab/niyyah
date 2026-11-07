import assert from 'node:assert/strict';
import {spreadPages,turnTarget,useFacingPages,swipeTurn} from '../lib/mushaf-navigation.js';
import {pageTextMarkup,MushafReader} from '../ui/mushaf-reader.js';
const all=[];for(let page=1;page<=604;page+=2)all.push(...spreadPages(page,true));
assert.deepEqual(all,Array.from({length:604},(_,i)=>i+1),'Every source page must appear exactly once in a complete two-face traversal');
assert.deepEqual(spreadPages(2,true),[1,2]);assert.deepEqual(spreadPages(604,true),[603,604]);assert.deepEqual(spreadPages(604,false),[604]);
assert.equal(turnTarget(2,-1,true),null);assert.equal(turnTarget(604,1,true),null);assert.equal(turnTarget(604,1,false),null);assert.equal(turnTarget(1,-1,false),null);
assert.equal(turnTarget(2,1,true),3);assert.equal(turnTarget(602,1,true),603);assert.equal(turnTarget(603,-1,true),601);assert.equal(turnTarget(2,1,false),3);
for(let page=1;page<=604;page++){
 assert.ok(spreadPages(page,true).includes(page),'Rotating the viewport may not lose the selected source page');
 assert.ok(spreadPages(page,false).includes(page));
}
assert.deepEqual(spreadPages(603,true,603),[603]);
for(const [w,h,available,expected] of [[360,740,328,false],[390,844,358,false],[568,320,536,true],[667,375,635,true],[600,900,568,true],[768,1024,736,true],[720,900,688,true],[1366,900,1098,true],[1366,900,420,false]])assert.equal(useFacingPages(w,h,available),expected,w+'x'+h);
const start={x:250,y:300,time:0};
assert.equal(swipeTurn(start,{x:110,y:308,time:300}),1);assert.equal(swipeTurn(start,{x:370,y:310,time:400}),-1);assert.equal(swipeTurn(start,{x:110,y:308,time:300},true),-1);assert.equal(swipeTurn(start,{x:370,y:310,time:400},true),1);assert.equal(turnTarget(3,swipeTurn(start,{x:110,y:308,time:300},true),true),1);assert.equal(turnTarget(3,swipeTurn(start,{x:370,y:310,time:400},true),true),5);
for(const end of [{x:210,y:300,time:100},{x:180,y:410,time:300},{x:100,y:300,time:1200},{x:100,y:300,time:250,cancelled:true}])assert.equal(swipeTurn(start,end),0);
assert.equal(swipeTurn({...start,multiple:true},{x:100,y:300,time:200}),0);
const html=pageTextMarkup('نص <script> {12} (5} {س}',2);assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('data-sana-surah="2"'));assert.ok(html.includes('data-sana-ayah="12"'));assert.ok(html.includes('(5}'),'Malformed source text is preserved, never corrected');
const turns=[];const mocked={root:{classList:{add(){},remove(){}}},modal:null,turn:d=>turns.push(d),cancelPointer:MushafReader.prototype.cancelPointer};
mocked.pointer={...start,id:1,time:performance.now()-100};MushafReader.prototype.pointerUp.call(mocked,{pointerId:1,clientX:100,clientY:300});assert.deepEqual(turns,[1]);assert.equal(mocked.pointer,null);clearTimeout(mocked.clickTimer);
mocked.paired=true;mocked.pointer={...start,id:1,time:performance.now()-100};MushafReader.prototype.pointerUp.call(mocked,{pointerId:1,clientX:100,clientY:300});assert.deepEqual(turns,[1,-1]);clearTimeout(mocked.clickTimer);
mocked.pointer={...start,id:1,time:performance.now()-100,multiple:true};MushafReader.prototype.pointerUp.call(mocked,{pointerId:1,clientX:100,clientY:300});assert.deepEqual(turns,[1,-1]);
const targeted={closest:selector=>selector==='#mushafsurface'?{}:null};
MushafReader.prototype.pointerDown.call(mocked,{isPrimary:true,button:0,pointerId:2,pointerType:'touch',clientX:250,clientY:300,target:targeted});
MushafReader.prototype.pointerDown.call(mocked,{isPrimary:false});assert.equal(mocked.pointer.multiple,true,'Pinch/multi-touch must not turn a page');
console.log('Mushaf: 604-page traversal, paired boundaries, exact-page jumps, rotation/fold continuity, portrait/landscape/tablet/desktop layouts, directional/diagonal/long-hold/multi-touch handling and source text preservation passed');
