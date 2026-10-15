import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesSpendRule,saveSpendRule,removeSpendRule,spendLabelGroups} from '../lib/statements/spend-labels.ts';
import {emptyData,importStatement} from '../lib/statements/model.ts';
import type {SpendLabelRule,Transaction} from '../lib/statements/types.ts';
const rule:SpendLabelRule={id:'coke',label:'Diet Coke',minimum:14700,maximum:14700,merchant:'swiggy'};
const row=(id:string,extra:Partial<Transaction>={}):Transaction=>({id,date:'2026-09-10',amount:14700,merchant:'Swiggy',merchantKey:'swiggy',description:'SWIGGY BANGALORE',kind:'purchase',direction:'debit',category:'Food delivery',confidence:'known',statementId:'s',statementIds:['s'],cardKey:'HDFC:1',...extra});
test('exact amount rules match paise and optional literal merchant text, excluding non-purchases',()=>{
 assert.equal(matchesSpendRule(row('1'),rule),true);assert.equal(matchesSpendRule(row('1',{amount:14701}),rule),false);
 assert.equal(matchesSpendRule(row('1',{merchant:'Zomato',description:'Zomato'}),rule),false);
 assert.equal(matchesSpendRule(row('1',{merchant:'Renamed merchant'}),rule),true);
 for(const kind of ['refund','repayment','cashback','fee','interest'] as const)assert.equal(matchesSpendRule(row(kind,{kind}),rule),false);
 assert.equal(matchesSpendRule(row('1',{merchant:'Zomato',description:'Zomato'}),{...rule,merchant:''}),true);
 assert.equal(matchesSpendRule(row('1'),{...rule,merchant:'.*'}),false);
});
test('inclusive ranges include endpoints and reject values immediately outside',()=>{
 const ranged={...rule,minimum:14000,maximum:15000};
 for(const amount of [14000,14700,15000])assert.equal(matchesSpendRule(row('1',{amount}),ranged),true);
 for(const amount of [13999,15001])assert.equal(matchesSpendRule(row('1',{amount}),ranged),false);
});
test('same label rules union matching purchases while separate labels can overlap without changing source categories',()=>{
 const rows=[row('1'),row('2',{amount:15000}),row('3',{kind:'refund'})],before=structuredClone(rows);
 const groups=spendLabelGroups(rows,[rule,{...rule,id:'range',label:'diet coke',maximum:15000},{...rule,id:'other',label:'Drinks'}]);
 assert.equal(groups.length,2);assert.equal(groups[0].rows.length,2);assert.equal(groups[0].total,29700);assert.equal(groups[0].rules.length,2);assert.equal(groups[1].total,14700);assert.deepEqual(rows,before);
 assert.equal(spendLabelGroups(rows.slice(1),[rule])[0].total,0);
});
test('old workspaces accept reversible rule updates; invalid ranges and rule limits cannot mutate data',()=>{
 const d=emptyData();saveSpendRule(d,{...rule,label:' Diet Coke ',merchant:' swiggy '});assert.equal(d.spendRules?.[0].label,'Diet Coke');
 saveSpendRule(d,{...rule,label:'Drinks'});assert.equal(d.spendRules?.length,1);assert.equal(d.spendRules?.[0].label,'Drinks');
 for(const invalid of [{minimum:147.1},{minimum:0},{maximum:100},{label:' '},{maximum:Number.MAX_SAFE_INTEGER},{id:'<bad>'}]){const before=structuredClone(d);assert.throws(()=>saveSpendRule(d,{...rule,...invalid}));assert.deepEqual(d,before);}
 removeSpendRule(d,rule.id);assert.deepEqual(d.spendRules,[]);assert.throws(()=>removeSpendRule(d,rule.id));
 for(let i=0;i<100;i++)saveSpendRule(d,{...rule,id:'rule-'+i});assert.throws(()=>saveSpendRule(d,rule));saveSpendRule(d,{...rule,id:'rule-0',label:'Update at limit'});assert.equal(d.spendRules?.length,100);
});
test('saved rules automatically apply to later imports without rewriting purchase classification',()=>{
 const d=emptyData();saveSpendRule(d,rule);const t=row('new');
 importStatement(d,{statement:{id:'s',bank:'HDFC',cardKey:'HDFC:1',name:'fixture',uploadedAt:'2026-10-13',start:'2026-09-01',end:'2026-09-30',opening:0,closing:14700,debits:14700,credits:0,difference:0,rows:1,warnings:[]},transactions:[t]});
 assert.equal(spendLabelGroups(d.transactions,d.spendRules!)[0].total,14700);assert.equal(d.transactions[0].category,'Food delivery');
 importStatement(d,{statement:{...d.statements[0]},transactions:[t]});assert.equal(spendLabelGroups(d.transactions,d.spendRules!)[0].rows.length,1);
});
