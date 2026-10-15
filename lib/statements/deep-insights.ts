import type {StatementData,Transaction} from './types.ts';
import {coverageIndex,monthBounds} from './insights.ts';
const DAY=86400000;
const shift=(date:string,n:number)=>new Date(Date.parse(date)+n*DAY).toISOString().slice(0,10);
const countDays=(a:string,b:string)=>Math.max(0,Math.round((Date.parse(b)-Date.parse(a))/DAY)+1);
const sum=(rows:Transaction[])=>rows.reduce((n,t)=>n+t.amount,0);
const earlier=(...dates:string[])=>dates.sort()[0];
const nextMonth=(date:string,n:number)=>new Date(Date.UTC(+date.slice(0,4),+date.slice(5,7)-1+n,1)).toISOString().slice(0,10);
function bucket(date:string,unit:'day'|'week'|'month'){
 if(unit==='month'){const b=monthBounds(date.slice(0,7));return b;}
 if(unit==='week'){const day=new Date(date).getUTCDay(),start=shift(date,-((day+6)%7));return {start,end:shift(start,6)};}
 return {start:date,end:date};
}
export function deepSpending(data:StatementData,start:string,end:string,card:string,today:string,mode:string){
 const scoped=data.transactions.filter(t=>(!card||t.cardKey===card)&&t.date<=today);
 const rows=scoped.filter(t=>t.date>=start&&t.date<=end),purchases=rows.filter(t=>t.kind==='purchase');
 const coverage=coverageIndex(data,card);
 const sourceEnd=data.statements.filter(s=>!card||s.cardKey===card).map(s=>s.end).sort().at(-1);
 const asOf=earlier(end,today,sourceEnd??end),valid=countDays(start,asOf)>0&&countDays(start,asOf)<=3660;
 const length=valid?countDays(start,asOf):0;
 const gross=sum(purchases),exceptions=purchases.filter(t=>t.oneOff),exceptionTotal=sum(exceptions);
 const bands=[{label:'Under ₹200',min:0,max:20000},{label:'₹200–499',min:20000,max:50000},{label:'₹500–999',min:50000,max:100000},{label:'₹1,000–2,999',min:100000,max:300000},{label:'₹3,000–9,999',min:300000,max:1000000},{label:'₹10,000+',min:1000000,max:Infinity}].map(b=>{const list=purchases.filter(t=>t.amount>=b.min&&t.amount<b.max);const amount=sum(list);return {...b,amount,count:list.length,percent:gross?amount/gross*100:0,rows:[...list].sort((a,b)=>b.amount-a.amount)};});
 const biggest=[...purchases].sort((a,b)=>b.amount-a.amount||a.date.localeCompare(b.date));
 const routineMonths=[];
 if(valid)for(let date=start.slice(0,7)+'-01';date<=asOf;date=nextMonth(date,1)){
  const b=monthBounds(date.slice(0,7)),from=date<start?start:date,through=earlier(b.end,asOf),list=purchases.filter(t=>t.date>=from&&t.date<=through),total=sum(list),oneOff=sum(list.filter(t=>t.oneOff));
  routineMonths.push({month:date.slice(0,7),total,oneOff,routine:total-oneOff,complete:from===date&&through===b.end&&coverage.complete(from,through)});
 }
 const routineValues=routineMonths.filter(m=>m.complete).map(m=>m.routine).sort((a,b)=>a-b);
 const routineMedian=routineValues.length?routineValues.length%2?routineValues[(routineValues.length-1)/2]:(routineValues[routineValues.length/2-1]+routineValues[routineValues.length/2])/2:null;

 // Equal-length adjacent windows for month/custom; equal halves for all-time.
 const windowDays=mode==='all'?Math.floor(length/2):length;
 const currentEnd=asOf,currentStart=mode==='all'?shift(asOf,1-windowDays):start;
 const previousEnd=mode==='all'?shift(start,windowDays-1):shift(start,-1),previousStart=mode==='all'?start:shift(start,-windowDays);
 const before=scoped.filter(t=>t.kind==='purchase'&&t.date>=previousStart&&t.date<=previousEnd);
 const after=scoped.filter(t=>t.kind==='purchase'&&t.date>=currentStart&&t.date<=currentEnd);
 const metrics=(list:Transaction[])=>({count:list.length,amount:sum(list),average:list.length?sum(list)/list.length:0});
 const old=metrics(before),now=metrics(after);
 const comparisonReady=windowDays>0&&coverage.complete(previousStart,previousEnd)&&coverage.complete(currentStart,currentEnd)&&old.count>0;
 const categoryChanges=[...new Set([...before,...after].map(t=>t.category))].map(category=>{const a=metrics(before.filter(t=>t.category===category)),b=metrics(after.filter(t=>t.category===category));return {category,before:a,after:b,change:b.amount-a.amount,frequencyEffect:(b.count-a.count)*a.average,basketEffect:b.count*(b.average-a.average)};}).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change));
 const comparison={ready:comparisonReady,windowDays,previousStart,previousEnd,currentStart,currentEnd,before:old,after:now,change:now.amount-old.amount,frequencyEffect:(now.count-old.count)*old.average,basketEffect:now.count*(now.average-old.average),categories:categoryChanges};
 // Rank non-overlapping 3-day windows; retain calendar gaps rather than grouping adjacent rows.
 const candidates=[];
 const byDate=new Map<string,Transaction[]>();for(const t of purchases){const list=byDate.get(t.date)??[];list.push(t);byDate.set(t.date,list);}
 if(valid)for(let date=start;date<=shift(asOf,-2);date=shift(date,1)){
  const stop=shift(date,2),list=[date,shift(date,1),stop].flatMap(d=>byDate.get(d)??[]);
  if(list.length<3||new Set(list.map(t=>t.date)).size<2)continue;
  const groups=new Map<string,number>();for(const t of list)groups.set(t.category,(groups.get(t.category)??0)+t.amount);
  candidates.push({start:date,end:stop,amount:sum(list),count:list.length,oneOff:sum(list.filter(t=>t.oneOff)),categories:[...groups].sort((a,b)=>b[1]-a[1]),rows:list});
 }
 const bursts:typeof candidates=[];
 for(const c of candidates.sort((a,b)=>b.amount-a.amount||a.start.localeCompare(b.start)))if(!bursts.some(b=>c.start<=b.end&&c.end>=b.start)){bursts.push(c);if(bursts.length===3)break;}
 const unit=length>100?'month':length>35?'week':'day';
 const points:{date:string;end:string;actual:number|null;baseline:number|null;complete:boolean;projected:boolean}[]=[];
 if(valid){for(let date=bucket(start,unit).start;date<=asOf;date=unit==='month'?nextMonth(date,1):shift(date,unit==='week'?7:1)){
  const b=bucket(date,unit),from=date<start?start:date,through=earlier(b.end,asOf);
  const recorded=scoped.filter(t=>t.date>=from&&t.date<=through),amount=recorded.reduce((n,t)=>n+(t.kind==='purchase'?t.amount:t.kind==='refund'?-t.amount:0),0);
  const observed=recorded.length>0||data.statements.some(s=>(!card||s.cardKey===card)&&s.start<=through&&s.end>=from);
  points.push({date,end:b.end,actual:observed?amount:null,baseline:null,complete:from===b.start&&through===b.end&&coverage.complete(from,through),projected:false});
 }}
 const complete=points.filter(p=>p.complete),samples=complete.slice(-(unit==='month'?3:unit==='week'?4:28));
 const minimum=unit==='month'?2:unit==='week'?2:14;
 const baseline=samples.length>=minimum?Math.max(0,Math.round(samples.reduce((n,p)=>n+(p.actual??0),0)/samples.length)):null;
 // Only extend the latest imported view, never make a forecast from an arbitrary old slice.
 const latest=scoped.map(t=>t.date).sort().at(-1);
 const latestView=!!latest&&latest>=start&&latest<=end;
 if(baseline!==null&&latestView&&points.length){
  const last=points.at(-1)!;last.baseline=last.actual;
  const horizon=unit==='month'?3:unit==='week'?4:mode==='month'?31:14;
  for(let i=1;i<=horizon;i++){const date=unit==='month'?nextMonth(last.date,i):shift(last.date,i*(unit==='week'?7:1));if(mode!=='all'&&date>end)break;const b=bucket(date,unit);points.push({date,end:b.end,actual:null,baseline,complete:false,projected:true});}
 }
 return {asOf,gross,purchases:purchases.length,bands,biggest,exceptions:{rows:exceptions,amount:exceptionTotal,routine:gross-exceptionTotal,months:routineMonths,median:routineMedian,completeMonths:routineValues.length,percent:gross?exceptionTotal/gross*100:0},comparison,bursts,chart:{unit,points,baseline,samples:samples.length,minimum,latestView,hasProjection:points.some(p=>p.projected),partial:points.some(p=>!p.projected&&!p.complete)}};
}
