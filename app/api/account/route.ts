import {getPocketUser,sameOrigin} from '@/lib/auth/server';
import {changeDirectory,activeMember} from '@/lib/auth/directory';
import {load,recoveryStatus,restorePrevious} from '@/lib/pocket/store';
import {finishAccountDeletion} from '@/lib/auth/delete-account';
import {z} from 'zod';
import {aiUsage} from '@/lib/ai/quota';
export const runtime='nodejs';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){const user=await getPocketUser();if(!user)return json({error:'Sign in first.'},401);try{return json({user,usage:await aiUsage(user.userId),recovery:await recoveryStatus(user.userId)});}catch{return json({error:'Could not load account details.'},503);}}
export async function DELETE(req:Request){const user=await getPocketUser();if(!user)return json({error:'Sign in first.'},401);if(!sameOrigin(req))return json({error:'Invalid origin.'},403);if(user.role==='owner')return json({error:'Owner deletion is unavailable during beta. Export your data and contact support.'},403);try{const body=await req.json();if(body.confirmEmail!==user.email)return json({error:'Type your email to confirm deletion.'},400);const member=await activeMember(user.userId);if(!member)return json({error:'Account is already disabled.'},409);await changeDirectory(d=>{const m=d.members.find(m=>m.id===user.userId)!;m.status='deleting';});await finishAccountDeletion(user.userId);return json({ok:true});}catch{return json({error:'Deletion did not finish. Access has been disabled; ask the owner to finish cleanup.'},503);}}

export async function POST(req:Request){const user=await getPocketUser();if(!user)return json({error:'Sign in first.'},401);if(!sameOrigin(req))return json({error:'Invalid origin.'},403);try{const body=z.object({action:z.literal('restore'),version:z.number().int().min(0),backupVersion:z.number().int().min(0),confirmEmail:z.string()}).strict().parse(await req.json());if(body.confirmEmail!==user.email)return json({error:'Type your email to confirm recovery.'},400);if(!await restorePrevious(user.userId,body.version,body.backupVersion))return json({error:'Your ledger changed. Reload and review the recovery copy.'},409);return json({ok:true,data:await load(user.userId)});}catch{return json({error:'Recovery did not finish. Reload and try again.'},400);}}
