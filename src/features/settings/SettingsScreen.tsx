import {MobilePairing} from '../pairing/MobilePairing';
import {ConnectedDevices} from '../pairing/ConnectedDevices';
import { CalendarConnection } from '../calendar/CalendarConnection';
import { MobileAccount } from '../auth/MobileAccount';
import { VehicleConnection } from '../meetings/VehicleConnection';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { api } from '../../api';
import { useAuth } from '../../auth/context';
import { Action } from '../../components/Action';
import { Screen } from '../../components/Screen';
import { styles } from '../../components/contentStyles';
import { environment } from '../../config/environment';
import { useMeetings } from '../meetings/context';
import { connectionMessage, verifyHealth } from './connection';
export function SettingsScreen() { return environment.target === 'pleos' ? <VehicleConnection /> : <MobileSettings />; }
function MobileSettings() {
  const auth = useAuth();
  const { demo, setDemo } = useMeetings();
  const [checking, setChecking] = useState(false);
  const [connection, setConnection] = useState('아직 확인하지 않았어요.');
  const checkServer = async () => {
    if (checking) return;
    setChecking(true);
    try { verifyHealth(await api.request<unknown>('/health')); setConnection('서버가 응답하고 있어요. 계정·일정 연결은 별도로 확인해야 합니다.'); }
    catch (error) { setConnection(connectionMessage(error)); }
    finally { setChecking(false); }
  };
  return <Screen title="설정">
    <View style={styles.card}><Text style={styles.heading}>계정</Text>
      <Text style={styles.subtitle}>{!auth.ready ? '계정 확인 중' : auth.session ? '저장된 계정 있음' : '연결된 계정 없음'}</Text>
      {auth.error && <Text accessibilityRole="alert" style={styles.subtitle}>{auth.error}</Text>}
      <MobileAccount />
      {auth.session && <Action label="로그아웃" secondary onPress={() => { void auth.signOut().then(() => setDemo(false)).catch(() => Alert.alert('로그아웃 실패', '잠시 후 다시 시도해 주세요.')); }} />}
    </View>
    <View style={styles.card}><MobilePairing />{auth.session&&<ConnectedDevices />}</View>
    <View style={styles.card}><Text style={styles.heading}>Google Calendar</Text><CalendarConnection /></View>
    <View style={styles.card}><Text style={styles.heading}>서비스 연결</Text><Text accessibilityLiveRegion="polite" style={styles.subtitle}>{connection}</Text>
      <Action label={checking ? '응답 확인 중…' : '서버 응답 확인'} disabled={checking} secondary onPress={checkServer} />
    </View>
    <View style={styles.card}><Text style={styles.heading}>데이터 관리</Text>
      <Action label="데이터 처리 안내" secondary onPress={() => router.push('/settings/privacy')} />
      {demo && <Action label="체험 종료 및 기록 삭제" secondary onPress={() => Alert.alert('체험을 종료할까요?', '입력한 체험 메모와 후속 할 일이 삭제됩니다.', [{ text: '취소', style: 'cancel' }, { text: '종료', style: 'destructive', onPress: () => setDemo(false) }])} />}
    </View>
  </Screen>;
}
