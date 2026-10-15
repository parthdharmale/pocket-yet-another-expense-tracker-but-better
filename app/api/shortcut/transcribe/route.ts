import {shortcutUser} from '@/lib/shortcut/access';
import {readRecording,transcribeRecording,TranscriptionError} from '@/lib/ai/transcription';
import {takeAiRequest} from '@/lib/ai/quota';
export const runtime='nodejs';
export const maxDuration=60;
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){try{
 const user=await shortcutUser(req);if(!user)return json({status:'error',message:'Shortcut access is invalid or revoked. Use your existing Pocket Bearer token.'},401);
 if(!process.env.OPENAI_API_KEY)return json({status:'error',message:'Transcription is not configured. Use Type for now.'},503);
 const file=await readRecording(req);
 if(!await takeAiRequest(user.userId))return json({status:'error',message:'Today’s AI limit has been reached. Add this entry manually in Pocket.'},429);
 const text=await transcribeRecording(file);
 return json({status:'transcribed',text,message:'Transcribed. Send this text to the entry endpoint to save it.'});
}catch(error){
 if(error instanceof TranscriptionError)return json({status:'error',message:error.message},error.status);
 if(error instanceof Error&&(error.name==='TimeoutError'||error.name==='AbortError'))return json({status:'error',message:'Transcription timed out. Retry the recording or use Type. Nothing has been saved.'},504);
 return json({status:'error',message:'Could not transcribe this recording. Try again or use Type. Nothing has been saved.'},503);
}}
