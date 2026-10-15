import {redirect} from 'next/navigation';
import {getPocketUser} from '@/lib/auth/server';
import {statementSnapshot} from '@/lib/statements/store';
import StatementDashboard from './statement-dashboard';
import './statements.css';
import {load} from '@/lib/pocket/store';
import {today} from '@/lib/pocket/engine';
export const metadata={title:'Spend analysis — Pocket'};
export const dynamic='force-dynamic';
export default async function StatementsPage(){const user=await getPocketUser();if(!user)redirect('/login');if(user.role!=='owner')redirect('/');const [{value},ledger]=await Promise.all([statementSnapshot(),load(user.userId)]);return <StatementDashboard initial={value} cards={ledger.cards} platforms={ledger.platforms} today={today(ledger.settings.timezone)}/>;}
