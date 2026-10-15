import {createHmac,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
export const COOKIE_NAME='pocket_session';
export const SESSION_SECONDS=60*60*24*7;
export function hashPassword(password:string,salt=randomBytes(16).toString('hex')){return `scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`;}
export function verifyPassword(password:string,hash:string){const [type,salt,digest]=hash.split(':');if(type!=='scrypt'||!salt||!digest||password.length>1024)return false;const actual=scryptSync(password,salt,64),expected=Buffer.from(digest,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
function sign(payload:string,secret:string,passwordHash:string){return createHmac('sha256',secret).update(`${passwordHash}:${payload}`).digest('base64url');}
export function createSession(secret:string,passwordHash:string,now=Date.now(),subject='personal'){const payload=Buffer.from(JSON.stringify({sub:subject,exp:Math.floor(now/1000)+SESSION_SECONDS,nonce:randomBytes(16).toString('hex')})).toString('base64url');return `${payload}.${sign(payload,secret,passwordHash)}`;}
// The subject is only a lookup hint; callers must verify the signature before
// trusting it. Including the current password hash invalidates rotated sessions.
export function sessionSubject(token:string|undefined):string|null{if(!token||token.length>2048)return null;try{const value=JSON.parse(Buffer.from(token.split('.')[0],'base64url').toString());return typeof value.sub==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(value.sub)?value.sub:null;}catch{return null;}}
export function validSession(token:string|undefined,secret:string,passwordHash:string,now=Date.now(),subject='personal'){if(!token||token.length>2048||!secret||!passwordHash)return false;try{const [payload,signature,extra]=token.split('.');if(!payload||!signature||extra)return false;const expected=Buffer.from(sign(payload,secret,passwordHash)),actual=Buffer.from(signature);if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return false;const value=JSON.parse(Buffer.from(payload,'base64url').toString());return value.sub===subject&&typeof value.exp==='number'&&value.exp>now/1000&&value.exp<=now/1000+SESSION_SECONDS+60;}catch{return false;}}
export const generatedPassword=()=>randomBytes(24).toString('base64url');
