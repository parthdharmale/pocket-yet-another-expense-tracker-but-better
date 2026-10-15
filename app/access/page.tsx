import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getPocketUser} from '@/lib/auth/server';
export default async function AccessPage(){if(await getPocketUser())redirect('/');return <div id="pocket"><main className="beta-auth"><h1>This Pocket is invite-only.</h1><p>Your access may be suspended or your password may have changed. Ask the owner for access, then sign in with your email and generated password.</p><Link className="button primary" href="/login">Back to sign in</Link></main></div>;}
