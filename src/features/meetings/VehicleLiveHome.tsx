import {useState} from 'react';
import {router} from 'expo-router';
import {Text,View} from 'react-native';
import {VehicleSpinner} from '../../components/VehicleSpinner';
import {theme} from '../../theme/tokens';
import {Screen} from '../../components/Screen';
import {VehicleActions,VehicleAction} from '../../components/VehicleActions';
import {styles} from '../../components/contentStyles';
import {useMeetings} from './context';
export function VehicleLiveHome(){const {liveMeetings,loadingMeetings,meetingError,refreshMeetings}=useMeetings();const [selected,setSelected]=useState<string|null>(null);const today=new Date().toLocaleDateString('en-CA');const ordered=[...liveMeetings].sort((a,b)=>Date.parse(a.startsAt||'9999-01-01')-Date.parse(b.startsAt||'9999-01-01'));const eligible=ordered.filter(m=>m.startsAt&&new Date(m.startsAt).toLocaleDateString('en-CA')>=today);const meeting=ordered.find(m=>m.id===selected)||eligible[0]||ordered.find(m=>!m.startsAt);const current=ordered.findIndex(m=>m.id===meeting?.id);
 const actions:VehicleAction[]=[{label:'프리브와 대화',displayLabel:'프리브와\n대화',icon:'microphone' as const,onPress:()=>router.push('/vehicle/voice')},...(meeting?[{label:'미팅 준비하기',icon:'briefing' as const,primary:true,onPress:()=>router.push({pathname:'/meeting/[id]',params:{id:meeting.id}})},{label:'이전 일정',icon:'previous' as const,disabled:liveMeetings.length<2,onPress:()=>setSelected(ordered[(current-1+ordered.length)%ordered.length].id)},{label:'다음 일정',disabled:liveMeetings.length<2,icon:'next' as const,onPress:()=>setSelected(ordered[(current+1)%ordered.length].id)}]:[]),{label:'캘린더',icon:'calendar' as const,onPress:()=>router.push('/vehicle/calendar')},{label:'일정 새로고침',icon:'refresh' as const,disabled:loadingMeetings,busy:loadingMeetings,onPress:()=>{void refreshMeetings();}},{label:'연결 관리',icon:'connection' as const,onPress:()=>router.push('/vehicle/connection')}];
 return <Screen title="내 미팅"><Text style={styles.badge}>휴대폰 계정과 연결됨</Text>{loadingMeetings&&<View accessibilityLiveRegion="polite" style={{flexDirection:'row',alignItems:'center',gap:12}}><VehicleSpinner color={theme.colors.primary}/><Text style={styles.subtitle}>일정 확인 중…</Text></View>}{!!meetingError&&<Text style={styles.subtitle}>{meetingError}</Text>}{meeting?<><Text style={styles.heading}>{meeting.title}</Text><Text style={styles.subtitle}>{meeting.time} · {meeting.location}</Text></>:!loadingMeetings&&!meetingError&&<Text style={styles.subtitle}>예정된 일정이 없어요. 휴대폰에서 일정을 등록하거나 캘린더를 새로고침해 주세요.</Text>}
 <VehicleActions items={actions} /></Screen>;
}
