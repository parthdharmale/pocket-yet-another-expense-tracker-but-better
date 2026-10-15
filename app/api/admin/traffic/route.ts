import {getPocketUser} from '@/lib/auth/server';
import {readTraffic} from '@/lib/analytics/store';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){const user=await getPocketUser();if(!user)return json({error:'Sign in first.'},401);if(user.role!=='owner')return json({error:'Owner access required.'},403);try{return json(await readTraffic())}catch{return json({error:'Visitor counts are temporarily unavailable.'},503)}}
