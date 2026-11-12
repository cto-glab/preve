import { useCalendar } from '../calendar/context';
import { CalendarConnection } from '../calendar/CalendarConnection';
import { router } from 'expo-router';
import { Text,View } from 'react-native';
import { useMeetings } from './context';
import { Screen } from '../../components/Screen';
import { Action } from '../../components/Action';
import { styles } from '../../components/contentStyles';
export function LiveMeetings(){const {liveMeetings,loadingMeetings,meetingError,setDemo}=useMeetings();const calendar=useCalendar();return <Screen title="일정">
 <Text style={styles.subtitle}>직접 등록한 일정과 Google 캘린더 일정을 확인하세요.</Text>
 <CalendarConnection />
 <Action label="일정 직접 등록" onPress={()=>router.push('/meeting/create')} />
 <Action label={calendar.busy||loadingMeetings?'일정 최신화 중…':'새로고침'} secondary disabled={calendar.busy||loadingMeetings||!calendar.ready} onPress={()=>{void calendar.refresh();}} />
 {!!meetingError&&<Text accessibilityRole="alert" style={styles.subtitle}>{meetingError}</Text>}
 {!loadingMeetings&&!meetingError&&!liveMeetings.length&&<Text style={styles.subtitle}>등록된 일정이 없어요.</Text>}
 {liveMeetings.map(meeting=><View key={meeting.id} style={styles.card}><Text style={styles.badge}>{meeting.source==='google'?'Google Calendar':'직접 등록'} · {meeting.time}</Text><Text style={styles.heading}>{meeting.title}</Text><Text style={styles.subtitle}>{meeting.location}</Text><Action label="미팅 준비하기" onPress={()=>router.push({pathname:'/meeting/[id]',params:{id:meeting.id}})} /></View>)}
 <Action label="샘플 일정 체험하기" secondary onPress={()=>setDemo(true)} />
 </Screen>;}
