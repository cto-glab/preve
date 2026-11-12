import { VehicleHome } from '../../features/meetings/VehicleHome';
import { router } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { Action } from '../../components/Action';
import { Screen } from '../../components/Screen';
import { styles } from '../../components/contentStyles';
import { environment } from '../../config/environment';
import { useMeetings } from '../../features/meetings/context';
import { findMeeting } from '../../features/meetings/demo';
export default function Records() { return environment.target === 'pleos' ? <VehicleHome /> : <MobileRecords />; }
function MobileRecords() {
  const { demo, notes, deleteNote, toggleTask } = useMeetings();
  return <Screen title="기록">
    {demo && <Text style={styles.badge}>체험 기록 · 체험 종료 또는 앱 재시작 시 삭제</Text>}
    {!notes.length ? <><Text style={styles.heading}>아직 저장된 기록이 없어요</Text><Text style={styles.subtitle}>휴대폰에서 체험 일정의 상세를 열고 미팅 결과를 기록해 보세요.</Text><Action label="일정 보기" secondary onPress={() => router.replace('/')} /></> : notes.map(note => <View key={note.id} style={styles.card}>
      <Text style={styles.heading}>{findMeeting(note.meetingId, demo)?.title ?? '연결된 일정 없음'}</Text>
      <Text style={styles.subtitle}>{new Date(note.updatedAt).toLocaleString('ko-KR')}</Text>
      {!!note.text && <Text style={styles.subtitle}>{note.text}</Text>}
      {!!note.followUp && <><Text style={styles.badge}>{note.done ? '완료' : '할 일'} · {note.followUp}</Text><Action label={note.done ? '미완료로 변경' : '할 일 완료'} secondary onPress={() => toggleTask(note.id)} /></>}
      {environment.target === 'mobile' && <><Action label="기록 수정" secondary onPress={() => router.push({ pathname: '/meeting/note', params: { meetingId: note.meetingId, noteId: note.id } })} />
      <Action label="기록 삭제" secondary onPress={() => Alert.alert('기록을 삭제할까요?', '메모와 후속 할 일이 함께 삭제됩니다.', [{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: () => deleteNote(note.id) }])} /></>}
    </View>)}
  </Screen>;
}
