import {MeetingContact} from '../../features/contacts/MeetingContact';
import {VehicleAnalysisBriefing} from '../../features/meetings/VehicleAnalysisBriefing';
import { VehicleBriefing } from '../../features/meetings/VehicleBriefing';
import { environment } from '../../config/environment';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Action } from '../../components/Action';
import { Screen } from '../../components/Screen';
import { useMeetings } from '../../features/meetings/context';
import { styles } from '../../components/contentStyles';
export default function MeetingDetail() {
 const { id } = useLocalSearchParams<{ id: string }>(); const { demo, documents, getMeeting } = useMeetings(); const meeting = getMeeting(id);
 if (meeting && environment.target === 'pleos'&&!demo)return <VehicleAnalysisBriefing key={meeting.id} meeting={meeting} />;
 if (meeting && environment.target === 'pleos') return <VehicleBriefing key={meeting.id} meeting={meeting} />;
 return <Screen title="미팅 준비"><Action label="일정으로 돌아가기" secondary onPress={() => router.replace('/')} />
 {!meeting ? <Text style={styles.subtitle}>일정을 확인할 수 없습니다. 일정에서 다시 선택해 주세요.</Text> : <><Text style={styles.badge}>{demo?'체험 모드 · 실제 AI 분석 결과가 아닙니다':'내 계정의 일정'}</Text><View style={styles.card}><Text style={styles.heading}>{meeting.title}</Text><Text style={styles.subtitle}>{meeting.time} · {meeting.company}</Text><Text style={styles.subtitle}>{meeting.location}</Text></View><Action label="자료 첨부·관리" onPress={() => router.push({ pathname: '/meeting/documents', params: { meetingId: meeting.id } })} />{!demo ? <Text style={styles.subtitle}>자료 첨부·관리에서 분석 결과와 근거를 확인해 주세요.</Text> : documents.some(document => document.meetingId === meeting.id) ? <Text style={styles.subtitle}>첨부된 파일은 아직 분석되지 않았습니다. 분석 완료 후 브리핑을 확인할 수 있어요.</Text> : <View style={styles.card}><Text style={styles.heading}>샘플 브리핑</Text><Text style={styles.heading}>{meeting.brief}</Text>{meeting.evidence.map(item => <Text key={item} style={styles.subtitle}>{item}</Text>)}</View>}{!demo?<MeetingContact meetingId={meeting.id}/>:<View style={styles.card}><Text style={styles.heading}>담당자 · {meeting.contact}</Text><Text style={styles.subtitle}>확인된 소통 선호가 없습니다.</Text></View>}{environment.target === 'mobile' && demo && <Action label="미팅 결과 기록" onPress={() => router.push({ pathname: '/meeting/note', params: { meetingId: meeting.id } })} />}<Text style={styles.subtitle}>자료 화면에서 PDF를 첨부하고 분석 결과를 확인하세요. 음성·길안내 연결은 준비 중입니다.</Text></>}
 </Screen>;
}
