import {readJson,createJson,replaceJson,storagePrefix} from '../pocket/blob-storage';
type Attempts={startedAt:number;ips:Record<string,number>;total:number};
export async function takeLoginAttempt(key:string,now=Date.now(),accountKey?:string){
 const path=`${storagePrefix()}/security/login-attempts.json`;
 for(let retry=0;retry<5;retry++){
  const current=await readJson<Attempts>(path)??await createJson<Attempts>(path,{startedAt:now,ips:{},total:0});
  const next:Attempts=now-current.value.startedAt>=900000?{startedAt:now,ips:{},total:0}:structuredClone(current.value);
  if((next.ips[key]??0)>=10||(accountKey&&(next.ips[accountKey]??0)>=10)||next.total>=100)return false;
  next.ips[key]=(next.ips[key]??0)+1;if(accountKey)next.ips[accountKey]=(next.ips[accountKey]??0)+1;next.total++;
  if(await replaceJson(path,next,current.etag))return true;
 }
 return false;
}
