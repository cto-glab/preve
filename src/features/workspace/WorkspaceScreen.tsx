import { useCalendar } from '../calendar/context';
import { CalendarOnboarding } from '../calendar/CalendarOnboarding';
import { useAuth } from '../../auth/context';
import { LiveMeetings } from '../meetings/LiveMeetings';
import { MobileAccount } from '../auth/MobileAccount';
import { environment } from '../../config/environment';
import { VehicleHome } from '../meetings/VehicleHome';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Action } from '../../components/Action';
import { Screen } from '../../components/Screen';
import { demoMeetings } from '../meetings/demo';
import { useMeetings } from '../meetings/context';
import { styles } from '../../components/contentStyles';
export function WorkspaceScreen() {
 return environment.target === 'pleos' ? <VehicleHome /> : <MobileWorkspace />;
}
function MobileWorkspace() {
 const { demo, setDemo } = useMeetings();
 const {session}=useAuth();
 const calendar=useCalendar();
 if(session&&!demo&&!calendar.ready)return <Screen title="일정"><Text style={styles.subtitle}>캘린더 연결 확인 중…</Text></Screen>;
 if(session&&!demo&&calendar.needsOnboarding)return <CalendarOnboarding />;
 if(session&&!demo)return <LiveMeetings />;
 return <Screen title="일정"><Text style={styles.subtitle}>{demo ? '체험 모드 · 가상의 일정과 자료입니다.' : '오늘의 미팅을 준비해 보세요.'}</Text>
 {demo ? <><Action label="체험 종료" secondary onPress={() => setDemo(false)} />{demoMeetings.map((meeting, index) => <View key={meeting.id} style={styles.card}><Text style={styles.badge}>{index === 0 ? '다음 미팅' : '이후 일정'} · {meeting.time}</Text><Text style={styles.heading}>{meeting.title}</Text><Text style={styles.subtitle}>{meeting.company} · {meeting.contact}</Text><Text style={styles.subtitle}>{meeting.location}</Text><Action label="미팅 준비하기" onPress={() => router.push({ pathname: '/meeting/[id]', params: { id: meeting.id } })} /></View>)}</> : <View style={styles.card}><Text style={styles.heading}>캘린더를 연결해 주세요</Text><Text style={styles.subtitle}>Google로 로그인한 뒤 Calendar를 별도로 연결하면 미팅을 불러올 수 있어요.</Text><MobileAccount /><Action label="샘플 일정 체험하기" onPress={() => setDemo(true)} /></View>}
 </Screen>;
}
