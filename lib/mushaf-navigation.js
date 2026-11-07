export const PAGE_COUNT=604;
export function spreadPages(page,paired,total=PAGE_COUNT){
 const n=Math.max(1,Math.min(total,Math.trunc(Number(page)||1)));
 const first=paired?Math.floor((n-1)/2)*2+1:n;
 return paired&&first<total?[first,first+1]:[first];
}
export function turnTarget(page,direction,paired,total=PAGE_COUNT){
 const pages=spreadPages(page,paired,total),target=pages[0]+(direction>0?1:-1)*(paired?2:1);
 return target<1||target>total?null:target;
}
export function useFacingPages(width,height,availableWidth=width){
 return availableWidth>=480&&(width>=600||(width>=540&&width>height));
}
export function swipeTurn(start,end,paired=false){
 if(!start||!end||start.multiple||end.cancelled)return 0;
 const dx=end.x-start.x,dy=end.y-start.y,elapsed=end.time-start.time;
 if(elapsed<0||elapsed>850||Math.abs(dx)<56||Math.abs(dx)<Math.abs(dy)*1.5)return 0;
 return (dx<0?1:-1)*(paired?-1:1);
}
