import {z} from 'zod';
import {getPocketUser,sameOrigin} from '@/lib/auth/server';
import {shortcutStatus,changeShortcutAccess} from '@/lib/shortcut/access';
export const runtime='nodejs';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){const user=await getPocketUser();if(!user)return json({error:'Unlock Pocket first.'},401);try{return json(await shortcutStatus(user.userId));}catch{return json({error:'Could not read shortcut access.'},503);}}
export async function POST(req:Request){const user=await getPocketUser();if(!user)return json({error:'Unlock Pocket first.'},401);if(!sameOrigin(req))return json({error:'Invalid request origin.'},403);try{const {action}=z.object({action:z.enum(['rotate','revoke'])}).strict().parse(await req.json());const token=await changeShortcutAccess(user.userId,action==='rotate');return json({enabled:!!token,token});}catch{return json({error:'Could not update shortcut access. Please retry.'},400);}}
