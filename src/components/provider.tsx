"use client";
import {createContext,useContext,useEffect,useState,useCallback} from 'react';
import {authenticateLocal,currentLocalUser,logoutLocal,readProgress,progressKey,GUEST,type User,type Progress} from '@/lib/local-account';
type Context={user:User|null;progress:Progress;ready:boolean;error:string;guestCount:number;refresh:()=>Promise<void>;authenticate:(action:'register'|'login',input:unknown)=>Promise<void>;mark:(id:string,action:'start'|'studied'|'reset')=>Promise<void>;importGuest:()=>Promise<void>;logout:()=>Promise<void>};
const Ctx=createContext<Context|null>(null);
export const useLearning=()=>useContext(Ctx)!;
export function Provider({children}:{children:React.ReactNode}) {
 const [user,setUser]=useState<User|null>(null),[progress,setProgress]=useState<Progress>({}),[ready,setReady]=useState(false),[error,setError]=useState(''),[guestCount,setGuestCount]=useState(0);
 const refresh=useCallback(async()=>{
  try {const account=currentLocalUser();setUser(account);setProgress(readProgress(progressKey(account)));setGuestCount(Object.values(readProgress(GUEST)).filter(x=>x.status==='STUDIED').length);setError('');}
  catch(e){setError((e as Error).message);}finally{setReady(true);}
 },[]);
 useEffect(()=>{void refresh();const sync=()=>void refresh();window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[refresh]);
 const mark=useCallback(async(id:string,action:'start'|'studied'|'reset')=>{
  try {const account=currentLocalUser(),key=progressKey(account),next=readProgress(key);
   if(action==='reset')delete next[id];else if(action==='studied'||next[id]?.status!=='STUDIED')next[id]={status:action==='studied'?'STUDIED':'IN_PROGRESS',studiedAt:action==='studied'?new Date().toISOString():undefined};
   localStorage.setItem(key,JSON.stringify(next));await refresh();
  }catch(e){setError((e as Error).message);throw e;}
 },[refresh]);
 const authenticate=async(action:'register'|'login',input:unknown)=>{await authenticateLocal(action,input);await refresh();};
 const logout=async()=>{logoutLocal();await refresh();};
 const importGuest=async()=>{const account=currentLocalUser();if(!account)throw Error('Войди в аккаунт');const key=progressKey(account),next=readProgress(key);for(const [id,value] of Object.entries(readProgress(GUEST)))if(value.status==='STUDIED')next[id]=value;localStorage.setItem(key,JSON.stringify(next));localStorage.removeItem(GUEST);await refresh();};
 return <Ctx.Provider value={{user,progress,ready,error,guestCount,refresh,authenticate,mark,importGuest,logout}}>{children}</Ctx.Provider>;
}
