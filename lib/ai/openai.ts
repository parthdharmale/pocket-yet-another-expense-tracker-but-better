import {entryJsonSchema,extractedEntrySchema,extractionInstructions} from './entry';
import type {PocketData} from '../pocket/types';
export const AI_MODEL=process.env.OPENAI_ENTRY_MODEL??'gpt-4.1-mini';
export async function extractEntry(description:string,data:PocketData,today:string,selectedDate:string){
 const key=process.env.OPENAI_API_KEY;if(!key)throw Error('AI setup is incomplete. You can still add entries manually.');
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:AI_MODEL,store:false,instructions:extractionInstructions(data,today,selectedDate),input:description,max_output_tokens:800,temperature:0,text:{format:{type:'json_schema',name:'pocket_entry',strict:true,schema:entryJsonSchema}}}),signal:AbortSignal.timeout(20000)});
 if(!response.ok){if(response.status===429)throw Error('OpenAI is busy or your API quota is exhausted. Try again later, or use the manual form.');if(response.status===401||response.status===403)throw Error('The OpenAI key could not access this model. You can still add entries manually.');throw Error('AI could not fill this entry. Try again, or use the manual form.');}
 const result=await response.json() as {status:string;output?:{content?:{type:string;text?:string}[]}[]};
 if(result.status!=='completed')throw Error('AI did not finish reading the purchase. Try a shorter description.');
 const text=result.output?.flatMap(item=>item.content??[]).filter(item=>item.type==='output_text').map(item=>item.text??'').join('');
 if(!text)throw Error('AI could not interpret this description. Use the manual form.');
 return extractedEntrySchema.parse(JSON.parse(text));
}
