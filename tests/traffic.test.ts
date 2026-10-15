import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyVisit,emptyTraffic,trafficReport} from '../lib/analytics/traffic.ts';
const now=new Date('2026-10-10T12:00:00Z');
test('site to demo is one site session, one demo session and one visitor, with duplicate refreshes ignored',()=>{
 const empty=emptyTraffic(now),site=applyVisit(empty,{visitor:'a',session:'one',page:'site'},now)!;
 const demo=applyVisit(site,{visitor:'a',session:'one',page:'demo'},now)!;
 assert.deepEqual(trafficReport(demo,now).today,{visitors:1,visits:1,demoVisitors:1,demoVisits:1,conversion:100});
 assert.equal(applyVisit(demo,{visitor:'a',session:'one',page:'site'},now),null);assert.equal(applyVisit(demo,{visitor:'a',session:'one',page:'demo'},now),null);
 assert.equal(empty.totalVisits,0);assert.equal(site.totalDemoVisits,0);
});
test('direct demo visits count towards site totals; unique browsers deduplicate across days and sessions',()=>{
 const yesterday=new Date('2026-10-09T12:00:00Z');let state=emptyTraffic(yesterday);
 for(const [visitor,session,page,date] of [['a','one','demo',yesterday],['a','two','site',now],['b','three','site',now]] as const)state=applyVisit(state,{visitor,session,page},date)!;
 const report=trafficReport(state,now);assert.equal(report.week.visitors,2);assert.equal(report.week.visits,3);assert.equal(report.week.demoVisitors,1);assert.equal(report.week.conversion,50);assert.equal(report.today.visits,2);assert.equal(report.totalVisits,3);
});
test('old detail expires, totals remain and periods respect UTC day boundaries',()=>{
 let state=applyVisit(emptyTraffic(new Date('2026-09-01T12:00:00Z')),{visitor:'old',session:'old',page:'demo'},new Date('2026-09-01T12:00:00Z'))!;
 state=applyVisit(state,{visitor:'new',session:'new',page:'site'},now)!;assert.deepEqual(Object.keys(state.days),['2026-10-10']);
 const report=trafficReport(state,now);assert.equal(report.month.visitors,1);assert.equal(report.totalVisits,2);assert.equal(report.totalDemoVisits,1);assert.equal(report.days.length,30);
 assert.equal(trafficReport(state,new Date('2026-10-11T00:00:00Z')).today.visitors,0);
});
test('daily storage admission ceiling still permits existing sessions to see the demo',()=>{
 const state=emptyTraffic(now);state.days['2026-10-10']={visitors:{a:1},sessions:Object.fromEntries(Array.from({length:2000},(_,i)=>['session-'+i,1]))};
 assert.equal(applyVisit(state,{visitor:'b',session:'new',page:'site'},now),null);
 assert.ok(applyVisit(state,{visitor:'a',session:'session-0',page:'demo'},now));
});
