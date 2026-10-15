import {addDays,iso,parseDate,weekBounds} from './engine.ts';

// Browsing a past period must never select a future day. A week containing
// today remains reachable even when its original anchor falls later in it.
export function moveCalendar(date:string,view:'month'|'week',direction:number,latest:string){
 const next=view==='week'?addDays(date,direction*7):iso(new Date(Date.UTC(parseDate(date).getUTCFullYear(),parseDate(date).getUTCMonth()+direction,1,12)));
 const start=view==='week'?weekBounds(next)[0]:next;
 return start>latest?null:{date:next,selected:next>latest?latest:next};
}
