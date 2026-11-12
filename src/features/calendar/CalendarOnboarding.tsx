import { Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { Action } from '../../components/Action';
import { styles } from '../../components/contentStyles';
import { CalendarConnection } from './CalendarConnection';
import { useCalendar } from './context';
export function CalendarOnboarding(){const calendar=useCalendar();return <Screen title="Google 일정 불러오기">
 <Text style={styles.heading}>일정까지 연결하면 준비 끝</Text><Text style={styles.subtitle}>프리브 로그인이 완료됐어요. Google 캘린더를 연결해 예정된 미팅을 불러오세요.</Text>
 <CalendarConnection onboarding />
 <Action label="나중에 하기" secondary disabled={calendar.busy} onPress={()=>{void calendar.skip();}} />
 <Text style={styles.subtitle}>지금 건너뛰어도 일정 화면이나 설정에서 연결할 수 있어요.</Text>
 </Screen>;}
