import {useEffect} from 'react';
import {requireOptionalNativeModule} from 'expo';
import {environment} from '../../config/environment';
import {sessions} from '../../auth/runtime';
import {api} from '../../api';
import {parseLiveMeeting} from '../meetings/remote';
import {documentsApi} from '../documents/api';
import {createGleoHandler} from './handler';
type Native={takePending:()=>Promise<{id:string;action:string;raw:string}|null>;respond:(id:string,value:string)=>Promise<boolean>};
export function GleoBridge(){useEffect(()=>{
 if(environment.target!=='pleos')return;
 const native=requireOptionalNativeModule<Native>('PreveGleo');if(!native)return;
 let active=true,busy=false;
 const handle=createGleoHandler({owner:()=>sessions.current?.target==='pleos'?sessions.current.userId:null,meetings:async()=>{const result=await api.request<{meetings:unknown[]}>('/v1/meetings',{}, {timeoutMs:2500});if(!Array.isArray(result?.meetings)||result.meetings.length>100)throw new Error();return result.meetings.map(parseLiveMeeting);},documents:id=>documentsApi.list(id)});
 const poll=async()=>{if(!active||busy)return;busy=true;try{const request=await native.takePending();if(request){let timer:ReturnType<typeof setTimeout>|undefined;try{const response=await Promise.race([(async()=>{await sessions.load();return handle(request.action,request.raw);})(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('timeout')),5000);})]);await native.respond(request.id,JSON.stringify(response));}catch{await native.respond(request.id,JSON.stringify({functionName:request.action,status:'fail',message:'The request timed out or the account is unavailable.',mode:'voice'}));}finally{if(timer)clearTimeout(timer);}}}catch{/* Never log account data, parameters or callback contents. */}finally{busy=false;}};
 void poll();const timer=setInterval(()=>void poll(),250);return()=>{active=false;clearInterval(timer);};
 },[]);return null;}
