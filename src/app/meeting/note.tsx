import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Action } from '../../components/Action';
import { Screen } from '../../components/Screen';
import { styles } from '../../components/contentStyles';
import { environment } from '../../config/environment';
import { theme } from '../../theme/tokens';
import { useMeetings } from '../../features/meetings/context';
import { findMeeting } from '../../features/meetings/demo';
import { normalizeNote, NoteInput } from '../../features/records/model';
export default function NoteEditor() {
  const { meetingId, noteId } = useLocalSearchParams<{ meetingId: string; noteId?: string }>();
  const { demo, notes, saveNote } = useMeetings();
  const meeting = findMeeting(meetingId, demo);
  const existing = notes.find(note => note.id === noteId && note.meetingId === meetingId);
  const [text, setText] = useState(existing?.text ?? '');
  const [followUp, setFollowUp] = useState(existing?.followUp ?? '');
  const [preview, setPreview] = useState<NoteInput | null>(null);
  const [error, setError] = useState('');
  const back = () => router.replace('/records');
  if (environment.target === 'pleos') return <Screen title="미팅 기록"><Text style={styles.subtitle}>기록 입력과 수정은 휴대폰 앱에서 진행해 주세요. 차량 음성 기록은 SDK 연동 후 제공됩니다.</Text><Action label="기록으로 돌아가기" onPress={back} /></Screen>;
  if (!meeting || (noteId && !existing)) return <Screen title="미팅 기록"><Text style={styles.subtitle}>일정 또는 기록을 확인할 수 없습니다.</Text><Action label="기록으로 돌아가기" onPress={back} /></Screen>;
  return <Screen title={noteId ? '기록 수정' : '미팅 결과 기록'}>
    <Text style={styles.badge}>체험 모드 · 종료하면 입력한 기록이 삭제됩니다</Text>
    <Text style={styles.heading}>{meeting.title}</Text>
    {preview ? <View style={styles.card}><Text style={styles.heading}>저장 전 확인</Text><Text style={styles.subtitle}>{preview.text || '메모 없음'}</Text><Text style={styles.subtitle}>후속 할 일: {preview.followUp || '없음'}</Text>
      <Action label="확인하고 저장" onPress={() => { try { saveNote(meetingId, preview, noteId); back(); } catch (cause) { setError(cause instanceof Error ? cause.message : '저장하지 못했습니다.'); } }} />
      <Action label="다시 편집" secondary onPress={() => setPreview(null)} />
    </View> : <>
      <Text nativeID="note-label" style={styles.subtitle}>미팅 메모</Text>
      <TextInput accessibilityLabel="미팅 메모" value={text} onChangeText={setText} multiline maxLength={2000} textAlignVertical="top" placeholder="확인한 내용과 다음에 참고할 내용을 입력하세요" style={inputStyles.memo} />
      <Text style={styles.subtitle}>{text.length} / 2,000자</Text>
      <Text style={styles.subtitle}>후속 할 일</Text>
      <TextInput accessibilityLabel="후속 할 일" value={followUp} onChangeText={setFollowUp} multiline maxLength={300} placeholder="예: 금요일까지 납기 기준 확인" style={inputStyles.field} />
      <Action label="저장할 내용 확인" onPress={() => { try { setPreview(normalizeNote({ text, followUp })); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : '입력 내용을 확인해 주세요.'); } }} />
    </>}
    {!!error && <Text accessibilityRole="alert" style={inputStyles.error}>{error}</Text>}
    <Action label="취소" secondary onPress={back} />
  </Screen>;
}
const inputStyles = StyleSheet.create({ field: { minHeight: 64, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 16, color: theme.colors.textPrimary, fontSize: 16 }, memo: { minHeight: 160, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 16, color: theme.colors.textPrimary, fontSize: 16 }, error: { color: theme.colors.error, fontSize: 16 } });
