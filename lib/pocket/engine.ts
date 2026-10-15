import type {Card,Entry,PocketData,Platform,Rule} from './types';
export const money=(paise:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:paise%100?2:0}).format(paise/100);
export function today(timeZone='Asia/Kolkata'){return new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
export const parseDate=(s:string)=>new Date(s+'T12:00:00Z');
export const iso=(d:Date)=>d.toISOString().slice(0,10);
export function addDays(s:string,n:number){const d=parseDate(s);d.setUTCDate(d.getUTCDate()+n);return iso(d)}
export function monthBounds(s:string){const d=parseDate(s);return [iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1))),iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)))] as const}
export function weekBounds(s:string){const a=addDays(s,-((parseDate(s).getUTCDay()+6)%7));return [a,addDays(a,6)] as const}
export const within=(s:string,a:string,b:string)=>s>=a&&s<=b;
export const refundTotal=(e:Entry)=>e.refunds.reduce((n,r)=>n+r.amount,0);
export const charge=(e:Entry)=>e.amount-refundTotal(e);
export const net=(e:Entry)=>e.kind==='resisted'?e.amount:Math.round(charge(e)*e.share/e.amount);
const close=(y:number,m:number,day:number)=>iso(new Date(Date.UTC(y,m,Math.min(day,new Date(Date.UTC(y,m+1,0)).getUTCDate()),12)));
export function cycle(date:string,period:Rule['period'],day:number|null):readonly [string,string]{
 const d=parseDate(date),y=d.getUTCFullYear(),m=d.getUTCMonth();
 if(period==='month'||!day&&period==='statement')return monthBounds(date);
 if(period==='statement-quarter'){const endMonth=date<=close(y,m,day??31)?m:m+1;const end=Math.floor(endMonth/3)*3+2;return [addDays(close(y,end-3,day??31),1),close(y,end,day??31)];}
 if(period==='quarter'){const q=Math.floor(m/3)*3; if(!day)return [close(y,q,1),close(y,q+2,31)];const endMonth=date<=close(y,m,day)?m:m+1;const start=Math.floor(endMonth/3)*3;return [addDays(close(y,start-1,day),1),close(y,start+2,day)];}
 const end=date<=close(y,m,day!)?m:m+1;return [addDays(close(y,end-1,day!),1),close(y,end,day!)];
}
export const normalizeMerchant=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]/g,'');
const knownOnline=new Set(['Swiggy Food','Swiggy Instamart','Swiggy Dineout','Zomato','Amazon Now','Zepto','Amazon Shopping','Flipkart Shopping','Flipkart Minutes'].map(normalizeMerchant));
export function platformChannel(platform:Platform){return platform.channel??(knownOnline.has(normalizeMerchant(platform.name))?'online':'unknown');}
export function chooseRule(card:Card,platform:Platform,date?:string):Rule|null {
 const rules=card.rules.filter(r=>r.active&&(!date||(!r.validFrom||date>=r.validFrom)&&(!r.validUntil||date<=r.validUntil))&&(!r.channel||r.channel===platformChannel(platform))&&!r.excludedCategories?.some(c=>normalizeMerchant(c)===normalizeMerchant(platform.category)));
 const merchant=(r:Rule)=>r.merchantNames?.some(name=>normalizeMerchant(name)===normalizeMerchant(platform.name));
 const specific=(r:Rule)=>r.platformIds.length||r.merchantNames?.length;
 return rules.find(r=>r.platformIds.includes(platform.id)||merchant(r))??rules.find(r=>!specific(r)&&r.categories.some(c=>normalizeMerchant(c)===normalizeMerchant(platform.category)))??rules.find(r=>!specific(r)&&!r.categories.length)??null;
}
export function rewardBeforeCap(rule:Rule,amount:number){if(amount<=(rule.minSpendExclusive??0)||amount<(rule.minSpendInclusive??0))return 0;const reward=rule.kind==='points'?Math.floor(amount/rule.unit)*rule.points:(rule.rounding==='nearest-rupee-half-down'?Math.ceil(amount*rule.rate/10000-0.5)*100:Math.round(amount*rule.rate/100));return Math.min(reward,rule.maxPerTransaction??Infinity);}
export function rewardLabel(rule:Rule,amount:number){return rule.kind==='points'?`${amount} ${rule.rewardCurrency||'points'}`:rule.kind==='credit'?`${money(amount)} ${rule.rewardCurrency||'reward credit'}`:money(amount);}
export const eligible=(card:Card,amount:number)=>card.active&&(card.owner==='self'||amount>300000);
const limits=(r:Rule)=>[{bucket:r.bucket,period:r.period,cap:r.cap},...(r.additionalCaps??[])];
export function rewards(data:PocketData){const used:Record<string,number>={},result:Record<string,number>={};for(const card of data.cards)for(const o of card.openingUsage)used[`${card.id}:${o.bucket}:${o.cycle}`]=o.amount;
 for(const e of [...data.entries].filter(e=>!e.deleted&&e.kind==='spend').sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id))){const r=e.reward;if(!r)continue;const pools=limits(r).map(l=>({...l,key:`${e.paymentId}:${l.bucket}:${cycle(e.date,l.period,e.billingDay)[0]}`}));const amount=Math.min(rewardBeforeCap(r,charge(e)),...pools.map(l=>Math.max(0,(l.cap??Infinity)-(used[l.key]??0))));result[e.id]=amount;for(const pool of pools)used[pool.key]=(used[pool.key]??0)+amount;}return {result,used};}
export function quote(data:PocketData,card:Card,platform:Platform,amount:number,date:string){const rule=chooseRule(card,platform,date);if(!eligible(card,amount)||!rule)return null;const {used}=rewards(data),bounds=cycle(date,rule.period,card.billingDay);const left=Math.min(...limits(rule).map(l=>Math.max(0,(l.cap??Infinity)-(used[`${card.id}:${l.bucket}:${cycle(date,l.period,card.billingDay)[0]}`]??0))));const remaining=Number.isFinite(left)?left:null;return {rule,amount:Math.min(rewardBeforeCap(rule,amount),left),remaining,bounds};}
export function budgetFor(data:PocketData,date:string,weekly=false){let budget=weekly?data.settings.weeklyBudget:data.settings.monthlyBudget;if(!weekly&&data.settings.rollover){let cursor=data.settings.budgetStart+'-01';const target=date.slice(0,7)+'-01';for(let i=0;cursor<target&&i<1200;i++){const bounds=monthBounds(cursor);const spent=data.entries.filter(e=>!e.deleted&&e.kind==='spend'&&within(e.date,...bounds)).reduce((n,e)=>n+net(e),0);budget=data.settings.monthlyBudget+Math.max(0,budget-spent);cursor=addDays(bounds[1],1);}}return budget;}
