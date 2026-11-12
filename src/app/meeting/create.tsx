import { router } from 'expo-router';
import { useState } from 'react';
import { Text,TextInput,View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Action } from '../../components/Action';
import { styles } from '../../components/contentStyles';
import { theme } from '../../theme/tokens';
import { useAuth } from '../../auth/context';
import { environment } from '../../config/environment';
import { useMeetings } from '../../features/meetings/context';
import { createLiveMeeting,manualMeetingInput } from '../../features/meetings/remote';
export default function CreateMeeting(){
 const {session}=useAuth();const {rememberMeeting}=useMeetings();
 const [title,setTitle]=useState(''),[date,setDate]=useState(''),[time,setTime]=useState(''),[location,setLocation]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 if(environment.target!=='mobile'||!session)return <Screen title="일정 등록"><Text style={styles.subtitle}>휴대폰에서 로그인한 뒤 일정을 등록해 주세요.</Text><Action label="일정으로" onPress={()=>router.replace('/')} /></Screen>;
 return <Screen title="일정 직접 등록"><Text style={styles.subtitle}>Google Calendar와 별도로 직접 등록하는 일정입니다. 시간은 현재 기기의 시간대를 기준으로 저장합니다.</Text>
 {([{label:'일정명',value:title,set:setTitle,placeholder:'예: 계약 조건 확인 미팅',hint:'어떤 일정인지 알아볼 수 있는 이름을 적어 주세요.',max:300},{label:'날짜',value:date,set:setDate,placeholder:'예: 2026-11-02',hint:'연-월-일(YYYY-MM-DD) 형식으로 입력해 주세요.',max:10},{label:'시간',value:time,set:setTime,placeholder:'예: 14:00',hint:'24시간 기준 시:분(HH:mm), 현재 기기 시간대입니다.',max:5},{label:'장소',value:location,set:setLocation,placeholder:'예: 강남 사무실 또는 온라인',hint:'장소는 비워 두어도 됩니다.',max:500}]).map(field=><View key={field.label} style={{gap:6}}><Text style={{fontSize:15,fontWeight:'600',color:theme.colors.textPrimary}}>{field.label}{field.label==='장소'?' (선택)':' (필수)'}</Text><TextInput accessibilityLabel={field.label} value={field.value} onChangeText={field.set} placeholder={field.placeholder} maxLength={field.max} editable={!busy} style={{minHeight:48,borderWidth:1,borderColor:theme.colors.border,borderRadius:12,padding:14,color:theme.colors.textPrimary,fontSize:16}} /><Text style={{fontSize:13,lineHeight:18,color:theme.colors.textSecondary}}>{field.hint}</Text></View>)}
 {!!error&&<Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text>}
 <Action label={busy?'저장 중…':'일정 저장'} disabled={busy} onPress={async()=>{if(busy)return;setError('');let input;try{input=manualMeetingInput(title,date,time,location);}catch(cause){setError(cause instanceof Error?cause.message:'입력을 확인해 주세요.');return;}setBusy(true);try{rememberMeeting(await createLiveMeeting(input));router.replace('/');}catch{setError('일정을 저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');}finally{setBusy(false);}}} />
 <Action label="취소" secondary onPress={()=>router.replace('/')} /></Screen>;
}
