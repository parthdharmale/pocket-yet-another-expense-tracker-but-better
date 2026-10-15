import {z} from 'zod';
import {cookies} from 'next/headers';
import {authConfig,sameOrigin} from '@/lib/auth/server';
import {COOKIE_NAME,validSession} from '@/lib/auth/session';
import {admitVisit,anonymousHash,recordVisit,rememberVisit} from '@/lib/analytics/store';
export const maxDuration=10;
const schema=z.object({visitor:z.string().uuid(),session:z.string().uuid(),page:z.enum(['site','demo'])}).strict();
const done=()=>new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 if(!sameOrigin(req)||req.headers.get('sec-fetch-site')==='cross-site')return new Response(null,{status:403});
 if(req.headers.get('dnt')==='1'||req.headers.get('sec-gpc')==='1'||/bot|crawler|spider|headless|preview|slurp/i.test(req.headers.get('user-agent')??''))return done();
 if(!req.headers.get('content-type')?.startsWith('application/json'))return new Response(null,{status:415});
 if(Number(req.headers.get('content-length')??0)>512)return new Response(null,{status:413});
 try{
  const reader=req.body?.getReader();if(!reader)return new Response(null,{status:400});
  let text='',size=0;const decoder=new TextDecoder();
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>512){await reader.cancel();return new Response(null,{status:413})}text+=decoder.decode(value,{stream:true})}text+=decoder.decode();}finally{reader.releaseLock();}
  const body=schema.safeParse(JSON.parse(text));if(!body.success)return new Response(null,{status:400});
  const visitor=anonymousHash('visitor:'+body.data.visitor),session=anonymousHash('session:'+body.data.visitor+':'+body.data.session),key=session+':'+body.data.page;
  const ip=anonymousHash('ip:'+(req.headers.get('x-vercel-forwarded-for')??req.headers.get('x-forwarded-for')??'unknown').split(',')[0].trim());
  if(!admitVisit(ip,key))return done();
  const {secret,passwordHash}=authConfig();
  if(validSession((await cookies()).get(COOKIE_NAME)?.value,secret,passwordHash)){rememberVisit(key);return done();}
  await recordVisit({visitor,session,page:body.data.page});rememberVisit(key);return done();
 }catch{return done();} // Analytics never blocks the app or returns stored data.
}
