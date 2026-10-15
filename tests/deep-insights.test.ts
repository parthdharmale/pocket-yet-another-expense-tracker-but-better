import test from 'node:test';
import assert from 'node:assert/strict';
import {deepSpending} from '../lib/statements/deep-insights.ts';
import {emptyData,setOneOff,importStatement} from '../lib/statements/model.ts';
import type {StatementData,Transaction} from '../lib/statements/types.ts';
function source(d:StatementData,start='2026-01-01',end='2026-06-30',cardKey='HDFC:1111'){d.statements.push({id:cardKey,bank:'HDFC',cardKey,name:'fixture',uploadedAt:'2030-01-01',start,end,opening:0,closing:0,debits:0,credits:0,difference:0,rows:0,warnings:[]});}
function tx(d:StatementData,date:string,amount:number,extra:Partial<Transaction>={}){const row:Transaction={id:String(d.transactions.length),date,amount,merchant:'Shop',merchantKey:'shop',description:'fixture',direction:'debit',kind:'purchase',category:'Shopping',confidence:'known',statementId:'source',statementIds:['source'],cardKey:'HDFC:1111',...extra};d.transactions.push(row);return row;}
const result=(d:StatementData,start='2026-06-01',end='2026-06-30',mode='month',card='')=>deepSpending(d,start,end,card,'2026-07-01',mode);
test('amount bands have no boundary overlaps and represent purchase value, excluding credits and fees',()=>{
 const d=emptyData();source(d);for(const n of [0,19999,20000,49999,50000,99999,100000,299999,300000,999999,1000000])tx(d,'2026-06-10',n);
 tx(d,'2026-06-10',9999999,{kind:'repayment',direction:'credit'});tx(d,'2026-06-11',10000,{kind:'refund',direction:'credit'});tx(d,'2026-06-12',10000,{kind:'fee'});
 const r=result(d);assert.deepEqual(r.bands.map(b=>b.count),[2,2,2,2,2,1]);assert.equal(r.bands.reduce((n,b)=>n+b.amount,0),r.gross);assert.ok(Math.abs(r.bands.reduce((n,b)=>n+b.percent,0)-100)<1e-8);assert.equal(r.biggest[0].amount,1000000);
});
test('frequency and purchase-size effects reconcile to the observed gross change',()=>{
 const d=emptyData();source(d);tx(d,'2026-05-10',10000);tx(d,'2026-05-20',10000);for(const date of ['01','10','20'])tx(d,`2026-06-${date}`,20000);
 const c=result(d).comparison;assert.equal(c.ready,true);assert.equal(c.frequencyEffect,10000);assert.equal(c.basketEffect,30000);assert.equal(c.change,40000);assert.equal(c.frequencyEffect+c.basketEffect,c.change);
});
test('all-time compares equal calendar halves; another card coverage gap blocks confident attribution',()=>{
 const d=emptyData();source(d);source(d,'2026-06-01','2026-06-30','HSBC:2222');tx(d,'2026-05-10',10000);tx(d,'2026-06-10',20000);
 const c=result(d,'2026-05-01','2026-06-30','all').comparison;assert.equal(c.windowDays,30);assert.equal(c.previousEnd,'2026-05-30');assert.equal(c.currentStart,'2026-06-01');assert.equal(c.ready,false);
 assert.equal(result(d,'2026-05-01','2026-06-30','all','HDFC:1111').comparison.ready,true);
});
test('one-off flags only change the everyday split and median; actual chart and totals stay intact',()=>{
 const d=emptyData();source(d);const t=tx(d,'2026-06-01',100000);tx(d,'2026-06-02',20000);const before=result(d);setOneOff(d,t.id,true);const after=result(d);
 assert.equal(after.gross,before.gross);assert.deepEqual(after.chart,before.chart);assert.equal(after.exceptions.routine,20000);assert.equal(after.exceptions.median,20000);assert.equal(after.exceptions.amount,100000);setOneOff(d,t.id,false);assert.equal(result(d).exceptions.routine,120000);
 assert.throws(()=>setOneOff(d,'missing',true));t.kind='refund';assert.throws(()=>setOneOff(d,t.id,true));
});
test('duplicate import preserves the saved one-off choice',()=>{
 const d=emptyData();const t=tx(d,'2026-06-01',100000);setOneOff(d,t.id,true);
 const parsed={statement:{id:'new',bank:'HDFC' as const,cardKey:'HDFC:1111',name:'new fixture',uploadedAt:'2030-01-01',start:'2026-06-01',end:'2026-06-30',opening:0,closing:0,debits:100000,credits:0,difference:0,rows:1,warnings:[]},transactions:[{...t,oneOff:undefined}]};
 importStatement(d,parsed);assert.equal(d.transactions[0].oneOff,true);
});
test('bursts use three calendar days, require multiple spend days and never double-count overlapping windows',()=>{
 const d=emptyData();source(d);for(const day of ['01','02','03','04'])tx(d,`2026-06-${day}`,10000);for(let i=0;i<4;i++)tx(d,'2026-06-20',100000);
 const r=result(d);assert.equal(r.bursts.length,1);assert.equal(r.bursts[0].amount,30000);assert.equal(r.bursts[0].count,3);assert.equal(r.bursts[0].start,'2026-06-01');
});
test('monthly chart uses transaction dates, net refunds and only covered months in its forecast',()=>{
 const d=emptyData();source(d);for(let m=1;m<=6;m++)tx(d,`2026-${String(m).padStart(2,'0')}-10`,m*10000);tx(d,'2026-06-12',10000,{kind:'refund',direction:'credit'});tx(d,'2026-06-15',500000,{kind:'repayment',direction:'credit'});
 const r=result(d,'2026-01-01','2026-06-30','all');assert.equal(r.chart.unit,'month');assert.equal(r.chart.points[5].actual,50000);assert.equal(r.chart.baseline,Math.round((40000+50000+50000)/3));assert.equal(r.chart.points.filter(p=>p.projected).length,3);assert.equal(r.chart.points.at(-1)!.date,'2026-09-01');assert.equal(r.chart.points.at(-1)!.actual,null);
});
test('partial or missing months never become zero-spend baseline months',()=>{
 const d=emptyData();source(d,'2026-04-01','2026-05-31');source(d,'2026-06-01','2026-06-15','HSBC:2222');tx(d,'2026-04-10',10000);tx(d,'2026-06-10',20000,{cardKey:'HSBC:2222'});
 const r=result(d,'2026-01-01','2026-06-30','all');assert.equal(r.chart.baseline,null);assert.equal(r.chart.hasProjection,false);assert.equal(r.chart.partial,true);assert.equal(r.chart.points[0].actual,null);assert.equal(r.exceptions.median,null);
});
test('daily projections stop at selected month end and remain separate from recorded totals',()=>{
 const d=emptyData();source(d,'2026-06-01','2026-06-14');for(let day=1;day<=14;day++)tx(d,`2026-06-${String(day).padStart(2,'0')}`,10000);
 const r=result(d);assert.equal(r.chart.baseline,10000);assert.equal(r.chart.hasProjection,true);assert.equal(r.chart.points.at(-1)!.date,'2026-06-30');assert.equal(r.chart.points.filter(p=>p.projected).length,16);assert.equal(r.gross,140000);
});
test('card and date filters apply to largest purchases, amount mix, one-offs and bursts',()=>{
 const d=emptyData();source(d);tx(d,'2026-06-01',20000,{oneOff:true});tx(d,'2026-06-02',999999,{cardKey:'HSBC:2222'});tx(d,'2026-05-01',999999);
 const r=result(d,'2026-06-01','2026-06-30','month','HDFC:1111');assert.equal(r.gross,20000);assert.equal(r.biggest.length,1);assert.equal(r.exceptions.amount,20000);assert.equal(r.bands[1].percent,100);assert.equal(r.bursts.length,0);
});
test('empty or inverted ranges have no fabricated values or forecast',()=>{
 const d=emptyData();const r=result(d,'2026-06-30','2026-06-01');assert.equal(r.gross,0);assert.equal(r.chart.points.length,0);assert.equal(r.chart.hasProjection,false);assert.equal(r.bands.every(b=>b.percent===0),true);
});
