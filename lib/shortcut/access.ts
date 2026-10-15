import 'server-only';
import {createHash} from 'node:crypto';
import {readJson,createJson,replaceJson,storagePrefix} from '../pocket/blob-storage';
import {newShortcutToken,tokenDigest,matchesToken} from './token';
import {sameOrigin} from '../auth/server';
import {activeMember} from '../auth/directory';
type Access={digest:string|null;updatedAt:string};
const path=(owner:string)=>owner==='personal'?`${storagePrefix()}/security/shortcut-personal.json`:`${storagePrefix()}/security/shortcut-${createHash('sha256').update(owner).digest('hex')}.json`;
const indexPath=(digest:string)=>`${storagePrefix()}/security/shortcut-tokens/${digest}.json`;
export async function shortcutStatus(owner:string){const access=await readJson<Access>(path(owner));return {enabled:!!access?.value.digest,updatedAt:access?.value.updatedAt??null};}
export async function changeShortcutAccess(owner:string,enable:boolean){const token=enable?newShortcutToken():null,digest=token?tokenDigest(token):null;if(digest)await createJson(indexPath(digest),{owner});for(let i=0;i<5;i++){const current=await readJson<Access>(path(owner))??await createJson<Access>(path(owner),{digest:null,updatedAt:new Date().toISOString()});if(await replaceJson(path(owner),{digest,updatedAt:new Date().toISOString()},current.etag))return token;}throw Error('Access changed concurrently. Please try again.');}
export async function shortcutUser(req:Request){
 if(req.headers.has('origin')&&!sameOrigin(req))return null;
 const authorization=req.headers.get('authorization')??'';if(!authorization.startsWith('Bearer '))return null;const token=authorization.slice(7);if(!/^pkt_[A-Za-z0-9_-]{43}$/.test(token))return null;
 const digest=tokenDigest(token),indexed=await readJson<{owner:string}>(indexPath(digest));let owner=indexed?.value.owner;
 // Preserve the owner's pre-beta token without copying it to another account.
 if(!owner){const legacy=await readJson<Access>(path('personal'));if(!legacy?.value.digest||!matchesToken(token,legacy.value.digest))return null;owner='personal';}
 const access=await readJson<Access>(path(owner));if(!access?.value.digest||!matchesToken(token,access.value.digest))return null;
 const member=await activeMember(owner);return member?{userId:member.id,role:member.role,email:member.email}:null;
}
