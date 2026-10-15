import {z} from 'zod';
import {getPocketUser,sameOrigin} from '@/lib/auth/server';
import {directorySnapshot,changeDirectory} from '@/lib/auth/directory';
import {approveMember,changeMemberStatus,normalizeEmail} from '@/lib/auth/members';
import {generatedPassword,hashPassword} from '@/lib/auth/session';
import {changeShortcutAccess} from '@/lib/shortcut/access';
import {finishAccountDeletion} from '@/lib/auth/delete-account';
import {aiUsage} from '@/lib/ai/quota';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){const user=await getPocketUser();if(!user)return json({error:'Sign in first.'},401);if(user.role!=='owner')return json({error:'Owner access required.'},403);try{const {value}=await directorySnapshot();return json({members:value.members.map(m=>({id:m.id,email:m.email,role:m.role,status:m.status,createdAt:m.createdAt,joinedAt:m.joinedAt,registered:!!m.joinedAt,hasPassword:m.role==='owner'||!!m.passwordHash})),aiEnabled:value.aiEnabled,globalDailyAiLimit:value.globalDailyAiLimit,userDailyAiLimit:value.userDailyAiLimit,usage:await aiUsage(user.userId)});}catch{return json({error:'Account dashboard is unavailable.'},503);}}
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('approve'),email:z.string().trim().email().max(254)}).strict(),
 z.object({action:z.literal('status'),id:z.string().max(100),status:z.enum(['approved','suspended'])}).strict(),
 z.object({action:z.literal('password'),id:z.string().max(100)}).strict(),
 z.object({action:z.literal('cleanup'),id:z.string().max(100)}).strict(),
 z.object({action:z.literal('ai'),enabled:z.boolean(),globalLimit:z.number().int().min(1).max(2000),userLimit:z.number().int().min(1).max(200)}).strict()
]);
export async function POST(req:Request){const user=await getPocketUser();if(!user)return json({error:'Sign in first.'},401);if(user.role!=='owner')return json({error:'Owner access required.'},403);if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);try{
 const text=await req.text();if(text.length>4096)return json({error:'Request too large.'},413);const body=schema.parse(JSON.parse(text));
 if(body.action==='approve'){
  const password=generatedPassword(),passwordHash=hashPassword(password);let issued=false;
  const data=await changeDirectory(d=>{issued=false;const m=approveMember(d,body.email);if(m.role!=='owner'&&!m.passwordHash){m.passwordHash=passwordHash;issued=true;}});
  const member=data.members.find(m=>m.email===normalizeEmail(body.email))!;
  return json({ok:true,member:member.id,...(issued?{credentials:{email:member.email,password}}:{}),message:issued?'Account ready. Copy the password now and share it privately. It will not be shown again.':'Email approved. Its existing password is unchanged.'});
 }
 if(body.action==='cleanup'){await finishAccountDeletion(body.id);return json({ok:true,message:'Account deletion and recovery-copy cleanup completed.'});}
 if(body.action==='status'){await changeDirectory(d=>changeMemberStatus(d,body.id,body.status));return json({ok:true});}
 if(body.action==='ai'){await changeDirectory(d=>{d.aiEnabled=body.enabled;d.globalDailyAiLimit=body.globalLimit;d.userDailyAiLimit=body.userLimit;});return json({ok:true});}
 const password=generatedPassword(),passwordHash=hashPassword(password);
 const data=await changeDirectory(d=>{const m=d.members.find(m=>m.id===body.id);if(!m||m.role==='owner'||m.status!=='approved')throw Error('Choose an approved tester account.');m.passwordHash=passwordHash;});
 await changeShortcutAccess(body.id,false);
 const member=data.members.find(m=>m.id===body.id)!;
 return json({credentials:{email:member.email,password},message:'New password generated. Previous browser sessions and shortcut access are revoked. Copy it now; it will not be shown again.'});
 }catch(error){return json({error:error instanceof z.ZodError||error instanceof SyntaxError?'Check the email or settings.':error instanceof Error?error.message:'Could not update beta access.'},400);}}
