import { api } from '../../api';
import { ApiError } from '../../api/client';
import { Meeting } from './demo';
export type LiveMeeting={id:string;title:string;startsAt:string|null;location:string;source:'manual'|'google'};
export function parseLiveMeeting(input:unknown):LiveMeeting {
 const value=input as Partial<LiveMeeting>|null;
 if(!value||typeof value.id!=='string'||!value.id||typeof value.title!=='string'||!value.title||typeof value.location!=='string'||!['manual','google'].includes(String(value.source))||(value.startsAt!==null&&(typeof value.startsAt!=='string'||!Number.isFinite(Date.parse(value.startsAt)))))throw new ApiError('invalid-response');
 return {id:value.id,title:value.title,startsAt:value.startsAt,location:value.location,source:value.source!};
}
export function meetingView(value:LiveMeeting):Meeting{return {id:value.id,startsAt:value.startsAt,title:value.title,time:value.startsAt?(value.source==='google'&&value.title.endsWith(' (종일)')?value.startsAt.slice(0,10)+' · 종일':new Date(value.startsAt).toLocaleString('ko-KR')):'시간 미정',location:value.location||'장소 미정',source:value.source,company:'',contact:'담당자 미연결',brief:'자료를 첨부하고 분석 결과를 확인해 주세요.',briefPages:['분석 자료를 확인해 주세요.'],evidence:[]};}
export async function listLiveMeetings(){const result=await api.request<{meetings:unknown[]}>('/v1/meetings');if(!result||!Array.isArray(result.meetings)||result.meetings.length>100)throw new ApiError('invalid-response');return result.meetings.map(item=>meetingView(parseLiveMeeting(item)));}
export function manualMeetingInput(title:string,date:string,time:string,location:string){
 const day=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date),clock=/^(\d{2}):(\d{2})$/.exec(time);
 if(!title.trim()||title.trim().length>300||location.length>500||!day||!clock)throw new Error('일정명과 날짜·시간을 확인해 주세요.');
 const [year,month,d]=day.slice(1).map(Number),[hour,minute]=clock.slice(1).map(Number);
 const starts=new Date(year,month-1,d,hour,minute);
 if(year<100||starts.getFullYear()!==year||starts.getMonth()!==month-1||starts.getDate()!==d||starts.getHours()!==hour||starts.getMinutes()!==minute)throw new Error('유효한 날짜와 시간을 입력해 주세요.');
 return {title:title.trim(),startsAt:starts.toISOString(),location:location.trim()};
}
export async function createLiveMeeting(input:ReturnType<typeof manualMeetingInput>){return meetingView(parseLiveMeeting(await api.request('/v1/meetings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})));}
