import { router } from 'expo-router';
import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {VehicleActions,VehicleAction} from '../../components/VehicleActions';
import { getLayoutMode } from '../../platform/layout';
import { theme } from '../../theme/tokens';
import { Meeting } from './demo';

export function VehicleBriefing({ meeting }: { meeting: Meeting }) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);
  const [page, setPage] = useState(0);
  const [destination, setDestination] = useState(false);
  const mode = getLayoutMode((frame?.width ?? window.width - insets.left - insets.right) - 32, (frame?.height ?? window.height - insets.top - insets.bottom) - 32);
  const compact = mode === 'short';
  const measure = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFrame(previous => previous?.width === width && previous.height === height ? previous : { width, height });
  };
  const actions:VehicleAction[]=[{label:destination?'브리핑':'장소 확인',icon:destination?'briefing':'next',primary:true,onPress:()=>setDestination(!destination)},...(compact&&!destination&&meeting.briefPages.length>1?[{label:page+1===meeting.briefPages.length?'처음':'다음',icon:'next' as const,onPress:()=>setPage((page+1)%meeting.briefPages.length)}]:[]),{label:'종료',icon:'home',onPress:()=>router.replace('/')}];
  return <SafeAreaView style={ui.safe} edges={['top', 'bottom', 'left', 'right']}>
    <View style={ui.frame} onLayout={measure}>
      <Text style={ui.badge}>체험 모드 · {meeting.time}</Text>
      <Text accessibilityRole="header" style={compact ? ui.compactTitle : ui.title}>{meeting.title}</Text>
      <View style={[ui.content, mode === 'wide' && ui.columns]}>
        <View style={ui.main}>
          {destination ? <><Text style={ui.brief}>{meeting.location}</Text><Text style={ui.secondary}>가상 장소입니다. 실제 길안내는 제공하지 않습니다.</Text></> : <>
            <Text style={compact ? ui.compactBrief : ui.brief}>{compact ? meeting.briefPages[page] : meeting.brief}</Text>
            {compact && <Text style={ui.secondary}>{page + 1} / {meeting.briefPages.length}</Text>}
            {!compact && <Text style={ui.secondary}>샘플 자료 기반 · 실제 AI 분석 결과가 아닙니다</Text>}
          </>}
        </View>
        {mode === 'wide' && !destination && <View style={ui.aside}><Text style={ui.section}>자료 확인</Text>{meeting.evidence.length ? meeting.evidence.map(item => <Text key={item} style={ui.secondary}>{item}</Text>) : <Text style={ui.secondary}>첨부자료 없음</Text>}<Text style={ui.secondary}>{meeting.contact}</Text></View>}
      </View>
      <VehicleActions items={actions} layout="row" maxSize={compact?80:160}/>
    </View>
  </SafeAreaView>;
}
const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  frame: { flex: 1, padding: 16, gap: 12 },
  badge: { color: theme.colors.primary, fontSize: 16, lineHeight: 24 },
  title: { color: theme.colors.textPrimary, fontSize: 28, lineHeight: 38, fontWeight: '600' },
  compactTitle: { color: theme.colors.textPrimary, fontSize: 20, lineHeight: 28, fontWeight: '600' },
  content: { flex: 1, gap: 24, justifyContent: 'center' }, columns: { flexDirection: 'row', alignItems: 'center' },
  main: { flex: 1, gap: 12, justifyContent: 'center' }, aside: { flex: 0.65, gap: 16, padding: 20, borderRadius: 20, backgroundColor: theme.colors.primarySoft },
  brief: { color: theme.colors.textPrimary, fontSize: 26, lineHeight: 40 },
  compactBrief: { color: theme.colors.textPrimary, fontSize: 20, lineHeight: 30 },
  secondary: { color: theme.colors.textSecondary, fontSize: 16, lineHeight: 24 },
  section: { color: theme.colors.textPrimary, fontSize: 22, lineHeight: 31, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 }, grow: { flex: 1, minWidth: 0 },
});
