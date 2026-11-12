import type {Meeting} from './demo';
export function localDay(date:Date){return String(date.getFullYear()).padStart(4,'0')+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');}
export function meetingDay(meeting:Meeting){if(!meeting.startsAt)return null;const date=new Date(meeting.startsAt);if(!Number.isFinite(date.getTime()))return null;return meeting.source==='google'&&meeting.title.endsWith(' (종일)')?meeting.startsAt.slice(0,10):localDay(date);}
export function monthDays(year:number,month:number){const first=new Date(year,month,1);const count=new Date(year,month+1,0).getDate();return Array.from({length:Math.ceil((first.getDay()+count)/7)*7},(_,i)=>{const day=i-first.getDay()+1;return day>=1&&day<=count?localDay(new Date(year,month,day)):null;});}
