import {NextResponse} from 'next/server';
import {sameOrigin} from '@/lib/auth/server';
import {COOKIE_NAME} from '@/lib/auth/session';
export async function POST(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});const response=NextResponse.json({ok:true});response.cookies.set(COOKIE_NAME,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});return response;}
