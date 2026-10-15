import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,readFileSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {publicAppUrl} from '../lib/config.ts';
import {initialLedger} from '../lib/pocket/initial.ts';
test('fresh owners and members contain no personal portfolio and keep configurable onboarding',()=>{
 for(const id of ['personal','member']){const d=initialLedger(id);assert.deepEqual(d.cards,[]);assert.deepEqual(d.entries,[]);assert.deepEqual(d.wishes,[]);assert.equal(d.settings.onboarded,false);}
});
test('shortcut origin is deployment-specific and rejects unsafe URL configuration',()=>{
 const before={...process.env};
 try{
  Object.assign(process.env,{NODE_ENV:'development'});delete process.env.POCKET_PUBLIC_URL;assert.equal(publicAppUrl(),'http://localhost:3000');
  process.env.POCKET_PUBLIC_URL='https://my-pocket.example.com';assert.equal(publicAppUrl(),'https://my-pocket.example.com');
  for(const value of ['https://user:password@example.com','https://example.com/path','https://example.com?key=x','https://example.com#fragment','ftp://example.com','http://remote.example.com']){process.env.POCKET_PUBLIC_URL=value;assert.throws(()=>publicAppUrl());}
  Object.assign(process.env,{NODE_ENV:'production'});delete process.env.POCKET_PUBLIC_URL;assert.throws(()=>publicAppUrl());process.env.POCKET_PUBLIC_URL='http://localhost:3000';assert.throws(()=>publicAppUrl());
 }finally{process.env=before;}
});
test('public template contains no credentials and documents independently configurable models',()=>{
 const text=readFileSync(new URL('../.env.example',import.meta.url),'utf8');
 for(const key of ['OPENAI_API_KEY','BLOB_READ_WRITE_TOKEN','POCKET_PASSWORD_HASH','POCKET_SESSION_SECRET'])assert.match(text,new RegExp('^'+key+'=$','m'));
 for(const key of ['OPENAI_ENTRY_MODEL','OPENAI_TRANSCRIPTION_MODEL','OPENAI_RESEARCH_MODEL','POCKET_PUBLIC_URL'])assert.match(text,new RegExp('^'+key+'=','m'));
});
test('publication scanner blocks staged credentials, exact local key copies, private tracked files and history',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pocket-public-check-')),scanner=resolve(import.meta.dirname,'../scripts/check-public.mjs');
 const scan=(...args:string[])=>spawnSync(process.execPath,[scanner,...args],{cwd:dir,encoding:'utf8'});
 const git=(...args:string[])=>execFileSync('git',args,{cwd:dir,stdio:'pipe'});
 try{
  writeFileSync(join(dir,'safe.ts'),'export const safe=true;');assert.equal(scan().status,0);
  const fake='sk-'+'x'.repeat(32);writeFileSync(join(dir,'bad.ts'),`export const key='${fake}';`);const denied=scan();assert.equal(denied.status,1);assert.equal(denied.stdout.includes(fake)||denied.stderr.includes(fake),false);rmSync(join(dir,'bad.ts'));
  writeFileSync(join(dir,'.env.local'),'OPENAI_API_KEY=synthetic-local-secret-value-only');writeFileSync(join(dir,'copied.ts'),'synthetic-local-secret-value-only');assert.equal(scan().status,1);rmSync(join(dir,'copied.ts'));
  git('init','-b','main');writeFileSync(join(dir,'.gitignore'),'.env*\n');git('config','user.email','test@example.com');git('config','user.name','Synthetic test');
  writeFileSync(join(dir,'staged.ts'),`export const key='${fake}';`);git('add','staged.ts');writeFileSync(join(dir,'staged.ts'),'export const safe=true;');assert.equal(scan().status,1);
  git('commit','-m','Synthetic secret-scanner fixture','--no-verify');git('add','staged.ts');git('commit','-m','Remove synthetic fixture','--no-verify');assert.equal(scan().status,0);assert.equal(scan('--history').status,1);
  git('add','--force','.env.local');assert.equal(scan().status,1);
  mkdirSync(join(dir,'outputs'));writeFileSync(join(dir,'outputs/private.txt'),'private fixture');git('add','outputs/private.txt');assert.equal(scan().status,1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
