/* eslint-disable @typescript-eslint/no-explicit-any -- isolated route handler loader. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import ts from 'typescript';
import {createDemoLedger} from '../lib/pocket/demo-data.ts';
test('entry API rejects future creates, edits and refunds before any persistence',async()=>{
 const root=resolve(import.meta.dirname,'..'),native=createRequire(import.meta.url),modules=new Map<string,{exports:any}>(),data=createDemoLedger();let writes=0;
 const load=(name:string,parent=root):any=>{if(!name.startsWith('.')&&!name.startsWith('@/')&&!name.startsWith(root))return native(name);let file=name.startsWith('@/')?resolve(root,name.slice(2)):resolve(parent,name);if(!existsSync(file))file+='.ts';if(file===resolve(root,'lib/auth/server.ts'))return {getPocketUser:async()=>({userId:'test',role:'member'}),sameOrigin:()=>true};if(file===resolve(root,'lib/pocket/store.ts'))return {load:async()=>structuredClone(data),persist:async()=>{writes++;return true;}};if(modules.has(file))return modules.get(file)!.exports;const mod={exports:{}};modules.set(file,mod);const compiled=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('require','module','exports',compiled)((n:string)=>load(n,dirname(file)),mod,mod.exports);return mod.exports;};
 const route=load('./app/api/pocket/route.ts');
 const send=(entry:any)=>route.POST(new Request('https://pocket.test/api/pocket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:data.version,collection:'entries',value:entry})}));
 const base={...data.entries[0],refunds:[]};
 for(const kind of ['spend','resisted'])for(const id of [base.id,'new-entry']){const r=await send({...base,id,kind,date:'9999-01-01'});assert.equal(r.status,400);assert.match((await r.json()).error,/after today/);}
 const r=await send({...base,refunds:[{id:'future-refund',date:'9999-01-01',amount:1}]});assert.equal(r.status,400);assert.match((await r.json()).error,/Refund date/);assert.equal(writes,0);
 assert.equal((await send({...base,id:'past',date:'2020-01-01'})).status,200);assert.equal(writes,1);
});
