export function publicAppUrl(){
 const configured=process.env.POCKET_PUBLIC_URL;
 if(!configured&&process.env.NODE_ENV==='production')throw Error('Set POCKET_PUBLIC_URL to this deployment’s HTTPS origin.');
 const url=new URL(configured||'http://localhost:3000');
 const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||!(url.protocol==='https:'||(local&&url.protocol==='http:'&&process.env.NODE_ENV!=='production')))throw Error('POCKET_PUBLIC_URL must be an HTTPS origin (HTTP localhost is allowed in development).');
 return url.origin;
}
