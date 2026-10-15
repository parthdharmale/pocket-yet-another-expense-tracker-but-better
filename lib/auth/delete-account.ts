import 'server-only';
import {changeDirectory,directorySnapshot} from './directory';
import {eraseLedger} from '../pocket/store';
import {changeShortcutAccess} from '../shortcut/access';
import {removeUserUsage} from '../ai/quota';
export async function finishAccountDeletion(id:string){
 const {value}=await directorySnapshot(),member=value.members.find(m=>m.id===id);
 if(!member||member.role==='owner'||!['deleting','deleted'].includes(member.status))throw Error('No pending deletion for this account.');
 await changeShortcutAccess(id,false);await eraseLedger(id);await removeUserUsage(id);
 await changeDirectory(d=>{const m=d.members.find(m=>m.id===id)!;m.status='deleted';m.passwordHash=null;});
}
