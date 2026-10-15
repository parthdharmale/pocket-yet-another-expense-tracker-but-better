'use client';
import Link from 'next/link';
import {ShieldCheck,Smartphone,UserRound,FileChartColumn} from 'lucide-react';
export default function AccountNavigation({owner}:{owner:boolean}){return <><Link className="nav-btn" href="/shortcut"><Smartphone/>Create shortcut</Link><Link className="nav-btn" href="/account"><UserRound/>My account</Link>{owner&&<><Link className="nav-btn" href="/statements"><FileChartColumn/>Spend analysis</Link><Link className="nav-btn" href="/admin"><ShieldCheck/>Beta dashboard</Link></>}</>;}
