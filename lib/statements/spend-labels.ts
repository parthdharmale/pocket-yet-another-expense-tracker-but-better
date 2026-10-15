import type {StatementData,SpendLabelRule,Transaction} from './types.ts';
const normalized=(s:string)=>s.trim().toLowerCase();
export function matchesSpendRule(t:Transaction,rule:SpendLabelRule){
 return t.kind==='purchase'&&t.amount>=rule.minimum&&t.amount<=rule.maximum&&(!rule.merchant||normalized(`${t.merchant} ${t.description}`).includes(normalized(rule.merchant)));
}
export function saveSpendRule(data:StatementData,rule:SpendLabelRule){
 if(!/^[a-zA-Z0-9_-]{1,80}$/.test(rule.id)||!rule.label.trim()||rule.label.trim().length>60||rule.merchant.trim().length>160||!Number.isSafeInteger(rule.minimum)||!Number.isSafeInteger(rule.maximum)||rule.minimum<1||rule.maximum<rule.minimum||rule.maximum>10000000000)throw Error('Enter a label, a valid purchase amount or range, and an optional merchant.');
 const rules=data.spendRules??[];
 if(!rules.some(r=>r.id===rule.id)&&rules.length>=100)throw Error('You can save up to 100 amount rules.');
 data.spendRules=[...rules.filter(r=>r.id!==rule.id),{...rule,label:rule.label.trim(),merchant:rule.merchant.trim()}];
}
export function removeSpendRule(data:StatementData,id:string){
 if(!data.spendRules?.some(r=>r.id===id))throw Error('Amount rule not found.');
 data.spendRules=data.spendRules.filter(r=>r.id!==id);
}
export function spendLabelGroups(rows:Transaction[],rules:SpendLabelRule[]){
 const groups=new Map<string,{label:string;rules:SpendLabelRule[];rows:Transaction[];total:number}>();
 for(const rule of rules){const key=normalized(rule.label);let group=groups.get(key);if(!group){group={label:rule.label,rules:[],rows:[],total:0};groups.set(key,group);}group.rules.push(rule);}
 for(const group of groups.values()){
  group.rows=rows.filter(t=>group.rules.some(r=>matchesSpendRule(t,r))).sort((a,b)=>b.date.localeCompare(a.date)||b.amount-a.amount);
  group.total=group.rows.reduce((n,t)=>n+t.amount,0);
 }
 return [...groups.values()].sort((a,b)=>b.total-a.total||a.label.localeCompare(b.label));
}
