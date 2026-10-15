import 'server-only';
import {readJson,createJson,replaceJson,storagePrefix} from '../pocket/blob-storage';
import {emptyData} from './model';
import type {StatementData} from './types';
const path=()=>`${storagePrefix()}/statements/personal.json`;
export async function statementSnapshot(){return await readJson<StatementData>(path())??{value:emptyData(),etag:''};}
export async function changeStatements(version:number,change:(data:StatementData)=>void){
 const current=await readJson<StatementData>(path())??await createJson(path(),emptyData());
 if(current.value.version!==version)throw Error('This workspace changed in another window. Refresh and try again.');
 const data=structuredClone(current.value);change(data);data.version++;
 if(!await replaceJson(path(),data,current.etag))throw Error('This workspace changed in another window. Refresh and try again.');return data;
}
