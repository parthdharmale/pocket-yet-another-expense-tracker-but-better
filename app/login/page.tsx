import {redirect} from 'next/navigation';
import {getPocketUser} from '@/lib/auth/server';
import LoginForm from './password-form';
export const dynamic='force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{owner?:string}>}){if(await getPocketUser())redirect('/');return <LoginForm ownerAccess={(await searchParams).owner==='1'}/>;}
