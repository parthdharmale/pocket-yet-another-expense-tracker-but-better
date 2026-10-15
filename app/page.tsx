import {redirect} from 'next/navigation';
import {getPocketUser} from '@/lib/auth/server';
import {load} from '@/lib/pocket/store';
import Pocket from './pocket';
export const dynamic='force-dynamic';
export default async function Home(){const user=await getPocketUser();if(!user)redirect('/login');const data=await load(user.userId);if(data.settings.onboarded===false)redirect('/onboarding');return <Pocket key={user.userId} initialData={data} owner={user.role==='owner'}/>;}
