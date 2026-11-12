import { RemoteDocuments } from '../../features/documents/RemoteDocuments';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Action } from '../../components/Action';
import { Screen } from '../../components/Screen';
import { styles } from '../../components/contentStyles';
import { environment } from '../../config/environment';
import { useMeetings } from '../../features/meetings/context';
import { deleteLocalPdf, pickLocalPdf } from '../../features/documents/files';
import { LocalPdf } from '../../features/documents/model';
export default function Documents() {
  const { meetingId } = useLocalSearchParams<{ meetingId: string }>();
  const { demo, documents, addDocument, removeDocument, getMeeting } = useMeetings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const meeting = getMeeting(meetingId);
  const back = () => router.replace('/');
  if (environment.target === 'pleos') return <Screen title="미팅 자료"><Text style={styles.subtitle}>자료 첨부와 관리는 휴대폰 앱에서 진행해 주세요.</Text><Action label="미팅으로 돌아가기" onPress={back} /></Screen>;
  if (!meeting) return <Screen title="미팅 자료"><Text style={styles.subtitle}>일정을 확인할 수 없습니다.</Text><Action label="일정으로 돌아가기" onPress={back} /></Screen>;
  const selected = documents.filter(document => document.meetingId === meetingId);
  const attach = async () => {
    if (busy) return;
    setBusy(true); setError('');
    let file: LocalPdf | null = null;
    try { file = await pickLocalPdf(); if (file) addDocument(meetingId, file); }
    catch (cause) { if (file) await deleteLocalPdf(file.uri).catch(() => {}); setError(cause instanceof Error ? cause.message : '자료를 첨부하지 못했습니다.'); }
    finally { setBusy(false); }
  };
  return <Screen title="미팅 자료" footer={<Action label="미팅 상세로 돌아가기" secondary onPress={()=>router.replace({pathname:'/meeting/[id]',params:{id:meetingId}})} />}>
    <Text style={{fontSize:18,lineHeight:26,fontWeight:'600',color:'#172640'}}>{meeting.title}</Text>
    <Text style={styles.subtitle}>{demo?'PDF · 파일당 20MB 이하. 체험 첨부는 서버·OpenAI로 전송되지 않습니다.':'PDF · 파일당 20MB 이하. 선택한 파일은 우선 이 기기에 보관됩니다.'}</Text>
    <Action label={busy ? '파일 확인 중…' : 'PDF 첨부'} disabled={busy} onPress={attach} />
    {!!error && <Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text>}
    {!selected.length && <Text style={styles.subtitle}>첨부된 자료가 없어요.</Text>}
    {!demo&&<RemoteDocuments meetingId={meetingId} files={selected} />}
    {demo&&selected.map(document => <View key={document.id} style={styles.card}>
      <Text style={{fontSize:17,lineHeight:24,fontWeight:'600',color:'#172640'}} numberOfLines={2}>{document.name}</Text>
      <Text style={styles.subtitle}>{(document.size / 1024 / 1024).toFixed(2)} MB</Text>
      <Text style={styles.badge}>첨부됨 · 서버 분석 연결 대기</Text>
      <Text style={styles.subtitle}>아직 분석 결과가 없습니다. 실제 PDF 페이지 수·암호화 여부는 서버에서 추가 검사합니다.</Text>
      <Action label="첨부 삭제" secondary disabled={busy} onPress={() => Alert.alert('첨부자료를 삭제할까요?', '앱에 보관한 사본을 삭제합니다. 원본 파일은 유지됩니다.', [{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: () => {
        setBusy(true); void removeDocument(document.id).catch(() => setError('파일 삭제에 실패했습니다. 다시 시도해 주세요.')).finally(() => setBusy(false));
      } }])} />
    </View>)}
  </Screen>;
}
