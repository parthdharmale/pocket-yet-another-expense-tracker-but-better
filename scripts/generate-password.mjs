import {randomBytes,scryptSync} from 'node:crypto';
import {readFileSync,writeFileSync,chmodSync,existsSync} from 'node:fs';
const accessPath='.pocket-access.txt';
if(existsSync(accessPath)&&!process.argv.includes('--rotate'))throw Error('Access file already exists. Use --rotate deliberately to replace the password and sign out every session.');
const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex');
const hash=`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`,secret=randomBytes(48).toString('base64url');
let env=existsSync('.env.local')?readFileSync('.env.local','utf8'):'';
for(const [key,value] of Object.entries({POCKET_PASSWORD_HASH:hash,POCKET_SESSION_SECRET:secret})){env=env.split('\n').filter(l=>!l.startsWith(key+'=')).join('\n');env+=`\n${key}=${value}\n`;}
writeFileSync('.env.local',env,{mode:0o600});chmodSync('.env.local',0o600);
writeFileSync(accessPath,`Pocket private access\n\nPassword: ${password}\n\nKeep this file private. This file is excluded from Git and deployments.\nChanging the password requires uploading the new hash and session secret to Vercel and redeploying.\n`,{mode:0o600});chmodSync(accessPath,0o600);
console.log('Password generated. Access details saved in .pocket-access.txt (owner-only permissions).');
