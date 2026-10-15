import 'server-only';
import {createHmac} from 'node:crypto';
import {readJson,createJson,replaceJson,storagePrefix} from '../pocket/blob-storage';
import {applyVisit,emptyTraffic,trafficReport,type TrafficState,type Visit} from './traffic';
const path=()=>`${storagePrefix()}/analytics/traffic.json`;
export function anonymousHash(value:string){const secret=process.env.POCKET_SESSION_SECRET;if(!secret||secret.length<32)throw Error('Analytics is not configured.');return createHmac('sha256',secret).update('pocket-traffic:'+value).digest('hex').slice(0,32)}
const limits=new Map<string,{count:number;until:number}>(),seen=new Map<string,number>();
let globalWindow={count:0,until:0};
export function admitVisit(ip:string,key:string,now=Date.now()){
 if((seen.get(key)??0)>now)return false;
 if(globalWindow.until<=now)globalWindow={count:0,until:now+60000};
 if(globalWindow.count>=100)return false;globalWindow.count++;
 if(limits.size>=2000)for(const [k,v] of limits)if(v.until<=now)limits.delete(k);
 if(limits.size>=2000&&!limits.has(ip))return false;
 const limit=limits.get(ip);const next=!limit||limit.until<=now?{count:0,until:now+60000}:limit;
 if(next.count>=10)return false;next.count++;limits.set(ip,next);return true;
}
export function rememberVisit(key:string){if(seen.size>=4000)seen.delete(seen.keys().next().value!);seen.set(key,Date.now()+30*60000)}
export async function recordVisit(visit:Visit){
 for(let attempt=0;attempt<4;attempt++){
  const current=await readJson<TrafficState>(path())??await createJson(path(),emptyTraffic());
  const next=applyVisit(current.value,visit);if(!next)return;
  if(await replaceJson(path(),next,current.etag))return;
 }
 throw Error('Analytics is busy.');
}
export async function readTraffic(){const current=await readJson<TrafficState>(path());return trafficReport(current?.value??emptyTraffic())}
