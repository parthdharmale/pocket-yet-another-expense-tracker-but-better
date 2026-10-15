export const TRANSCRIPTION_MODEL=process.env.OPENAI_TRANSCRIPTION_MODEL||'gpt-4o-mini-transcribe';
export const MAX_AUDIO_BYTES=4_000_000;
export class TranscriptionError extends Error {
 status:number;
 constructor(message:string,status:number){super(message);this.status=status;}
}
const formats:Record<string,string>={'audio/mp4':'m4a','audio/m4a':'m4a','audio/x-m4a':'m4a','audio/mpeg':'mp3','audio/mp3':'mp3','audio/wav':'wav','audio/x-wav':'wav','audio/webm':'webm','audio/ogg':'ogg','audio/flac':'flac','application/octet-stream':'m4a'};
export async function readRecording(req:Request){
 const type=(req.headers.get('content-type')??'application/octet-stream').split(';')[0].trim().toLowerCase();
 const extension=formats[type];
 if(!extension)throw new TranscriptionError('Send the Recorded Audio as Request Body: File, rather than JSON or Form.',415);
 const tooLarge=()=>new TranscriptionError('Recording is too large. Record a shorter clip (under 4 MB).',413);
 if(Number(req.headers.get('content-length'))>MAX_AUDIO_BYTES)throw tooLarge();
 const reader=req.body?.getReader();if(!reader)throw new TranscriptionError('No recording received. Record your purchase and try again.',400);
 const chunks:Uint8Array<ArrayBuffer>[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_AUDIO_BYTES){await reader.cancel();throw tooLarge();}chunks.push(new Uint8Array(value));}}finally{reader.releaseLock();}
 if(!size)throw new TranscriptionError('The recording is empty. Record your purchase and try again.',400);
 return new File(chunks,`recording.${extension}`,{type:type==='application/octet-stream'?'audio/mp4':type});
}
export async function transcribeRecording(file:File){
 const key=process.env.OPENAI_API_KEY;if(!key)throw new TranscriptionError('Transcription is not configured. Use Type for now.',503);
 const body=new FormData();body.set('file',file);body.set('model',TRANSCRIPTION_MODEL);body.set('response_format','json');
 // Proper names help with Indian merchants and cards; omit language to allow multilingual speech.
 body.set('prompt','Swiggy, Instamart, Dineout, Zomato, Zepto, Amazon Now, Amazon shopping, Flipkart Minutes, HDFC, HSBC, RuPay, ICICI Coral, Infinia, SBI HPCL, Amex.');
 const response=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${key}`},body,signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new TranscriptionError(response.status===429?'Transcription is busy or the OpenAI quota is exhausted. Try again later.':response.status===400?'Could not read this recording. Use Record Audio with Normal quality and try again.':'Transcription is unavailable. Try again later or use Type.',response.status===429?429:response.status===400?422:503);
 const result=await response.json() as {text?:unknown};const text=typeof result.text==='string'?result.text.trim():'';
 if(!text)throw new TranscriptionError('No speech was detected. Record again or use Type. Nothing has been saved.',422);
 if(text.length>2000)throw new TranscriptionError('That recording is too long for an entry. Please record a shorter description.',422);
 return text;
}
