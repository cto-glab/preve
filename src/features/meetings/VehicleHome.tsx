import {useAuth} from '../../auth/context';
import {VehicleLiveHome} from './VehicleLiveHome';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {VehicleActions,VehicleAction} from '../../components/VehicleActions';
import {Screen} from '../../components/Screen';
import { theme } from '../../theme/tokens';
import { useMeetings } from './context';
import { demoMeetings } from './demo';
export function VehicleHome() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height - insets.top - insets.bottom < 420;
  const { demo, setDemo } = useMeetings();
  const [selected, setSelected] = useState(0);
  const meeting = demoMeetings[selected];
  const {session}=useAuth();
  if(session&&!demo)return <VehicleLiveHome />;
  const actions:VehicleAction[]=demo?[{label:'미팅 준비하기',icon:'briefing',primary:true,onPress:()=>router.push({pathname:'/meeting/[id]',params:{id:meeting.id}})},{label:'이전 일정',icon:'previous',onPress:()=>setSelected((selected-1+demoMeetings.length)%demoMeetings.length)},{label:'다음 일정',icon:'next',onPress:()=>setSelected((selected+1)%demoMeetings.length)},{label:'체험 종료',icon:'exit',onPress:()=>{setSelected(0);setDemo(false);}}]:[{label:'샘플 일정 체험하기',icon:'start',primary:true,onPress:()=>{setSelected(0);setDemo(true);}},{label:'휴대폰 연결 안내',icon:'connection',onPress:()=>router.push('/vehicle/connection')}];
  return <Screen title="내 미팅"><View style={{gap:16}}>
    <Text style={ui.badge}>{demo ? '체험 모드 · 가상 일정' : '차량 미팅 도우미'}</Text>
    <View style={ui.content}>{demo ? <>
      <Text style={compact ? ui.compactSecondary : ui.secondary}>{meeting.time} · {meeting.company}</Text>
      <Text accessibilityRole="header" style={compact ? ui.compactTitle : ui.title}>{meeting.title}</Text>
      {!compact && <Text style={ui.secondary}>{meeting.location}</Text>}
    </> : <>
      <Text accessibilityRole="header" style={compact ? ui.compactTitle : ui.title}>휴대폰과 연결해 미팅을 준비하세요</Text>
      {!compact && <Text style={ui.secondary}>주차 중 휴대폰에서 차량 연결을 승인해 주세요. 설정에서 일회용 연결 코드를 발급할 수 있어요.</Text>}
    </>}</View>
    <VehicleActions items={actions}/>  </View></Screen>;
}
const ui = StyleSheet.create({ safe: { flex: 1, backgroundColor: theme.colors.background }, frame: { flex: 1, padding: 20, gap: 12, width: '100%', alignSelf: 'center' }, content: { gap: 16 }, badge: { color: theme.colors.primary, fontSize: 24, lineHeight: 32 }, compactTitle: { color: theme.colors.textPrimary, fontSize: 20, lineHeight: 28, fontWeight: '600' }, compactSecondary: { color: theme.colors.textSecondary, fontSize: 24, lineHeight: 32 }, title: { color: theme.colors.textPrimary, fontSize: 40, lineHeight: 52, fontWeight: '600' }, secondary: { color: theme.colors.textSecondary, fontSize: 28, lineHeight: 40 }, actions: { flexDirection: 'row', gap: 12 }, grow: { flex: 1 } });
