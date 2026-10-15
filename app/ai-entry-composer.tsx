'use client';
import {useState,useRef,useEffect} from 'react';
import {Sparkles} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {ExtractedEntry} from '@/lib/ai/entry';
export function AIEntryComposer({date,disabled,onDraft,onSave,onBusyChange}:{date:string;disabled:boolean;onDraft:(draft:ExtractedEntry)=>void;onSave:(draft:ExtractedEntry)=>Promise<void>;onBusyChange:(busy:boolean)=>void}){
 const [description,setDescription]=useState(''),[automatic,setAutomatic]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const controller=useRef<AbortController|null>(null);useEffect(()=>()=>controller.current?.abort(),[]);
 async function extract(){controller.current=new AbortController();setBusy(true);onBusyChange(true);setMessage('');try{
  const response=await fetch('/api/ai/entry',{signal:controller.current.signal,method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description,selectedDate:date})});
  const result=await response.json();if(!response.ok)throw Error(result.error??'Could not read your description.');
  if(controller.current.signal.aborted)return;onDraft(result.draft);
  if(result.complete&&automatic){await onSave(result.draft);}
  else setMessage(result.complete?'Filled in below. Review and save when ready.':result.questions.join(' ')||'Please review the details below before saving.');
 }catch(error){if(!controller.current?.signal.aborted)setMessage((error as Error).message);}finally{setBusy(false);onBusyChange(false);}}
 return <section className="ai-entry"><div className="ai-entry-heading"><Sparkles size={17}/><strong>Just say what happened.</strong><span>AI quick entry</span></div><label htmlFor="purchase-description" className="sr-only">Describe your purchase</label><textarea id="purchase-description" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ordered biryani on Swiggy for ₹450, paid with my Swiggy HDFC card" maxLength={2000} rows={3} disabled={busy||disabled}/><div className="ai-entry-actions"><label><input type="checkbox" checked={automatic} onChange={e=>setAutomatic(e.target.checked)} disabled={busy||disabled}/> Add automatically when complete</label><Button type="button" disabled={busy||disabled||description.trim().length<3} onClick={extract}>{busy?'Reading your note…':automatic?'Fill & add':'Fill form'}</Button></div><p className="ai-entry-privacy">Only this description and your platform/payment names go to OpenAI. Missing details stay for you to fill.</p>{message&&<p role="status" className="ai-entry-message">{message}</p>}</section>
}
