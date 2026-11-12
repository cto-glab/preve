export type GleoAction='GET_PREVE_MEETINGS'|'GET_PREVE_BRIEFING'|'GET_PREVE_EVIDENCE';
type Meeting={id:string;title:string;startsAt:string|null;location:string};
type Document={fileName:string;status:string;analysis:null|{summary:string;facts:{text:string;page:number;quote:string}[]}};
type Dependencies={owner:()=>string|null;meetings:()=>Promise<Meeting[]>;documents:(id:string)=>Promise<Document[]>;now?:()=>number};
export type GleoResponse={functionName:string;status:'success'|'asking'|'fail';message:string;mode:'voice';data?:string};
export function createGleoHandler(deps:Dependencies){let context:{owner:string;meeting:string;expires:number}|null=null;
 return async(action:string,raw:string):Promise<GleoResponse>=>{
  const result=(status:GleoResponse['status'],message:string,data?:unknown[]):GleoResponse=>({functionName:action,status,message,mode:'voice',...(data?{data:JSON.stringify(data)}:{})});
  if(!['GET_PREVE_MEETINGS','GET_PREVE_BRIEFING','GET_PREVE_EVIDENCE'].includes(action))return result('fail','This action is not supported.');
  const owner=deps.owner();if(!owner){context=null;return result('fail','Connect your phone account before using meeting information.');}
  const now=(deps.now||Date.now)();if(context&&(context.owner!==owner||context.expires<now))context=null;
  let params:Record<string,unknown>;
  try{if(raw.length>4096)throw new Error();let value=JSON.parse(raw);if(typeof value==='string')value=JSON.parse(value);if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();params=value;const allowed=action==='GET_PREVE_MEETINGS'?['period']:['meetingId'];if(Object.keys(params).some(key=>!allowed.includes(key)))throw new Error();if(params.meetingId!==undefined&&(typeof params.meetingId!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(params.meetingId)))throw new Error();if(params.period!==undefined&&(typeof params.period!=='string'||!['today','next'].includes(params.period)))throw new Error();}catch{return result('asking','Provide valid meeting parameters.');}
  try{
   const meetings=await deps.meetings();if(deps.owner()!==owner)return result('fail','The connected account changed.');
   const upcoming=meetings.filter(item=>item.startsAt&&Date.parse(item.startsAt)>=now).sort((a,b)=>Date.parse(a.startsAt!)-Date.parse(b.startsAt!));
   if(action==='GET_PREVE_MEETINGS'){
    const sameDay=(stamp:string|null)=>{const date=new Date(stamp||'');const today=new Date(now);return date.getFullYear()===today.getFullYear()&&date.getMonth()===today.getMonth()&&date.getDate()===today.getDate();};
    const selected=params.period==='today'?meetings.filter(item=>sameDay(item.startsAt)).sort((a,b)=>Date.parse(a.startsAt!)-Date.parse(b.startsAt!)).slice(0,5):upcoming.slice(0,1);
    if(selected.length===1)context={owner,meeting:selected[0].id,expires:now+300000};
    else context=null;
    return result('success',selected.length?'The meeting schedule was retrieved.':'No matching meetings were found.',selected);
   }
   const id=typeof params.meetingId==='string'?params.meetingId:context?.meeting||upcoming[0]?.id;
   const meeting=meetings.find(item=>item.id===id);if(!meeting)return result(params.meetingId?'fail':'asking','No matching meeting was found in your account.');
   const docs=await deps.documents(meeting.id);if(deps.owner()!==owner)return result('fail','The connected account changed.');
   const ready=docs.filter(doc=>doc.status==='ready'&&doc.analysis).slice(0,2);context={owner,meeting:meeting.id,expires:now+300000};
   if(!ready.length)return result('success','No completed PDF analysis is available for this meeting.',[{meetingId:meeting.id,analysisStatus:docs.some(doc=>['queued','processing'].includes(doc.status))?'processing':'unavailable'}]);
   return result('success','Existing AI-extracted document information was retrieved. Verify it against the original PDF.',ready.map(doc=>({meetingId:meeting.id,fileName:doc.fileName,...(action==='GET_PREVE_BRIEFING'?{summary:doc.analysis!.summary.slice(0,1600)}:{facts:doc.analysis!.facts.slice(0,4).map(fact=>({text:fact.text.slice(0,400),page:fact.page,quote:fact.quote.slice(0,300)}))})})));
  }catch{return result('fail','Meeting information could not be retrieved. Check the server connection.');}
 };
}
