import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,lstatSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {parseEnv} from 'node:util';
const privatePath=p=>/(^|\/)(?:\.env(?:\..+)?|\.pocket-[^/]+|\.vercel|\.openai|\.sites-runtime|\.agents|\.codex|outputs|work|backups|recordings|statements-private)(?:\/|$)/.test(p)&&p!=='.env.example';
const skipped=new Set(['.git','node_modules','.next','coverage','out','dist']);
let files,ownGit=false;
try{const top=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();if(resolve(top)===resolve('.')){ownGit=true;files=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{encoding:'utf8'}).split('\0').filter(Boolean);}}catch{}
function walk(dir=''){return readdirSync(dir||'.',{withFileTypes:true}).flatMap(e=>{const p=dir?`${dir}/${e.name}`:e.name;if(skipped.has(e.name)||privatePath(p))return [];return e.isDirectory()?walk(p):[p];});}
files??=walk();
const patterns=[[/\bsk-(?:proj-|svcacct-)?[a-zA-Z0-9_-]{24,}/,'OpenAI-like credential'],[/\bvercel_blob_rw_[a-zA-Z0-9_-]{20,}/,'Blob credential'],[/\b(?:ghp_|github_pat_)[a-zA-Z0-9_]{25,}/,'GitHub credential'],[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,'private key'],[/scrypt:[a-f0-9]{32}:[a-f0-9]{128}/,'password hash']];
const known=[];
for(const name of readdirSync('.').filter(n=>n.startsWith('.env')&&n!=='.env.example')){try{for(const [key,value] of Object.entries(parseEnv(readFileSync(name,'utf8'))))if(/KEY|TOKEN|SECRET|PASSWORD_HASH/.test(key)&&value.length>=16)known.push(value);}catch{}}
const failures=[];
for(const file of [...new Set(files)]){
 if(privatePath(file)||/\.(?:pdf|heic|m4a|wav|mp3|mp4|pem|key)$/i.test(file)){failures.push(`${file}: private file must not be tracked`);continue;}
 if(!existsSync(file)&&!ownGit)continue;
 if(existsSync(file)&&lstatSync(file).isSymbolicLink()){failures.push(`${file}: symlinks are not allowed in the public source`);continue;}
 let text=existsSync(file)?readFileSync(file,'utf8'):'';if(ownGit){try{text+='\n'+execFileSync('git',['show',`:${file}`],{encoding:'utf8',stdio:['ignore','pipe','ignore'],maxBuffer:16000000});}catch{/* Untracked file: working copy was already read. */}}for(const [pattern,reason] of patterns)if(pattern.test(text))failures.push(`${file}: ${reason}`);
 if(known.some(secret=>text.includes(secret)))failures.push(`${file}: matches a locally configured secret`);
 if(file==='.env.example'){for(const [key,value] of Object.entries(parseEnv(text)))if(/KEY|TOKEN|SECRET|PASSWORD/.test(key)&&value)failures.push(`${file}: ${key} must be empty`);}
 if(/\.(?:ts|tsx|js|mjs)$/.test(file)&&/^['"]use client['"]/m.test(text)&&/process\.env\.(?:OPENAI_API_KEY|BLOB_READ_WRITE_TOKEN|POCKET_SESSION_SECRET|POCKET_PASSWORD_HASH)/.test(text))failures.push(`${file}: server secret referenced in a client module`);
}
if(ownGit&&process.argv.includes('--history')){
 try{
  const paths=execFileSync('git',['log','--all','--format=','--name-only'],{encoding:'utf8',maxBuffer:64000000});
  if(paths.split('\n').some(p=>privatePath(p)))failures.push('Git history: contains a private file path; use a fresh sanitised history');
  const history=execFileSync('git',['log','--all','--format=','-p','--no-ext-diff'],{encoding:'utf8',maxBuffer:64000000});
  if(patterns.some(([pattern])=>pattern.test(history))||known.some(secret=>history.includes(secret)))failures.push('Git history: recognised credential or local secret match; revoke exposed values and sanitise history');
 }catch{failures.push('Could not complete Git history scan; review history before publishing');}
}
if(failures.length){console.error('Public-source check FAILED (values redacted):\n'+failures.join('\n'));process.exitCode=1;}else console.log(`Public-source check passed for ${files.length} files. No recognised credentials, local secret matches, or private tracked files found. This is a guardrail, not a guarantee against every possible secret format.`);
