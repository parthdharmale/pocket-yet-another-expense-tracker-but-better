import {existsSync} from 'node:fs';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
const errors=[];
for(const key of ['BLOB_READ_WRITE_TOKEN','POCKET_OWNER_EMAIL','POCKET_PASSWORD_HASH','POCKET_SESSION_SECRET'])if(!process.env[key])errors.push(`${key} is missing`);
if(process.env.POCKET_OWNER_EMAIL&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.POCKET_OWNER_EMAIL))errors.push('POCKET_OWNER_EMAIL must be a valid email');
if(process.env.POCKET_PASSWORD_HASH&&!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(process.env.POCKET_PASSWORD_HASH))errors.push('Regenerate POCKET_PASSWORD_HASH with npm run password:generate');
if(process.env.POCKET_SESSION_SECRET&&process.env.POCKET_SESSION_SECRET.length<32)errors.push('POCKET_SESSION_SECRET must have at least 32 characters');
try{const u=new URL(process.env.POCKET_PUBLIC_URL||'http://localhost:3000'),local=['localhost','127.0.0.1','[::1]'].includes(u.hostname);if(u.username||u.password||u.search||u.hash||u.pathname!=='/'||!(u.protocol==='https:'||(local&&u.protocol==='http:'&&process.env.NODE_ENV!=='production')))throw Error();}catch{errors.push('POCKET_PUBLIC_URL must be your HTTPS origin (HTTP localhost is development-only)');}
if(process.env.NODE_ENV==='production'&&!process.env.POCKET_PUBLIC_URL)errors.push('POCKET_PUBLIC_URL is required in production');
for(const key of Object.keys(process.env))if(key.startsWith('NEXT_PUBLIC_')&&/(KEY|SECRET|TOKEN|PASSWORD)/i.test(key))errors.push(`${key} must not be exposed as a public environment variable`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Configuration checks passed. AI ${process.env.OPENAI_API_KEY?'enabled':'optional and not configured; manual features remain available'}. No secret values printed.`);
