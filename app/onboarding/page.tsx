import {redirect} from 'next/navigation';
import {getPocketUser} from '@/lib/auth/server';
import {load} from '@/lib/pocket/store';
import Setup from './setup';
export const dynamic='force-dynamic';
export default async function Onboarding(){const user=await getPocketUser();if(!user)redirect('/login');const data=await load(user.userId);if(data.settings.onboarded!==false)redirect('/');return <Setup data={data} email={user.email}/>;}
