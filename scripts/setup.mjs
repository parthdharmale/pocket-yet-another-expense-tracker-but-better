import {copyFileSync,existsSync,constants,chmodSync} from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
if(!existsSync('.env.local')){copyFileSync('.env.example','.env.local',constants.COPYFILE_EXCL);chmodSync('.env.local',0o600);console.log('Created private .env.local from the empty template.');}
if(!existsSync('.pocket-access.txt')){const result=spawnSync(process.execPath,['scripts/generate-password.mjs'],{stdio:'inherit'});if(result.status!==0)process.exit(result.status??1);}else console.log('Existing owner credentials preserved.');
try{const top=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();if(resolve(top)===resolve('.')){execFileSync('git',['config','--local','core.hooksPath','.githooks']);console.log('Enabled repository-local secret-check hooks.');}}catch{/* Source archive without Git. CI still runs the scanner. */}
console.log('Next: edit .env.local and set BLOB_READ_WRITE_TOKEN and POCKET_OWNER_EMAIL. Set POCKET_PUBLIC_URL to your own origin. Open .pocket-access.txt privately for your generated login password; do not commit or share this file.');
