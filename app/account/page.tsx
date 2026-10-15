import {redirect} from 'next/navigation';
import {getPocketUser} from '@/lib/auth/server';
import {aiUsage} from '@/lib/ai/quota';
import {load,recoveryStatus} from '@/lib/pocket/store';
import AccountPanel from './panel';
export const dynamic='force-dynamic';
export default async function AccountPage(){const user=await getPocketUser();if(!user)redirect('/login');return <AccountPanel supportEmail={process.env.POCKET_OWNER_EMAIL??''} version={(await load(user.userId)).version} recovery={await recoveryStatus(user.userId)} email={user.email} owner={user.role==='owner'} usage={await aiUsage(user.userId)}/>;}
