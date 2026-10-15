import 'server-only';
import {readJson,createJson,replaceJson,storagePrefix} from '../pocket/blob-storage';
import {initialDirectory,type Directory} from './members';
const path=()=>`${storagePrefix()}/security/members.json`;
export async function directorySnapshot(){const existing=await readJson<Directory>(path());if(existing)return existing;const email=process.env.POCKET_OWNER_EMAIL;if(!email)throw Error('Set POCKET_OWNER_EMAIL before enabling beta accounts.');return createJson(path(),initialDirectory(email));}
export async function changeDirectory(update:(directory:Directory)=>void){for(let i=0;i<5;i++){const current=await directorySnapshot(),next=structuredClone(current.value);update(next);next.version++;if(await replaceJson(path(),next,current.etag))return next;}throw Error('Accounts changed concurrently. Please retry.');}
export async function activeMember(id:string){const {value}=await directorySnapshot();return value.members.find(m=>m.id===id&&m.status==='approved')??null;}
