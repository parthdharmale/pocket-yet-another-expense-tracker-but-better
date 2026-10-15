import 'server-only';
import {cookies} from 'next/headers';
import {COOKIE_NAME,validSession,sessionSubject} from './session';
import {activeMember} from './directory';
export function authConfig(){const passwordHash=process.env.POCKET_PASSWORD_HASH,secret=process.env.POCKET_SESSION_SECRET;if(!passwordHash?.startsWith('scrypt:')||!secret||secret.length<32)throw Error('Password access is not configured.');return {passwordHash,secret};}
export async function getPocketUser():Promise<{userId:string;role:'owner'|'member';email:string}|null>{try{
 const {passwordHash,secret}=authConfig(),token=(await cookies()).get(COOKIE_NAME)?.value,subject=sessionSubject(token);
 if(subject==='personal')return validSession(token,secret,passwordHash)?{userId:'personal',role:'owner',email:process.env.POCKET_OWNER_EMAIL??''}:null;
 if(!subject)return null;const member=await activeMember(subject);
 return member?.passwordHash&&validSession(token,secret,member.passwordHash,Date.now(),member.id)?{userId:member.id,role:member.role,email:member.email}:null;
 }catch{return null;}}
export function sameOrigin(req:Request){try{const origin=new URL(req.headers.get('origin')??'');return origin.host===req.headers.get('host')&&(origin.protocol==='https:'||(process.env.NODE_ENV!=='production'&&origin.protocol==='http:'));}catch{return false;}}
