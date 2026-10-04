import { loginCredentials, registrationCredentials } from './credentials';
export type User = {id:string;name:string;username:string;role:string};
type StoredUser=User & {salt:string;passwordHash:string};
export type Progress=Record<string,{status:string;studiedAt?:string}>;
const ACCOUNTS='mycelium-accounts-v1',SESSION='mycelium-session-v1';
export const GUEST='mycelium-progress-v1';
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
async function passwordHash(password:string,salt:string) {
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:150000,hash:'SHA-256'},key,256);
 return hex(new Uint8Array(bits));
}
function accounts():StoredUser[] {
 const stored=JSON.parse(localStorage.getItem(ACCOUNTS)||'[]');
 if(!Array.isArray(stored)||stored.some(x=>!x||typeof x.id!=='string'||typeof x.username!=='string'||typeof x.passwordHash!=='string'||typeof x.salt!=='string')) throw Error('Локальные данные аккаунтов повреждены');
 return stored;
}
const publicUser=({id,name,username}:StoredUser):User=>({id,name,username,role:'USER'});
export function currentLocalUser():User|null { const id=localStorage.getItem(SESSION),u=accounts().find(u=>u.id===id);return u?publicUser(u):null; }
export function progressKey(user:User|null) {return user?'mycelium-progress-account-'+user.id:GUEST;}
export function readProgress(key:string):Progress {
 const raw=JSON.parse(localStorage.getItem(key)||'{}');
 if(!raw||typeof raw!=='object'||Array.isArray(raw)) throw Error('Локальные данные прогресса повреждены');
 return Object.fromEntries(Object.entries(raw).filter(([,v])=>v&&typeof v==='object'&&['STUDIED','IN_PROGRESS','NOT_STARTED'].includes((v as {status:string}).status))) as Progress;
}
export async function authenticateLocal(action:'register'|'login',input:unknown) {
 try {
  const parsed=action==='register'?registrationCredentials.parse(input):loginCredentials.parse(input);
  const list=accounts(),existing=list.find(u=>u.username===parsed.username);
  let user:StoredUser;
  if(action==='register') {
   const body=registrationCredentials.parse(input);
   if(existing) throw Error('Этот ник уже занят в этом браузере');
   const salt=hex(crypto.getRandomValues(new Uint8Array(16)));
   user={id:crypto.randomUUID(),name:body.name,username:body.username,role:'USER',salt,passwordHash:await passwordHash(body.password,salt)};
   // Recheck after hashing to avoid duplicate usernames from simultaneous tabs.
   const latest=accounts();if(latest.some(u=>u.username===user.username))throw Error('Этот ник уже занят в этом браузере');
   localStorage.setItem(ACCOUNTS,JSON.stringify([...latest,user]));
  } else {
   if(!existing||await passwordHash(parsed.password,existing.salt)!==existing.passwordHash)throw Error('Неверный ник или пароль');
   user=existing;
  }
  localStorage.setItem(SESSION,user.id);return publicUser(user);
 } catch(error) {
  if(error && typeof error==='object' && 'issues' in error)throw Error((error as {issues:{message:string}[]}).issues[0]?.message||'Проверьте поля');
  throw error;
 }
}
export function logoutLocal() {localStorage.removeItem(SESSION);}
