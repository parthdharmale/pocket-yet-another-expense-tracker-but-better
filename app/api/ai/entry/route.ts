import {z} from 'zod';
import {getPocketUser,sameOrigin} from '@/lib/auth/server';
import {load} from '@/lib/pocket/store';
import {assertPastOrToday,EntryDateError} from '@/lib/pocket/entry-date';
import {today} from '@/lib/pocket/engine';
import {prepareDraft} from '@/lib/ai/entry';
import {extractEntry,AI_MODEL} from '@/lib/ai/openai';
import {takeAiRequest} from '@/lib/ai/quota';
export const runtime='nodejs';
export const maxDuration=30;
const response=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 const user=await getPocketUser();if(!user)return response({error:'Please unlock Pocket.'},401);
 if(!sameOrigin(req))return response({error:'Invalid request origin.'},403);
 try{
  if(!process.env.OPENAI_API_KEY)return response({error:'AI setup is incomplete. You can still use the manual form.'},503);
  const text=await req.text();if(text.length>5000)return response({error:'Keep the description under 2,000 characters.'},413);
  const body=z.object({description:z.string().trim().min(3).max(2000),selectedDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s)}).strict().parse(JSON.parse(text));
  const data=await load(user.userId);assertPastOrToday(body.selectedDate,data.settings.timezone);
  if(!await takeAiRequest(user.userId))return response({error:'Today’s AI limit has been reached. You can still add entries manually.'},429);
  const extracted=await extractEntry(body.description,data,today(data.settings.timezone),body.selectedDate);
  return response({...prepareDraft(extracted,data),model:AI_MODEL});
 }catch(error){if(error instanceof EntryDateError)return response({error:error.message},422);if(error instanceof z.ZodError)return response({error:'The description could not be read reliably. Please use the form or try again.'},422);if(error instanceof Error&&(error.name==='TimeoutError'||error.name==='AbortError'))return response({error:'AI took too long. Try again, or use the manual form.'},504);return response({error:error instanceof Error?error.message:'Could not fill the entry.'},502);}
}
