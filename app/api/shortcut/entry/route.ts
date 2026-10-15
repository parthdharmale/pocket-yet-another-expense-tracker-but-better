import {z} from 'zod';
import {shortcutUser} from '@/lib/shortcut/access';
import {shortcutEntryId} from '@/lib/shortcut/token';
import {savedResult} from '@/lib/shortcut/results';
import {load,persist} from '@/lib/pocket/store';
import {extractEntry} from '@/lib/ai/openai';
import {prepareDraft,entryFromDraft} from '@/lib/ai/entry';
import {takeAiRequest} from '@/lib/ai/quota';
import {today,chooseRule,eligible} from '@/lib/pocket/engine';
import {EntryDateError} from '@/lib/pocket/entry-date';
import {schemas} from '@/lib/pocket/validation';
export const runtime='nodejs';export const maxDuration=60;
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const failure=(message:string,status:number)=>json({status:'error',message},status);
export async function POST(req:Request){try{
 const user=await shortcutUser(req);if(!user)return failure('Shortcut access is invalid or revoked. Generate a token in Pocket Preferences.',401);
 const text=await req.text();if(text.length>6000)return failure('Keep the description under 2,000 characters.',413);
 const body=z.object({description:z.string().trim().min(3).max(2000),requestId:z.string().trim().min(8).max(100)}).strict().parse(JSON.parse(text));const id=shortcutEntryId(body.requestId,user.userId);
 let data=await load(user.userId);const existing=data.entries.find(e=>e.id===id);if(existing)return json(savedResult(existing,data,body.requestId,true));
 if(!process.env.OPENAI_API_KEY)return failure('AI is not configured. Add this entry in Pocket.',503);
 if(!await takeAiRequest(user.userId))return failure('Today’s AI limit has been reached. Add the entry manually in Pocket.',429);
 const extracted=await extractEntry(body.description,data,today(data.settings.timezone),today(data.settings.timezone));const checked=prepareDraft(extracted,data);
 if(!checked.complete)return json({status:'needs_details',requestId:body.requestId,questions:checked.questions,message:checked.questions.join(' ')||(checked.draft.kind==='resisted'?'Please clarify the avoided purchase and its amount. Nothing has been saved.':'Please clarify the amount, platform, payment mode and split. Nothing has been saved.')});
 for(let attempt=0;attempt<5;attempt++){
  data=await load(user.userId);const duplicate=data.entries.find(e=>e.id===id);if(duplicate)return json(savedResult(duplicate,data,body.requestId,true));
  const entry=entryFromDraft(checked.draft,id,data),card=data.cards.find(c=>c.id===entry.paymentId),platform=data.platforms.find(p=>p.id===entry.platformId)!;
  if(card&&!eligible(card,entry.amount))return failure('That card is unavailable for this purchase. Open Pocket to review.',422);
  entry.reward=entry.kind==='spend'&&card?chooseRule(card,platform,entry.date):null;entry.billingDay=card?.billingDay??null;entry.source='shortcut';schemas.entries.parse(entry);
  if(await persist(user.userId,data.version,[{collection:'entries',value:entry}])){data=await load(user.userId);return json(savedResult(data.entries.find(e=>e.id===id)!,data,body.requestId));}
 }
 return failure('Another entry was saved at the same time. Retry with the same request ID.',409);
}catch(error){if(error instanceof EntryDateError)return failure(error.message,422);if(error instanceof z.ZodError||error instanceof SyntaxError)return failure('Check the description and requestId fields, then try again.',400);if(error instanceof Error&&(error.name==='TimeoutError'||error.name==='AbortError'))return failure('AI timed out. Retry with the same request ID.',504);return failure('Could not add the entry. Retry with the same request ID or open Pocket.',503);}}
