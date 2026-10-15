import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
export const tokenDigest=(token:string)=>createHash('sha256').update(token).digest('hex');
export const newShortcutToken=()=>`pkt_${randomBytes(32).toString('base64url')}`;
export function matchesToken(token:string,digest:string){if(!/^pkt_[A-Za-z0-9_-]{43}$/.test(token)||! /^[a-f0-9]{64}$/.test(digest))return false;return timingSafeEqual(Buffer.from(tokenDigest(token),'hex'),Buffer.from(digest,'hex'));}
export const shortcutEntryId=(requestId:string,owner='personal')=>`shortcut-${createHash('sha256').update(owner+':'+requestId).digest('hex')}`;
