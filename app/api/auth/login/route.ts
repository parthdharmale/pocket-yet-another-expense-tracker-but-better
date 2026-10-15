import {createHmac} from 'node:crypto';
import {NextResponse} from 'next/server';
import {takeLoginAttempt} from '@/lib/auth/rate-limit';
import {authConfig,sameOrigin} from '@/lib/auth/server';
import {directorySnapshot,changeDirectory} from '@/lib/auth/directory';
import {normalizeEmail} from '@/lib/auth/members';
import {verifyPassword,createSession,COOKIE_NAME,SESSION_SECONDS} from '@/lib/auth/session';
export const runtime='nodejs';
const failure=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 if(!sameOrigin(req))return failure('Invalid request origin.',403);
 try{
  const text=await req.text();if(text.length>4096)return failure('Invalid request.',400);
  const {password,email}=JSON.parse(text);if(typeof password!=='string'||password.length>1024||(email!==undefined&&(typeof email!=='string'||email.length>254)))return failure('Enter your email and password.',400);
  const {passwordHash:ownerHash,secret}=authConfig(),normalized=typeof email==='string'?normalizeEmail(email):'';
  const ip=process.env.VERCEL?req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()??'unknown':'local';
  const digest=(value:string)=>createHmac('sha256',secret).update(value).digest('hex');
  if(!await takeLoginAttempt(digest('ip:'+ip),Date.now(),digest('email:'+normalized)))return NextResponse.json({error:'Too many attempts. Please wait 15 minutes.'},{status:429,headers:{'Retry-After':'900','Cache-Control':'no-store'}});
  const owner=!normalized||normalized===normalizeEmail(process.env.POCKET_OWNER_EMAIL??'');
  const member=owner?null:(await directorySnapshot()).value.members.find(m=>m.email===normalized&&m.status==='approved');
  const hash=owner?ownerHash:member?.passwordHash??ownerHash;
  // Unknown addresses still perform the same expensive password check.
  const matches=verifyPassword(password,hash);
  if(!matches||(!owner&&!member?.passwordHash))return failure('Email or password is incorrect, or access is unavailable.',401);
  const subject=owner?'personal':member!.id;
  if(member&&!member.joinedAt)await changeDirectory(d=>{const current=d.members.find(m=>m.id===member.id);if(current)current.joinedAt??=new Date().toISOString();});
  const response=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
  response.cookies.set(COOKIE_NAME,createSession(secret,hash,Date.now(),subject),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:SESSION_SECONDS});return response;
 }catch{return failure('Pocket could not unlock right now. Please try again shortly.',503);}
}
