import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState, Text, useWindowDimensions } from 'react-native';
import { Screen } from '../../components/Screen';
import { VehicleAction, VehicleActions } from '../../components/VehicleActions';
import { styles } from '../../components/contentStyles';
import { documentsApi } from '../documents/api';
import { RemoteDocument } from '../documents/remote';
import { Meeting } from './demo';
export function VehicleAnalysisBriefing({meeting}:{meeting:Meeting}){const [items,setItems]=useState<RemoteDocument[]>([]),[message,setMessage]=useState('분석 결과 확인 중…'),[page,setPage]=useState(0),[revision,setRevision]=useState(0);const {height}=useWindowDimensions();
 useFocusEffect(useCallback(()=>{let active=true,running=false;const load=async()=>{if(running||AppState.currentState!=='active')return;running=true;try{const next=await documentsApi.list(meeting.id);if(active){setItems(next);setMessage(next.length?'':'휴대폰에서 자료를 첨부하고 분석해 주세요.');}}catch{if(active)setMessage('분석 결과를 불러오지 못했어요. 연결을 확인해 주세요.');}finally{running=false;}};void load();const listener=AppState.addEventListener('change',state=>{if(state==='active')void load();});return()=>{active=false;listener.remove();};},[meeting.id,revision]));
 const pages=items.flatMap(d=>d.analysis?[{text:d.analysis.summary,source:d.fileName+' · AI 추출 / 원문 확인 필요'},...d.analysis.facts.map(f=>({text:f.text,source:d.fileName+' · '+f.page+'쪽 · '+f.quote})),...d.analysis.openQuestions.slice(0,2).map(q=>({text:q,source:'확인할 질문'}))]:[]);const current=pages[Math.min(page,Math.max(0,pages.length-1))];
 const actions:VehicleAction[]=[...(current?[{label:'다음 내용',icon:'next' as const,onPress:()=>setPage((page+1)%pages.length)}]:[]),{label:'결과 새로고침',icon:'refresh',onPress:()=>{setPage(0);setRevision(value=>value+1);}},{label:'내 미팅으로',icon:'home',primary:true,onPress:()=>router.replace('/')}];
 return <Screen title={meeting.title}><Text style={styles.badge}>내 계정의 일정 · {meeting.time}</Text>{current?<><Text style={styles.heading}>{current.text}</Text>{height>=420&&<Text style={styles.subtitle}>{current.source}</Text>}<Text style={styles.subtitle}>{Math.min(page+1,pages.length)} / {pages.length}</Text></>:<Text style={styles.subtitle}>{message||'자료 분석이 아직 완료되지 않았어요.'}</Text>}<Text style={styles.subtitle}>{meeting.location}</Text><VehicleActions items={actions} layout="row" maxSize={180}/></Screen>;
}
