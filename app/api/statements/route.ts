import {z} from 'zod';
import {getPocketUser,sameOrigin} from '@/lib/auth/server';
import {statementSnapshot,changeStatements} from '@/lib/statements/store';
import {statementText} from '@/lib/statements/pdf';
import {parseStatement,digest} from '@/lib/statements/parser';
import {importStatement,removeStatement,saveMerchant,eligibleBusiness,setOneOff} from '@/lib/statements/model';
import {saveSpendRule,removeSpendRule} from '@/lib/statements/spend-labels';
import {categories,kinds} from '@/lib/statements/types';
import {researchMerchant} from '@/lib/statements/research';
import {takeAiRequest} from '@/lib/ai/quota';
export const runtime='nodejs';export const maxDuration=60;
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
async function access(req?:Request){const user=await getPocketUser();if(!user)return json({error:'Sign in first.'},401);if(user.role!=='owner')return json({error:'Owner access required.'},403);if(req&&!sameOrigin(req))return json({error:'Invalid request origin.'},403);return null;}
export async function GET(){const denied=await access();if(denied)return denied;try{return json((await statementSnapshot()).value)}catch{return json({error:'Statement storage is unavailable.'},503)}}
export async function POST(req:Request){const denied=await access(req);if(denied)return denied;try{
 if(Number(req.headers.get('content-length')??0)>4300000)return json({error:'Upload a PDF under 4 MB.'},413);
 const form=await req.formData(),file=form.get('file'),password=form.get('password'),mode=form.get('mode');
 if(!(file instanceof File)||file.size>4000000||file.size===0)throw Error('Upload a PDF under 4 MB.');
 if(mode!=='preview'&&mode!=='import')throw Error('Invalid import mode.');
 if(password!==null&&(typeof password!=='string'||password.length>256))throw Error('Invalid PDF password.');
 const bytes=new Uint8Array(await file.arrayBuffer());if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('Choose a PDF statement.');
 const fileHash=digest(bytes);
 let text;try{text=await statementText(bytes,typeof password==='string'?password:undefined)}catch(error){if(error instanceof Error&&/password/i.test(error.message))throw Error('This PDF needs its correct password. It is used only to read this upload.');throw Error('Could not read this PDF. Use a text-based statement with 30 pages or fewer.')}
 const parsed=parseStatement(text,fileHash,file.name);
 if(mode==='preview')return json(parsed);
 const version=z.coerce.number().int().nonnegative().parse(form.get('version'));let report={added:0,duplicates:0};
 const data=await changeStatements(version,d=>{report=importStatement(d,parsed)});return json({data,...report});
 }catch(error){return json({error:error instanceof Error?error.message:'Could not read this statement.'},400)}}
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('spend-rule'),version:z.number().int().nonnegative(),rule:z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),label:z.string().trim().min(1).max(60),minimum:z.number().int().min(1).max(10000000000),maximum:z.number().int().min(1).max(10000000000),merchant:z.string().trim().max(160)}).strict()}).strict(),
 z.object({action:z.literal('remove-spend-rule'),version:z.number().int().nonnegative(),id:z.string().max(80)}).strict(),
 z.object({action:z.literal('one-off'),version:z.number().int().nonnegative(),id:z.string().max(100),oneOff:z.boolean()}).strict(),
 z.object({action:z.literal('classify'),version:z.number().int().nonnegative(),id:z.string().max(100),category:z.enum(categories),kind:z.enum(kinds)}).strict(),
 z.object({action:z.literal('merchant'),version:z.number().int().nonnegative(),key:z.string().max(160),name:z.string().trim().min(1).max(160),category:z.enum(categories)}).strict(),
 z.object({action:z.literal('research'),version:z.number().int().nonnegative(),key:z.string().max(160)}).strict(),
 z.object({action:z.literal('delete'),version:z.number().int().nonnegative(),id:z.string().max(100)}).strict()
]);
export async function PATCH(req:Request){const denied=await access(req);if(denied)return denied;try{
 const text=await req.text();if(text.length>4096)return json({error:'Request too large.'},413);const input=schema.parse(JSON.parse(text));
 if(input.action==='research'){
  const current=(await statementSnapshot()).value;if(current.version!==input.version)throw Error('Refresh this workspace before researching.');
  const t=current.transactions.find(t=>t.merchantKey===input.key&&(t.kind==='purchase'||t.kind==='refund'));if(!t||!eligibleBusiness(t.merchant))throw Error('Choose a business merchant. Personal payments need manual review.');
  const cached=current.merchants.find(m=>m.key===input.key);if(cached?.sources.length)return json(current);
  const user=await getPocketUser();if(!user||!await takeAiRequest(user.userId))return json({error:'Daily AI research budget is unavailable. Manual categorisation still works.'},429);
  const merchant=await researchMerchant(input.key,t.merchant);return json(await changeStatements(input.version,d=>saveMerchant(d,merchant)));
 }
 return json(await changeStatements(input.version,d=>{
  if(input.action==='spend-rule'){saveSpendRule(d,input.rule);}
  else if(input.action==='remove-spend-rule'){removeSpendRule(d,input.id);}
  else if(input.action==='one-off'){setOneOff(d,input.id,input.oneOff);}
  else if(input.action==='delete'){if(!d.statements.some(s=>s.id===input.id))throw Error('Statement not found.');removeStatement(d,input.id);}
  else if(input.action==='merchant'){if(!d.transactions.some(t=>t.merchantKey===input.key))throw Error('Merchant not found.');const old=d.merchants.find(m=>m.key===input.key);saveMerchant(d,{key:input.key,name:input.name,category:input.category,confidence:'confirmed',sources:old?.sources??[],note:old?.note??'Categorised by you.'});}
  else{const t=d.transactions.find(t=>t.id===input.id);if(!t)throw Error('Transaction not found.');const credit=['refund','repayment','cashback','other-credit'].includes(input.kind);if(credit!==(t.direction==='credit'))throw Error('Choose a type that matches this debit or credit.');t.kind=input.kind;t.category=input.category;t.confidence='confirmed';}
 }));
 }catch(error){return json({error:error instanceof z.ZodError?'Check the selected category or transaction.':error instanceof Error?error.message:'Could not update statement data.'},400)}}
