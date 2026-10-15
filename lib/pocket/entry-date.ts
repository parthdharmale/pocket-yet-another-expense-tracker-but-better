import type {Entry} from './types.ts';
export class EntryDateError extends Error {}
export function entryToday(timezone='Asia/Kolkata',now=new Date()){
 return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function assertPastOrToday(date:string,timezone?:string,now=new Date(),label='Entry'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new EntryDateError(`Choose a valid ${label.toLowerCase()} date.`);
 const current=entryToday(timezone,now);
 if(date>current)throw new EntryDateError(`${label} date cannot be after today (${current}). Choose today or an earlier date.`);
}
export function assertEntryDates(entry:Entry,timezone?:string,now=new Date(),allowRemoval=false){
 // Existing invalid records must remain removable without rewriting their history.
 if(entry.deleted&&allowRemoval)return;
 assertPastOrToday(entry.date,timezone,now);
 for(const refund of entry.refunds)assertPastOrToday(refund.date,timezone,now,'Refund');
}
