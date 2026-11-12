import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../auth/context';
import { useMeetings } from '../meetings/context';
import { environment } from '../../config/environment';
import { syncGoogleCalendar } from './remote';
import { calendarErrorMessage } from './errors';
type CalendarState={ready:boolean;connected:boolean;needsOnboarding:boolean;busy:boolean;message:string;connect:()=>Promise<boolean>;refresh:()=>Promise<void>;skip:()=>Promise<void>};
const Context=createContext<CalendarState|null>(null);
export function CalendarProvider({children}:PropsWithChildren){
 const {session}=useAuth();const userId=session?.userId;const {liveMeetings,refreshMeetings}=useMeetings();
 const key=userId?'preve.calendar.v1.'+userId:null;
 const [ready,setReady]=useState(false),[connected,setConnected]=useState(false),[skipped,setSkipped]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const lock=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 useEffect(()=>{let active=true;if(!key||environment.target!=='mobile'){setReady(true);return;}
  void SecureStore.getItemAsync(key).then(raw=>{if(!active)return;if(raw){try{const saved=JSON.parse(raw);setConnected(saved.connected===true);setSkipped(saved.skipped===true);}catch{/* Invalid local flags never imply Google consent. */}}}).catch(()=>{if(active)setMessage('캘린더 연결 정보를 확인하지 못했어요. 다시 연결해 주세요.');}).finally(()=>{if(active)setReady(true);});return()=>{active=false;};
 },[key]);
 // Migrate existing installations that already imported Google events.
 const hasGoogle=liveMeetings.some(meeting=>meeting.source==='google');
 const linked=connected||hasGoogle;
 useEffect(()=>{if(ready&&hasGoogle&&key&&!connected){setConnected(true);void SecureStore.setItemAsync(key,JSON.stringify({connected:true,skipped:false})).catch(()=>{});}},[ready,hasGoogle,key,connected]);
 const connect=useCallback(async()=>{if(lock.current||!key)return false;lock.current=true;setBusy(true);setMessage('Google 일정 확인 중…');try{
  const result=await syncGoogleCalendar();if(!alive.current)return false;
  await SecureStore.setItemAsync(key,JSON.stringify({connected:true,skipped:false}));if(!alive.current)return false;
  setConnected(true);setSkipped(false);await refreshMeetings();if(!alive.current)return false;
  setMessage('Google 캘린더 일정 '+result.imported+'개를 최신화했어요.'+(result.hasMore?' 가까운 일정 100개까지 가져왔어요.':''));return true;
 }catch(error){if(alive.current)setMessage(calendarErrorMessage(error,'permission'));return false;}finally{lock.current=false;if(alive.current)setBusy(false);}},[key,refreshMeetings]);
 const refresh=useCallback(async()=>{if(linked){await connect();return;}if(lock.current)return;lock.current=true;setBusy(true);setMessage('');try{await refreshMeetings();}finally{lock.current=false;if(alive.current)setBusy(false);}},[linked,connect,refreshMeetings]);
 const skip=async()=>{if(lock.current||!key)return;try{await SecureStore.setItemAsync(key,JSON.stringify({connected:false,skipped:true}));if(alive.current)setSkipped(true);}catch{if(alive.current)setMessage('설정을 저장하지 못했어요. 다시 시도해 주세요.');}};
 return <Context.Provider value={{ready,connected:linked,needsOnboarding:!!userId&&ready&&!linked&&!skipped,busy,message,connect,refresh,skip}}>{children}</Context.Provider>;
}
export function useCalendar(){const value=useContext(Context);if(!value)throw new Error('CalendarProvider missing');return value;}
