import {createHash} from 'node:crypto';
import {categories,type Category,type Kind,type Transaction,type ParsedStatement} from './types.ts';
export const digest=(s:string|Uint8Array)=>createHash('sha256').update(s).digest('hex');
const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const cash=(s:string)=>Math.round(Number(s.replace(/,/g,''))*100);
function iso(year:number,month:number,day:number){const s=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;if(new Date(s).toISOString().slice(0,10)!==s)throw Error('Invalid transaction date.');return s;}
// HSBC prints spending dates without years. Earlier spending can post in a later
// billing cycle; resolve a unique non-future date within a bounded lookback.
export function hsbcTransactionDate(day:number,month:number,start:string,end:string){
 const floor=new Date(Date.parse(start+'T00:00:00Z')-90*86400000).toISOString().slice(0,10);
 const year=+end.slice(0,4),candidates:string[]=[];
 for(const y of [year-1,year,year+1]){try{const date=iso(y,month,day);if(date>=floor&&date<=end)candidates.push(date)}catch{}}
 if(candidates.length!==1)throw Error(`Could not safely determine the year for HSBC transaction ${String(day).padStart(2,'0')}${months[month-1]??''}. Check it against the billing period ${start} to ${end}.`);
 return candidates[0];
}
export function merchantName(raw:string){return raw.replace(/\(Ref#[^)]+\)/gi,'').replace(/\b(?:UPI|BBPSDP|DP)\s*\d[A-Z0-9]*/gi,'').replace(/\b\d{10,}\b/g,'').replace(/^(?:RAZ|RSP|PAY|PYU|PHP)\*/i,'').replace(/(?:BANGALORE|BENGALURU|GURGAON|Bangalore|Bengaluru|https:\/\/www\.).*$/,'').replace(/\s+/g,' ').trim().slice(0,160);}
export function merchantKey(s:string){return merchantName(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
export function classify(raw:string,direction:'debit'|'credit'):{kind:Kind;category:Category;confidence:Transaction['confidence'];merchant:string}{
 const name=merchantName(raw),s=name.toLowerCase();
 if(/cashback.*reversal|cashback_reversal/.test(s))return {kind:'reward-reversal',category:'Uncategorised',confidence:'known',merchant:'Cashback reversal'};
 if(/cashback|cash back/.test(s))return {kind:direction==='credit'?'cashback':'reward-reversal',category:'Uncategorised',confidence:'known',merchant:'Cashback credit'};
 if(direction==='credit'&&/bbps|bppy|cc payment|payment received|payment thank|pymt recd/.test(s))return {kind:'repayment',category:'Uncategorised',confidence:'known',merchant:'Card repayment'};
 if(direction==='debit'&&/interest|finance charge/.test(s))return {kind:'interest',category:'Bills & subscriptions',confidence:'known',merchant:name};
 if(direction==='debit'&&/\bfee\b|\b(?:c|s|i)?gst\b|tax on|charge.*(?:late|annual)/.test(s))return {kind:'fee',category:'Bills & subscriptions',confidence:'known',merchant:name};
 const rules:[RegExp,Category,string?][]=[[/instamart|grocery|groceries|zepto|dmart ready/,'Groceries'],[/swiggy.*food|swiggy pvt ltd fo|zomato/,'Food delivery'],[/domino|pizza|restaurant|cafe|coffee/,'Dining'],[/petroleum|servo station|petrol|fuel|hpcl/,'Fuel'],[/irctc|airline|airport lounge|makemytrip|hotel/,'Travel'],[/myjio|airtel|vodafone|netflix|spotify/,'Bills & subscriptions'],[/snabbit|urban company/,'Home & services'],[/impact\s*guru/,'Donations'],[/dailyobjects|flipkart|myntra|nykaa fashion|\bajio\b/,'Shopping']];
 const rule=rules.find(([rx])=>rx.test(s));const category=rule?.[1]??'Uncategorised';
 const aliases:[RegExp,string][]=[[/instamart/,'Swiggy Instamart'],[/zepto/,'Zepto'],[/zomato/,'Zomato'],[/swiggy.*food|swiggy pvt ltd fo/,'Swiggy Food'],[/domino/,"Domino’s"],[/dailyobjects/,'DailyObjects'],[/irctc/,'IRCTC']];const merchant=aliases.find(([r])=>r.test(s))?.[1]??name;
 // Aggregators and person-like UPI names remain reviewable; their business does not identify the purchased item.
 return {kind:direction==='credit'?(rule||/amazon|asspl|swiggy|reliance retail|googlecloud|\brefund\b/i.test(name)?'refund':'other-credit'):'purchase',category,confidence:rule?'known':'review',merchant:merchant||'Unidentified merchant'};
}
export function parseStatement(text:string,fileHash:string,name='Card statement'):ParsedStatement{
 const bank=/PREVIOUS STATEMENT DUES|HDFC BANK|Swiggy Credit Card/i.test(text)?'HDFC':/HSBC|NET OUTSTANDING BALANCE/i.test(text)?'HSBC':null;
 if(!bank)throw Error('This PDF is not a supported HDFC or HSBC statement.');
 const period=text.match(/(\d{2})\s+([A-Z]{3})\s+(20\d{2})\s+To\s+(\d{2})\s+([A-Z]{3})\s+(20\d{2})/i);
 const dateHeader=text.match(/Statement Date\s+(\d{1,2})\s+([A-Za-z]{3}),?\s+(20\d{2})/i);
 const annualPeriod=text.match(/Account Summary for the period from\s+([A-Z]+)-(\d{2}|20\d{2})\s+to\s+([A-Z]+)-(\d{2}|20\d{2})/i);
 const annual=bank==='HDFC'&&/Year End Statement/i.test(text);
 if(annual&&!annualPeriod)throw Error('Could not read the annual statement period.');
 const annualStart=annualPeriod?iso(annualPeriod[2].length===2?2000+ +annualPeriod[2]:+annualPeriod[2],months.indexOf(annualPeriod[1].slice(0,3).toUpperCase())+1,1):null;
 const annualEnd=annualPeriod?new Date(Date.UTC(annualPeriod[4].length===2?2000+ +annualPeriod[4]:+annualPeriod[4],months.indexOf(annualPeriod[3].slice(0,3).toUpperCase())+1,0)).toISOString().slice(0,10):null;
 const start=annualStart??(period?iso(+period[3],months.indexOf(period[2].toUpperCase())+1,+period[1]):null),end=annualEnd??(period?iso(+period[6],months.indexOf(period[5].toUpperCase())+1,+period[4]):dateHeader?iso(+dateHeader[3],months.indexOf(dateHeader[2].toUpperCase())+1,+dateHeader[1]):null);
 if(start&&end&&start>end)throw Error('Statement period is invalid.');
 if(bank==='HSBC'&&(!start||!end))throw Error('Could not read the HSBC billing period; transaction years cannot be inferred safely.');
 const last4=text.match(/\b\d{6,}[X*]{4,}(\d{4})\b/i)?.[1]??text.match(/(?:X{4,}|\*{4,})[ -]*(\d{4})\b/i)?.[1]??'primary',cardKey=`${bank}:${last4}`,id=fileHash;
 const transactions:Transaction[]=[],warnings:string[]=[],occurrences=new Map<string,number>();
 let opening:number|null=null,closing:number|null=null;
 const annualSummary=annual?text.match(/^\s*\d{6,}[X*]+\d{4}\s+\d+\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+[\d,]+\.\d{2}\s+(\d{1,2})\s*$/m):null;
 const annualMonths=annual?[...text.matchAll(/^([A-Z]{3})-(20\d{2})\s+\d{6,}[X*]+\d{4}\s/gm)].map(m=>({year:+m[2],month:months.indexOf(m[1])+1})).sort((a,b)=>a.year-b.year||a.month-b.month):[];
 const lastMonth=annualMonths.at(-1);
 const summaryThrough=annualSummary&&lastMonth?iso(lastMonth.year,lastMonth.month,Math.min(+annualSummary[3],new Date(Date.UTC(lastMonth.year,lastMonth.month,0)).getUTCDate())):null;
 const expectedDebits=annualSummary?cash(annualSummary[1]):null,expectedCredits=annualSummary?cash(annualSummary[2]):null;
 const summary=text.match(/C\s*([\d,]+\.\d{2})\s*_?\s*C\s*([\d,]+\.\d{2})\s*\+\s*C\s*([\d,]+\.\d{2})\s*\+\s*C\s*([\d,]+\.\d{2})\s*=\s*C\s*([\d,]+\.\d{2})/);
 if(summary){opening=cash(summary[1]);closing=cash(summary[5])}
 if(bank==='HSBC'){const a=text.match(/OPENING BALANCE\s+([\d,]+\.\d{2})/),b=text.match(/NET OUTSTANDING BALANCE\s+([\d,]+\.\d{2})/);opening=a?cash(a[1]):null;closing=b?cash(b[1]):null;}
 for(const line of text.split('\n')){
  const h=line.match(/^\s*(\d{2})\/(\d{2})\/(20\d{2})\s*\|\s*(\d{2}:\d{2})\s+(.+?)\s+(\+\s*)?C\s*([\d,]+\.\d{2})(?:\s|$)/);
  const a=line.match(/^\s*(\d{2})-([A-Z]{3})-(20\d{2})\s+(.+?)\s+([\d,]+\.\d{2})\s+(DR|CR)\s+\d{6,}[X*]+(\d{4})\s*$/i);
  const b=line.match(/^\s*(\d{2})([A-Z]{3})\s+(.+?)\s+([\d,]+\.\d{2})(?:\s+(CR))?\s*$/i);
  if(bank==='HSBC'&&b&&/NET OUTSTANDING BALANCE/.test(b[3]))continue;
  let date:string,raw:string,time='',amount:number,direction:'debit'|'credit';
  if(annual&&a){date=iso(+a[3],months.indexOf(a[2].toUpperCase())+1,+a[1]);raw=a[4];amount=cash(a[5]);direction=a[6].toUpperCase()==='CR'?'credit':'debit';if(date<start!||date>end!)throw Error('An annual transaction date is outside the stated period.');if(a[7]!==last4)throw Error('Annual statements with multiple card numbers need separate card imports.');}
  else if(bank==='HDFC'&&h){date=iso(+h[3],+h[2],+h[1]);time=h[4];raw=h[5];amount=cash(h[7]);direction=h[6]?'credit':'debit';}
  else if(bank==='HSBC'&&b){const mo=months.indexOf(b[2].toUpperCase())+1;date=hsbcTransactionDate(+b[1],mo,start!,end!);raw=b[3];amount=cash(b[4]);direction=b[5]?'credit':'debit';}
  else{if((annual&&/^\s*\d{2}-[A-Z]{3}-20\d{2}/i.test(line))||(bank==='HDFC'&&/^\s*\d{2}\/\d{2}\/20\d{2}\s*\|/.test(line))||(bank==='HSBC'&&/^\s*\d{2}(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s/.test(line)))warnings.push('A dated line could not be read. Check the source PDF before importing.');continue;}
  if(!Number.isSafeInteger(amount)||amount<=0){warnings.push('A zero or invalid amount was skipped.');continue;}
  const identity=[cardKey,date,time,raw.trim().toLowerCase().replace(/\s+/g,' '),amount,direction].join('|'),occ=(occurrences.get(identity)??0)+1;occurrences.set(identity,occ);
  const c=classify(raw,direction);transactions.push({id:digest(identity+'|'+occ),date,description:merchantName(raw),amount,direction,...c,merchantKey:merchantKey(raw),statementId:id,statementIds:[id],cardKey});
 }
 if(!transactions.length)throw Error('No readable transactions were found. Scanned PDFs are not supported yet.');
 const billedTransactions=annual&&summaryThrough?transactions.filter(t=>t.date<=summaryThrough):transactions;
 const billedDebits=billedTransactions.filter(t=>t.direction==='debit').reduce((s,t)=>s+t.amount,0),billedCredits=billedTransactions.filter(t=>t.direction==='credit').reduce((s,t)=>s+t.amount,0);
 const debits=transactions.filter(t=>t.direction==='debit').reduce((s,t)=>s+t.amount,0),credits=transactions.filter(t=>t.direction==='credit').reduce((s,t)=>s+t.amount,0),difference=annual?(expectedDebits===null||expectedCredits===null?null:Math.abs(billedDebits-expectedDebits)+Math.abs(billedCredits-expectedCredits)):(opening===null||closing===null?null:opening+debits-credits-closing);
 if(difference!==null&&difference!==0)warnings.push(annual?'The extracted debit or credit total differs from the annual summary. Review before importing.':'The extracted transactions do not reconcile with the statement balance. Review before importing.');
 if(difference===null)warnings.push(annual?'Annual summary totals could not be read. Check debit and credit totals.':'Balance reconciliation was unavailable. Check debit and credit totals.');
 const dates=transactions.map(t=>t.date).sort();
 const priorCycleRows=bank==='HSBC'&&start?transactions.filter(t=>t.date<start).length:0;
 if(priorCycleRows)warnings.push(`${priorCycleRows} transaction(s) predate the billing period. Their original spending dates are preserved; review them against the statement.`);
 return {statement:{id,bank,cardKey,name:name.slice(0,150),uploadedAt:new Date().toISOString(),start:start??dates[0],end:end??dates.at(-1)!,opening,closing,debits,credits,difference,rows:transactions.length,coverageInferred:!start,format:annual?'hdfc-annual':bank==='HDFC'?'hdfc-monthly':'hsbc-monthly',reconciliation:annual?'totals':'balance',expectedDebits,expectedCredits,summaryThrough,postSummaryRows:transactions.length-billedTransactions.length,warnings:[...new Set(warnings)]},transactions};
}
export {categories};
