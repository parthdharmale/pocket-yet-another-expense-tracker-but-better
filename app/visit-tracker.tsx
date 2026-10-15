'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
const idle=30*60*1000,visitorLife=90*24*60*60*1000;
export default function VisitTracker(){const pathname=usePathname();useEffect(()=>{
 if(!['/','/login','/demo'].includes(pathname)||navigator.doNotTrack==='1'||(navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl)return;
 try{
  const now=Date.now();let visitor=JSON.parse(localStorage.getItem('pocket-visitor')??'null') as {id:string;expires:number}|null;
  if(!visitor||visitor.expires<now||typeof visitor.id!=='string'){visitor={id:crypto.randomUUID(),expires:now+visitorLife};localStorage.setItem('pocket-visitor',JSON.stringify(visitor))}
  let session=JSON.parse(localStorage.getItem('pocket-visit-session')??'null') as {id:string;last:number;site:boolean;demo:boolean}|null;
  if(!session||now-session.last>idle||typeof session.id!=='string')session={id:crypto.randomUUID(),last:now,site:false,demo:false};
  const page=pathname==='/demo'?'demo':'site',send=!session[page];session.last=now;
  if(send){session.site=true;if(page==='demo')session.demo=true;}
  localStorage.setItem('pocket-visit-session',JSON.stringify(session));
  if(send)void fetch('/api/analytics/visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor:visitor.id,session:session.id,page}),keepalive:true}).catch(()=>{});
 }catch{/* Blocked storage and privacy tools should not interfere with Pocket. */}
 },[pathname]);return null;}
