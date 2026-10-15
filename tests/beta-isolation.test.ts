/* eslint-disable @typescript-eslint/no-explicit-any -- dynamically loaded route modules use a CommonJS test harness. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname,resolve} from 'node:path';
import ts from 'typescript';

// Run actual route handlers, membership, ledger and token code against isolated
// identity/storage fixtures. No test identity or auth bypass enters the app.
test('routes isolate two accounts, reject unauthorized access and revoke tokens independently',async()=>{
 const root=resolve(import.meta.dirname,'..'),nativeRequire=createRequire(import.meta.url);
 const files=new Map<string,{value:unknown;etag:string}>(),modules=new Map<string,{exports:any}>();
 let revision=0,cookieToken:string|undefined;
 const storage={storagePrefix:()=> 'test-only',readJson:async(path:string)=>structuredClone(files.get(path)??null),
  createJson:async(path:string,value:unknown)=>{if(!files.has(path))files.set(path,{value:structuredClone(value),etag:String(++revision)});return structuredClone(files.get(path));},
  replaceJson:async(path:string,value:unknown,etag:string)=>{if(files.get(path)?.etag!==etag)return false;files.set(path,{value:structuredClone(value),etag:String(++revision)});return true;}};
 const load=(name:string,parent=root):any=>{
  if(name==='server-only')return {};
  if(name==='next/headers')return {cookies:async()=>({get:()=>cookieToken?{value:cookieToken}:undefined})};
  if(!name.startsWith('.')&&!name.startsWith('@/')&&!name.startsWith(root))return nativeRequire(name);
  let file=name.startsWith('@/')?resolve(root,name.slice(2)):resolve(parent,name);
  if(!existsSync(file))file+='.ts';
  if(file===resolve(root,'lib/pocket/blob-storage.ts'))return storage;
  if(modules.has(file))return modules.get(file)!.exports;
  const loadedModule={exports:{}};modules.set(file,loadedModule);
  const compiled=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  new Function('require','module','exports',compiled)((dependency:string)=>load(dependency,dirname(file)),loadedModule,loadedModule.exports);
  return loadedModule.exports;
 };
 const before={...process.env};process.env.POCKET_OWNER_EMAIL='owner@example.com';process.env.POCKET_SESSION_SECRET='fixture-secret-that-is-longer-than-32-characters';
 try{
  const session=load('./lib/auth/session.ts');process.env.POCKET_PASSWORD_HASH=session.hashPassword('fixture-owner-password');
  const directory=load('./lib/auth/directory.ts'),members=load('./lib/auth/members.ts');
  const ledger=load('./app/api/pocket/route.ts'),admin=load('./app/api/admin/members/route.ts'),traffic=load('./app/api/admin/traffic/route.ts'),visit=load('./app/api/analytics/visit/route.ts');
  const tokens=load('./app/api/shortcut/token/route.ts'),access=load('./lib/shortcut/access.ts'),undo=load('./app/api/shortcut/undo/route.ts');
  const store=load('./lib/pocket/store.ts'),tokenTools=load('./lib/shortcut/token.ts'),account=load('./app/api/account/route.ts');
  const signIn=(email:string)=>{const d=files.get('test-only/security/members.json')?.value as any;const m=d?.members.find((m:any)=>m.email===email);cookieToken=session.createSession(process.env.POCKET_SESSION_SECRET,m?.id==='personal'?process.env.POCKET_PASSWORD_HASH:m?.passwordHash??session.hashPassword('unknown'),Date.now(),m?.id??'unknown');};
  const request=(path:string,body:unknown,bearer?:string)=>new Request(`https://pocket.test${path}`,{method:'POST',headers:bearer?{Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'}:{Host:'pocket.test',Origin:'https://pocket.test','Content-Type':'application/json'},body:JSON.stringify(body)});
  signIn('unknown@example.com');assert.equal((await ledger.GET()).status,401);assert.equal((await traffic.GET()).status,401);
  await directory.changeDirectory((d:any)=>{members.approveMember(d,'a@example.com').passwordHash=session.hashPassword('fixture-a-password');members.approveMember(d,'b@example.com').passwordHash=session.hashPassword('fixture-b-password');});
  const login=load('./app/api/auth/login/route.ts');cookieToken=undefined;
  assert.equal((await login.POST(request('/api/auth/login',{email:'unknown@example.com',password:'fixture-owner-password'}))).status,401);
  assert.equal((await login.POST(request('/api/auth/login',{email:'a@example.com',password:'fixture-b-password'}))).status,401);
  const loggedIn=await login.POST(request('/api/auth/login',{email:'a@example.com',password:'fixture-a-password'}));assert.equal(loggedIn.status,200);assert.match(loggedIn.headers.get('set-cookie'),/HttpOnly/i);cookieToken=loggedIn.cookies.get('pocket_session').value;assert.equal((await ledger.GET()).status,200);
  signIn('a@example.com');const a=await (await ledger.GET()).json();assert.equal(a.cards.length,0);assert.equal(a.entries.length,0);
  assert.equal((await traffic.GET()).status,403);assert.equal((await admin.GET()).status,403);assert.equal((await admin.POST(request('/api/admin/members',{action:'approve',email:'intruder@example.com'}))).status,403);
  const entry={id:'same-entry',date:'2026-10-09',title:'Only A can see this',amount:10000,share:10000,platformId:'swiggy-food',paymentId:'UPI',kind:'spend',category:'Food delivery',note:'',refunds:[],settled:false,credited:null,reward:null,billingDay:null,createdAt:new Date().toISOString(),deleted:false};
  const saved=await ledger.POST(request('/api/pocket',{version:a.version,collection:'entries',value:entry,owner:'personal'}));assert.equal(saved.status,200);
  const tokenA=(await (await tokens.POST(request('/api/shortcut/token',{action:'rotate'}))).json()).token;assert.ok(tokenA);
  const memberA=await access.shortcutUser(request('/api/shortcut/entry',{},tokenA));assert.ok(memberA);assert.notEqual(memberA.userId,'personal');
  signIn('b@example.com');const b=await (await ledger.GET()).json();assert.equal(b.entries.length,0);assert.equal(b.cards.length,0);
  const tokenB=(await (await tokens.POST(request('/api/shortcut/token',{action:'rotate'}))).json()).token;
  const memberB=await access.shortcutUser(request('/api/shortcut/entry',{},tokenB));assert.notEqual(memberA.userId,memberB.userId);
  const shortcutEntry={...entry,id:tokenTools.shortcutEntryId('same-request',memberA.userId),source:'shortcut'};
  const current=await store.load(memberA.userId);assert.equal(await store.persist(memberA.userId,current.version,[{collection:'entries',value:shortcutEntry}]),true);
  assert.equal((await undo.POST(request('/api/shortcut/undo',{entryId:shortcutEntry.id},tokenB))).status,404);
  assert.equal((await undo.POST(request('/api/shortcut/undo',{entryId:shortcutEntry.id},tokenA))).status,200);
  const afterUndo=await store.load(memberA.userId),backup=await store.recoveryStatus(memberA.userId);assert.ok(backup);assert.equal(await store.restorePrevious(memberA.userId,afterUndo.version-1,backup.version),false);assert.equal(await store.restorePrevious(memberA.userId,afterUndo.version,backup.version),true);assert.equal((await store.load(memberA.userId)).entries.find((e:any)=>e.id===shortcutEntry.id).deleted,false);assert.equal((await store.load(memberB.userId)).entries.length,0);
  // Cookie subject changes cannot redirect a signed session into another ledger.
  const originalToken=cookieToken!,parts=originalToken.split('.');parts[0]=Buffer.from(JSON.stringify({sub:memberA.userId,exp:Math.floor(Date.now()/1000)+1000})).toString('base64url');cookieToken=parts.join('.');assert.equal((await ledger.GET()).status,401);cookieToken=originalToken;

  await tokens.POST(request('/api/shortcut/token',{action:'rotate'}));assert.equal(await access.shortcutUser(request('/api/shortcut/entry',{},tokenB)),null);assert.ok(await access.shortcutUser(request('/api/shortcut/entry',{},tokenA)));
  await directory.changeDirectory((d:any)=>members.changeMemberStatus(d,memberA.userId,'suspended'));
  signIn('a@example.com');assert.equal((await ledger.GET()).status,401);assert.equal(await access.shortcutUser(request('/api/shortcut/entry',{},tokenA)),null);
  await directory.changeDirectory((d:any)=>members.changeMemberStatus(d,memberA.userId,'approved'));assert.equal((await ledger.GET()).status,200);
  // Anonymous analytics must never reveal stored identities or count owner traffic.
  const visitorBody={visitor:'11111111-1111-4111-8111-111111111111',session:'22222222-2222-4222-8222-222222222222',page:'demo'};
  cookieToken=undefined;assert.equal((await visit.POST(request('/api/analytics/visit',visitorBody))).status,204);
  assert.equal((await visit.POST(request('/api/analytics/visit',visitorBody))).status,204);
  assert.equal((await visit.POST(request('/api/analytics/visit',{...visitorBody,email:'private@example.com'}))).status,400);
  const oversized=new Request('https://pocket.test/api/analytics/visit',{method:'POST',headers:{Host:'pocket.test',Origin:'https://pocket.test','Content-Type':'application/json'},body:' '.repeat(10000)});assert.equal((await visit.POST(oversized)).status,413);
  const privateBrowser=new Request('https://pocket.test/api/analytics/visit',{method:'POST',headers:{Host:'pocket.test',Origin:'https://pocket.test','Content-Type':'application/json',DNT:'1'},body:JSON.stringify({...visitorBody,session:'44444444-4444-4444-8444-444444444444'})});assert.equal((await visit.POST(privateBrowser)).status,204);
  const foreign=new Request('https://pocket.test/api/analytics/visit',{method:'POST',headers:{Host:'pocket.test',Origin:'https://evil.test','Content-Type':'application/json'},body:JSON.stringify(visitorBody)});assert.equal((await visit.POST(foreign)).status,403);
  signIn('owner@example.com');assert.equal((await visit.POST(request('/api/analytics/visit',{...visitorBody,session:'33333333-3333-4333-8333-333333333333'}))).status,204);
  const trafficData=await (await traffic.GET()).json();assert.equal(trafficData.today.visitors,1);assert.equal(trafficData.today.visits,1);assert.equal(trafficData.today.demoVisitors,1);assert.ok(!JSON.stringify(trafficData).includes(visitorBody.visitor));
  const stored=JSON.stringify(files.get('test-only/analytics/traffic.json')?.value);assert.ok(!stored.includes(visitorBody.visitor)&&!stored.includes(visitorBody.session)&&!stored.includes('example.com'));
  const analyticsStore=load('./lib/analytics/store.ts');assert.equal(analyticsStore.admitVisit('rate-ip','key',100),true);for(let i=0;i<9;i++)assert.equal(analyticsStore.admitVisit('rate-ip','key-'+i,100),true);assert.equal(analyticsStore.admitVisit('rate-ip','excess',100),false);
  signIn('owner@example.com');const adminData=await (await admin.GET()).json();assert.equal(JSON.stringify(adminData).includes('scrypt:'),false);
  const reset=await admin.POST(request('/api/admin/members',{action:'password',id:memberA.userId}));assert.equal(reset.status,200);const credentials=(await reset.json()).credentials;assert.equal(credentials.password.length,32);assert.ok(session.verifyPassword(credentials.password,(await directory.directorySnapshot()).value.members.find((m:any)=>m.id===memberA.userId).passwordHash));
  cookieToken=loggedIn.cookies.get('pocket_session').value;assert.equal((await ledger.GET()).status,401);assert.equal(await access.shortcutUser(request('/api/shortcut/entry',{},tokenA)),null);
  signIn('owner@example.com');const owner=await (await ledger.GET()).json();assert.equal(owner.cards.length,0);assert.equal(owner.entries.length,0);assert.equal((await admin.GET()).status,200);
  // An old owner token, with no new per-user index, remains valid.
  const legacyToken=tokenTools.newShortcutToken();await storage.createJson('test-only/security/shortcut-personal.json',{digest:tokenTools.tokenDigest(legacyToken),updatedAt:new Date().toISOString()});assert.equal((await access.shortcutUser(request('/api/shortcut/entry',{},legacyToken)))?.userId,'personal');
  signIn('a@example.com');const deletion=new Request('https://pocket.test/api/account',{method:'DELETE',headers:{Host:'pocket.test',Origin:'https://pocket.test','Content-Type':'application/json'},body:JSON.stringify({confirmEmail:'a@example.com'})});assert.equal((await account.DELETE(deletion)).status,200);assert.equal((await ledger.GET()).status,401);await assert.rejects(()=>store.load(memberA.userId),/deleted/);assert.equal(await store.recoveryStatus(memberA.userId),null);assert.equal((await store.load(memberB.userId)).entries.length,0);
  // Deletion before first ledger load cannot later resurrect an empty account.
  await store.eraseLedger('never-loaded');await assert.rejects(()=>store.load('never-loaded'),/deleted/);
 }finally{for(const key of Object.keys(process.env))if(!(key in before))delete process.env[key];Object.assign(process.env,before);}
});
