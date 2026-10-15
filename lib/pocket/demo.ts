import {assertEntryDates} from './entry-date.ts';
import type {PocketData,Collection,Entity,Entry,Wish} from './types.ts';
import {chooseRule,eligible} from './engine.ts';
import {schemas} from './validation.ts';

// In-memory changes only; caller owns this disposable ledger.
export function changeDemoLedger(data:PocketData,collection:Collection,value:Entity,wishId?:string):PocketData {
 const next=structuredClone(data),parsed=schemas[collection].parse(value) as Entity;
 if(collection==='entries'){
  const entry=parsed as Entry;assertEntryDates(entry,next.settings.timezone,undefined,next.entries.some(old=>old.id===entry.id&&old.date===entry.date));const platform=next.platforms.find(p=>p.id===entry.platformId),card=next.cards.find(c=>c.id===entry.paymentId);
  if(entry.kind==='spend'&&!platform)throw Error('Choose a platform.');
  if(entry.kind==='resisted'){entry.platformId='none';entry.paymentId='none';entry.share=entry.amount;entry.credited=null;}
  if(entry.kind==='spend'&&!card&&!next.settings.paymentModes.includes(entry.paymentId))throw Error('Choose a payment mode.');
  if(entry.kind==='spend'&&card&&!eligible(card,entry.amount))throw Error('This card is unavailable for this amount.');
  entry.category=entry.kind==='resisted'?'Other':platform!.category;entry.reward=entry.kind==='spend'&&card?chooseRule(card,platform!,entry.date):null;entry.billingDay=entry.kind==='resisted'?null:card?.billingDay??null;
  if(wishId){const wish=next.wishes.find(w=>w.id===wishId);if(!wish||wish.status!=='waiting')throw Error('This want has already been logged.');wish.status=entry.kind==='spend'?'bought':'resisted';wish.entryId=entry.id;}
 }
 if(collection==='wishes'&&!next.platforms.some(p=>p.id===(parsed as Wish).platformId))throw Error('Choose a platform.');
 if(collection==='settings')next.settings=parsed as PocketData['settings'];
 else {const items=next[collection] as Entity[],index=items.findIndex(item=>item.id===parsed.id);if(index<0){if(items.length>=300)throw Error('Demo limit reached. Reset the demo to keep exploring.');items.push(parsed)}else items[index]=parsed;}
 next.version++;return next;
}
