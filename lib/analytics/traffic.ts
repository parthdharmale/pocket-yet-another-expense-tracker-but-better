export type Visit={visitor:string;session:string;page:'site'|'demo'};
export type TrafficDay={visitors:Record<string,number>;sessions:Record<string,number>};
export type TrafficState={startedAt:string;days:Record<string,TrafficDay>;totalVisits:number;totalDemoVisits:number};
export type TrafficCounts={visitors:number;visits:number;demoVisitors:number;demoVisits:number;conversion:number};
export type TrafficReport={startedAt:string;updatedAt:string;today:TrafficCounts;week:TrafficCounts;month:TrafficCounts;totalVisits:number;totalDemoVisits:number;days:({date:string}&TrafficCounts)[]};
const day=(now:Date)=>now.toISOString().slice(0,10);
const before=(date:string,n:number)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-n);return day(d)};
export const emptyTraffic=(now=new Date()):TrafficState=>({startedAt:now.toISOString(),days:{},totalVisits:0,totalDemoVisits:0});
export function applyVisit(state:TrafficState,visit:Visit,now=new Date()):TrafficState|null {
 const date=day(now),existing=state.days[date],flag=visit.page==='demo'?3:1,old=existing?.sessions[visit.session]??0;
 if((old&flag)===flag)return null;
 // Fixed retention and a daily admission ceiling bound anonymous storage growth.
 if(!old&&existing&&Object.keys(existing.sessions).length>=2000)return null;
 const next=structuredClone(state);
 for(const key of Object.keys(next.days))if(key<before(date,30)||key>date)delete next.days[key];
 const bucket=next.days[date]??={visitors:{},sessions:{}};
 bucket.sessions[visit.session]=old|flag;bucket.visitors[visit.visitor]=(bucket.visitors[visit.visitor]??0)|flag;
 if(!old)next.totalVisits++;if((flag&2)&&!(old&2))next.totalDemoVisits++;
 return next;
}
function counts(days:TrafficDay[]):TrafficCounts {
 const visitors=new Set<string>(),demo=new Set<string>();let visits=0,demoVisits=0;
 for(const d of days){for(const [id,flags] of Object.entries(d.visitors)){visitors.add(id);if(flags&2)demo.add(id)}for(const flags of Object.values(d.sessions)){visits++;if(flags&2)demoVisits++}}
 return {visitors:visitors.size,visits,demoVisitors:demo.size,demoVisits,conversion:visitors.size?Math.round(demo.size/visitors.size*100):0};
}
export function trafficReport(state:TrafficState,now=new Date()):TrafficReport {
 const date=day(now),range=(n:number)=>Object.entries(state.days).filter(([key])=>key>=before(date,n-1)&&key<=date).map(([,value])=>value);
 return {startedAt:state.startedAt,updatedAt:now.toISOString(),today:counts(range(1)),week:counts(range(7)),month:counts(range(30)),totalVisits:state.totalVisits,totalDemoVisits:state.totalDemoVisits,days:Array.from({length:30},(_,i)=>{const dateKey=before(date,29-i);return {date:dateKey,...counts(state.days[dateKey]?[state.days[dateKey]]:[])}})};
}
