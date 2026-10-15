import type {StatementData,Transaction} from './types.ts';
import type {Card,Platform,Rule} from '../pocket/types.ts';
import {chooseRule,cycle,eligible,rewardBeforeCap,normalizeMerchant} from '../pocket/engine.ts';
const DAY=86400000;
export const monthBounds=(month:string)=>({start:month+'-01',end:new Date(Date.UTC(+month.slice(0,4),+month.slice(5),0)).toISOString().slice(0,10)});
const moveMonth=(month:string,offset:number)=>new Date(Date.UTC(+month.slice(0,4),+month.slice(5)-1+offset,1)).toISOString().slice(0,7);
const days=(start:string,end:string)=>Math.max(0,Math.round((Date.parse(end)-Date.parse(start))/DAY)+1);
const net=(rows:Transaction[])=>rows.reduce((n,t)=>n+(t.kind==='purchase'?t.amount:t.kind==='refund'?-t.amount:0),0);
export function coverageIndex(data:StatementData,card:string){
 const keys=[...new Set(data.statements.filter(s=>!card||s.cardKey===card).map(s=>s.cardKey))];
 const index=new Map(keys.map(k=>[k,new Set<string>()]));
 for(const s of data.statements){const set=index.get(s.cardKey);if(!set)continue;for(let ms=Date.parse(s.start),end=Date.parse(s.end);ms<=end&&ms-Date.parse(s.start)<3660*DAY;ms+=DAY)set.add(new Date(ms).toISOString().slice(0,10));}
 return {keys,complete:(start:string,end:string)=>keys.length>0&&[...index.values()].every(set=>{for(let ms=Date.parse(start);ms<=Date.parse(end);ms+=DAY)if(!set.has(new Date(ms).toISOString().slice(0,10)))return false;return true;})};
}
export function spendingInsights(data:StatementData,start:string,end:string,card:string,today:string,platforms:Platform[]=[]){
 const all=data.transactions.filter(t=>(!card||t.cardKey===card)&&t.date<=today),rows=all.filter(t=>t.date>=start&&t.date<=end);
 const coverage=coverageIndex(data,card),anchor=(end<today?end:today).slice(0,7);
 const trend=Array.from({length:6},(_,i)=>{const month=moveMonth(anchor,i-5),bounds=monthBounds(month),stop=bounds.end<today?bounds.end:today;return {month,...bounds,amount:net(all.filter(t=>t.date>=bounds.start&&t.date<=stop)),complete:bounds.end<today&&coverage.complete(bounds.start,bounds.end)};});
 const complete=trend.filter(m=>m.complete),values=complete.map(m=>Math.max(0,m.amount)).sort((a,b)=>a-b);
 const median=values.length?values.length%2?values[(values.length-1)/2]:(values[values.length/2-1]+values[values.length/2])/2:0;
 const suggestedBudget=values.length>=2?Math.ceil(median*1.1/100000)*100000:null;
 const half=Math.floor(complete.length/2),first=complete.slice(0,half),last=complete.slice(-half);
 const average=(list:typeof complete)=>list.reduce((n,m)=>n+m.amount,0)/list.length;
 const trendChange=complete.length>=4&&average(first)>0?(average(last)/average(first)-1)*100:null;
 const latest=all.filter(t=>t.date>=start&&t.date<=end).map(t=>t.date).sort().at(-1);
 const asOf=latest??(end<today?end:today),currentMonth=asOf.slice(0,7),cutoff=+asOf.slice(8),currentStart=currentMonth+'-01';
 const history=[1,2,3].map(n=>{const month=moveMonth(currentMonth,-n),bounds=monthBounds(month);return {start:bounds.start,end:month+'-'+String(Math.min(cutoff,+bounds.end.slice(8))).padStart(2,'0')};}).filter(b=>coverage.complete(b.start,b.end));
 const current=all.filter(t=>t.date>=currentStart&&t.date<=asOf),currentCovered=coverage.complete(currentStart,asOf);
 const pace=currentCovered&&history.length>=2?[...new Set(current.filter(t=>t.kind==='purchase').map(t=>t.category))].map(category=>{const amount=Math.max(0,net(current.filter(t=>t.category===category)));const normal=history.reduce((n,b)=>n+Math.max(0,net(all.filter(t=>t.category===category&&t.date>=b.start&&t.date<=b.end)))/days(b.start,b.end),0)/history.length*days(currentStart,asOf);return {category,amount,normal,extra:Math.round(amount-normal),percent:normal>0?(amount/normal-1)*100:null};}).filter(p=>p.extra>0).sort((a,b)=>b.extra-a.extra):[];
 const observedEnd=end<today?end:today,observedDays=days(start,observedEnd),purchases=rows.filter(t=>t.kind==='purchase');
 const groups=new Map<string,Transaction[]>();for(const t of purchases){const platform=platformFor(t,platforms),key=normalizeMerchant(platform.name);const list=groups.get(key)??[];list.push({...t,merchant:platform.name,merchantKey:key});groups.set(key,list);}
 const habits=[...groups.values()].map(list=>{const amount=list.reduce((n,t)=>n+t.amount,0),count=list.length,perWeek=observedDays?count/observedDays*7:0;return {key:list[0].merchantKey,name:list[0].merchant,count,amount,average:amount/count,perWeek,yearly:observedDays?Math.round(amount/observedDays*365):0,oneLess:Math.round(Math.min(1,perWeek)*amount/count*52)};}).sort((a,b)=>b.amount-a.amount);
 const rhythm=Array.from({length:7},(_,i)=>({day:i,label:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i],amount:0,count:0,days:0}));
 for(let ms=Date.parse(start),stop=Date.parse(observedEnd);ms<=stop&&ms-Date.parse(start)<=3660*DAY;ms+=DAY)rhythm[new Date(ms).getUTCDay()].days++;
 for(const t of purchases){const r=rhythm[new Date(t.date+'T00:00:00Z').getUTCDay()];r.amount+=t.amount;r.count++;}
 const small=purchases.filter(t=>t.amount<50000),smallTotal=small.reduce((n,t)=>n+t.amount,0),gross=purchases.reduce((n,t)=>n+t.amount,0);
 const fees=rows.filter(t=>t.kind==='fee'||t.kind==='interest').reduce((n,t)=>n+t.amount,0);
 const refunds=rows.filter(t=>t.kind==='refund').reduce((n,t)=>n+t.amount,0);
 return {trend,completeMonths:complete.length,suggestedBudget,median,trendChange,pace,asOf,paceReady:currentCovered&&history.length>=2,paceSamples:history.length,habits,annualReady:observedDays>=28&&coverage.complete(start,observedEnd),observedDays,rhythm,small:{count:small.length,total:smallTotal,percent:gross?smallTotal/gross*100:0},fees,refunds,review:purchases.filter(t=>t.confidence==='review'||t.confidence==='suggested').length};
}
export type CashbackMove={id:string;date:string;merchant:string;amount:number;from:string;to:string;before:number;after:number;gain:number};
export function inferCardBindings(data:StatementData,cards:Card[]){
 const result:Record<string,string>={};for(const key of new Set(data.statements.map(s=>s.cardKey))){const bank=data.statements.find(s=>s.cardKey===key)?.bank;const candidates=cards.filter(c=>c.active&&c.owner==='self'&&(bank==='HSBC'?/hsbc/i.test(c.issuer):/hdfc/i.test(c.issuer)));if(candidates.length===1)result[key]=candidates[0].id;}
 return result;
}
function platformFor(t:Transaction,platforms:Platform[]):Platform{
 const name=normalizeMerchant(t.merchant),exact=platforms.find(p=>normalizeMerchant(p.name)===name);
 if(exact)return exact;
 const aliases:[RegExp,string][]=[[/instamart/,'Swiggy Instamart'],[/dineout/,'Swiggy Dineout'],[/zomato/,'Zomato'],[/zepto/,'Zepto'],[/flipkartminutes/,'Flipkart Minutes'],[/flipkart/,'Flipkart Shopping']];
 const target=aliases.find(([pattern])=>pattern.test(name))?.[1];
 if(target){const match=platforms.find(p=>p.name===target);if(match)return match;return {id:'statement-platform:'+normalizeMerchant(target),name:target,category:t.category,channel:'online',active:true};}
 if(/swiggy/.test(name)&&t.category==='Food delivery'){const match=platforms.find(p=>p.name==='Swiggy Food');if(match)return match;return {id:'swiggy-food',name:'Swiggy Food',category:t.category,channel:'online',active:true};}
 if(/amazon|asspl/.test(name)&&t.category==='Shopping'){const match=platforms.find(p=>p.name==='Amazon Shopping');if(match)return match;return {id:'amazon-shopping',name:'Amazon Shopping',category:t.category,channel:'online',active:true};}
 return {id:'statement:'+t.merchantKey,name:t.merchant,category:t.category,channel:'unknown',active:true};
}
export function missedCashback(data:StatementData,cards:Card[],platforms:Platform[],bindings:Record<string,string>,start:string,end:string,filterCard:string){
 const available=cards.filter(c=>c.active&&c.status==='verified');
 const inferredDay=(card:Card)=>{if(card.billingDay)return card.billingDay;const bound=Object.keys(bindings).filter(k=>bindings[k]===card.id);const dates=data.statements.filter(s=>bound.includes(s.cardKey)).map(s=>s.summaryThrough??s.end).map(d=>+d.slice(8));return dates.length&&dates.every(d=>d===dates[0])?dates[0]:null;};
 const configured=available.map(c=>({...c,billingDay:inferredDay(c)})),usedActual:Record<string,number>={},usedBest:Record<string,number>={};
 for(const c of configured)for(const u of c.openingUsage){usedActual[`${c.id}:${u.bucket}:${u.cycle}`]=u.amount;usedBest[`${c.id}:${u.bucket}:${u.cycle}`]=u.amount;}
 const limits=(c:Card,r:Rule,date:string)=>[{bucket:r.bucket,period:r.period,cap:r.cap},...(r.additionalCaps??[])].map(p=>({...p,key:`${c.id}:${p.bucket}:${cycle(date,p.period,c.billingDay)[0]}`}));
 function quote(c:Card,t:Transaction,used:Record<string,number>){if(!eligible(c,t.amount))return null;const p=platformFor(t,platforms),r=chooseRule(c,p,t.date);if(!r||r.kind!=='cashback'||(!c.billingDay&&[r,...(r.additionalCaps??[])].some(p=>(p.period==='statement'||p.period==='statement-quarter'||p.period==='quarter')&&p.cap!==null)))return null;const pools=limits(c,r,t.date);return {card:c,rule:r,pools,value:Math.min(rewardBeforeCap(r,t.amount),...pools.map(p=>Math.max(0,(p.cap??Infinity)-(used[p.key]??0))))};}
 const consume=(q:NonNullable<ReturnType<typeof quote>>,used:Record<string,number>)=>{for(const p of q.pools)used[p.key]=(used[p.key]??0)+q.value;};
 const moves:CashbackMove[]=[];let baseline=0,optimized=0,skipped=0,loss=0;
 // Replay all earlier purchases across every card, even when the display is filtered.
 for(const t of [...data.transactions].filter(t=>t.kind==='purchase'&&t.date<=end).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))){
  const visible=t.date>=start&&(!filterCard||t.cardKey===filterCard),actual=configured.find(c=>c.id===bindings[t.cardKey]);
  const base=actual?quote(actual,t,usedActual):null;if(base)consume(base,usedActual);
  if(!actual||t.category==='Uncategorised'||t.category==='Transfers / personal'){
   if(actual){const q=quote(actual,t,usedBest);if(q)consume(q,usedBest);}if(visible)skipped++;continue;
  }
  const alternatives=configured.map(c=>quote(c,t,usedBest)).filter((q):q is NonNullable<typeof q>=>q!==null).sort((a,b)=>b.value-a.value||(a.card.id===actual.id?-1:1));
  const best=alternatives[0];if(best)consume(best,usedBest);if(!visible)continue;
  if(!base){skipped++;continue;}
  baseline+=base.value;optimized+=best?.value??0;const gain=(best?.value??0)-base.value;
  if(gain<0)loss-=gain;
  if(best&&gain>0&&best.card.id!==actual.id)moves.push({id:t.id,date:t.date,merchant:t.merchant,amount:t.amount,from:actual.name,to:best.card.name,before:base.value,after:best.value,gain});
 }
 return {moves:moves.sort((a,b)=>b.gain-a.gain),baseline,optimized,gain:Math.max(0,optimized-baseline),loss,skipped,mapped:Object.keys(bindings).length};
}
