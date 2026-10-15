import {readJson,createJson,replaceJson,storagePrefix} from '../pocket/blob-storage';
import {directorySnapshot} from '../auth/directory';
import {reserveUsage,type Usage} from './budget';
const path=()=>`${storagePrefix()}/security/ai-usage.json`;
export async function takeAiRequest(owner:string){
 const date=new Date().toISOString().slice(0,10);const {value:policy}=await directorySnapshot();if(!policy.aiEnabled||!policy.members.some(m=>m.id===owner&&m.status==='approved'))return false;
 for(let attempt=0;attempt<5;attempt++){
  const current=await readJson<Usage>(path())??await createJson<Usage>(path(),{date,total:0,users:{}});
  const next=reserveUsage(current.value,date,owner,owner==='personal'?Math.max(100,policy.userDailyAiLimit):policy.userDailyAiLimit,policy.globalDailyAiLimit);if(!next)return false;
  if(await replaceJson(path(),next,current.etag))return true;
 }
 return false;
}
export async function aiUsage(owner:string){const {value:policy}=await directorySnapshot();const date=new Date().toISOString().slice(0,10),snapshot=await readJson<Usage>(path()),usage=snapshot?.value.date===date?snapshot.value:null;return {used:usage?.users[owner]??0,total:usage?.total??0,limit:owner==='personal'?Math.max(100,policy.userDailyAiLimit):policy.userDailyAiLimit,globalLimit:policy.globalDailyAiLimit,enabled:policy.aiEnabled};}

export async function removeUserUsage(owner:string){for(let i=0;i<5;i++){const current=await readJson<Usage>(path());if(!current||!Object.hasOwn(current.value.users,owner))return;const next=structuredClone(current.value);delete next.users[owner];if(await replaceJson(path(),next,current.etag))return;}throw Error('Usage cleanup did not finish.');}
