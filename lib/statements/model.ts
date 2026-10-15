import type {StatementData,ParsedStatement,Transaction,Merchant,Category} from './types.ts';
export const emptyData=():StatementData=>({version:0,statements:[],transactions:[],merchants:[]});
export function importStatement(data:StatementData,parsed:ParsedStatement){
 if(data.statements.some(s=>s.id===parsed.statement.id))return {added:0,duplicates:parsed.transactions.length};
 const incoming=parsed.statement;
 if(data.statements.some(s=>s.cardKey===incoming.cardKey&&s.start<=incoming.end&&s.end>=incoming.start&&((s.format==='hdfc-annual')!==(incoming.format==='hdfc-annual'))))throw Error('This annual/monthly statement overlaps an existing statement in another layout. Remove the overlapping source first to avoid double-counting.');
 if(data.statements.length>=200)throw Error('The 200-statement workspace limit has been reached.');
 const existing=new Map(data.transactions.map(t=>[t.id,t]));let added=0,duplicates=0;
 for(const row of parsed.transactions){const old=existing.get(row.id);if(old){old.statementIds=[...new Set([...old.statementIds,parsed.statement.id])];duplicates++;}else{const merchant=data.merchants.find(m=>m.key===row.merchantKey);const t=merchant?{...row,merchant:merchant.name,category:merchant.category,confidence:merchant.confidence}:row;data.transactions.push(t);existing.set(t.id,t);added++;}}
 if(data.transactions.length>15000)throw Error('The 15,000-transaction workspace limit has been reached.');
 data.statements.push(parsed.statement);return {added,duplicates};
}
export function removeStatement(data:StatementData,id:string){data.statements=data.statements.filter(s=>s.id!==id);data.transactions=data.transactions.map(t=>({...t,statementIds:t.statementIds.filter(s=>s!==id)})).filter(t=>t.statementIds.length).map(t=>({...t,statementId:t.statementIds[0]}));}
export function saveMerchant(data:StatementData,merchant:Merchant){data.merchants=data.merchants.filter(m=>m.key!==merchant.key);data.merchants.push(merchant);for(const t of data.transactions)if(t.merchantKey===merchant.key&&(t.kind==='purchase'||t.kind==='refund')){t.merchant=merchant.name;t.category=merchant.category;t.confidence=merchant.confidence;}}
export function summarize(rows:Transaction[],start:string,end:string){
 const sum=(kind:Transaction['kind'])=>rows.filter(t=>t.kind===kind).reduce((n,t)=>n+t.amount,0);
 const gross=sum('purchase'),refunds=sum('refund'),fees=sum('fee')+sum('interest'),cashback=sum('cashback')-sum('reward-reversal');
 const spend=rows.filter(t=>t.kind==='purchase'||t.kind==='refund');
 const groups=(key:(t:Transaction)=>string)=>{const map=new Map<string,number>();for(const t of spend){const k=key(t);map.set(k,(map.get(k)??0)+(t.kind==='refund'?-t.amount:t.amount));}return [...map].map(([name,amount])=>({name,amount})).sort((a,b)=>b.amount-a.amount)};
 const daily=new Map<string,number>();let weekdays=0,weekends=0;
 const startMs=Date.parse(start+'T00:00:00Z'),endMs=Date.parse(end+'T00:00:00Z');
 if(Number.isFinite(startMs)&&Number.isFinite(endMs)&&endMs>=startMs&&endMs-startMs<=86400000*3660)for(let ms=startMs;ms<=endMs;ms+=86400000){const d=new Date(ms),day=d.getUTCDay();daily.set(d.toISOString().slice(0,10),0);if(day===0||day===6)weekends++;else weekdays++;}
 let weekdaySpend=0,weekendSpend=0;for(const t of spend){const amount=t.kind==='refund'?-t.amount:t.amount;daily.set(t.date,(daily.get(t.date)??0)+amount);const day=new Date(t.date+'T00:00:00Z').getUTCDay();if(day===0||day===6)weekendSpend+=amount;else weekdaySpend+=amount;}
 return {gross,refunds,net:gross-refunds,fees,cashback,repayments:sum('repayment'),otherCredits:sum('other-credit'),categories:groups(t=>t.category),merchants:groups(t=>t.merchant),daily:[...daily].map(([date,amount])=>({date,amount})),weekdayAverage:weekdays?weekdaySpend/weekdays:0,weekendAverage:weekends?weekendSpend/weekends:0,purchases:rows.filter(t=>t.kind==='purchase').length,biggest:rows.filter(t=>t.kind==='purchase').sort((a,b)=>b.amount-a.amount)[0]};
}
export function coveredDays(data:StatementData,start:string,end:string,card:string){
 const selected=data.statements.filter(s=>!card||s.cardKey===card);const days=new Set<string>();for(const s of selected){const a=Date.parse((s.start>start?s.start:start)+'T00:00:00Z'),b=Date.parse((s.end<end?s.end:end)+'T00:00:00Z');for(let ms=a;ms<=b&&ms-a<=3660*86400000;ms+=86400000)days.add(new Date(ms).toISOString().slice(0,10));}return days.size;
}
export function eligibleBusiness(name:string){return /(?:pvt|ltd|limited|industr|ventures|shop|service|petrol|station|swiggy|amazon|asspl|zomato|zepto|wine|store|retail|hospital|restaurant|hotel|technology|technologies|solutions|commerce|foods)/i.test(name)&&!/https?:|@|\d{6,}|\b(?:mr|mrs|ms|shri|smt)\b/i.test(name);}
export function csv(rows:Transaction[]){const safe=(s:string)=>'"'+(/^[=+\-@\t\r]/.test(s)?"'":'')+s.replace(/"/g,'""')+'"';return ['Date,Merchant,Category,Type,Amount INR,Card',...rows.map(t=>[t.date,t.merchant,t.category,t.kind,(t.amount/100).toFixed(2),t.cardKey].map(safe).join(','))].join('\r\n');}
export function suggestedReduction(rows:Transaction[],chosen:Category[],percent:number){return Math.round(rows.filter(t=>t.kind==='purchase'&&chosen.includes(t.category)).reduce((n,t)=>n+t.amount,0)*percent/100);}

export function setOneOff(data:StatementData,id:string,oneOff:boolean){
 const transaction=data.transactions.find(t=>t.id===id);
 if(!transaction||transaction.kind!=='purchase')throw Error('Choose a purchase to mark as a one-off.');
 transaction.oneOff=oneOff;
}
