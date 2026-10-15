import {redirect} from 'next/navigation';
import {getPocketUser} from '@/lib/auth/server';
import AdminDashboard from './dashboard';
export const dynamic='force-dynamic';
export default async function AdminPage(){const user=await getPocketUser();if(!user)redirect('/login');if(user.role!=='owner')redirect('/');return <AdminDashboard/>;}
