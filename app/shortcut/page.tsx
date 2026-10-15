import {publicAppUrl} from '@/lib/config';
import {redirect} from 'next/navigation';
import {getPocketUser} from '@/lib/auth/server';
import {load} from '@/lib/pocket/store';
import ShortcutGuide from './guide';
export const dynamic='force-dynamic';
export default async function ShortcutPage(){const user=await getPocketUser();if(!user)redirect('/login');const data=await load(user.userId);const base=publicAppUrl();return <ShortcutGuide owner={user.role==='owner'} base={base} email={user.email} payments={[...data.cards.filter(c=>c.active).map(c=>c.name),...data.settings.paymentModes]} platforms={data.platforms.filter(p=>p.active).map(p=>p.name)}/>;}
