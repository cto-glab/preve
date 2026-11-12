import { useCallback,useMemo,useState,useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator,AppState,Pressable,Text,View,StyleSheet } from 'react-native';
import { Action } from '../../components/Action';
import {theme} from '../../theme/tokens';
import {ApiError} from '../../api/client';
import {DocumentProgress} from './DocumentProgress';
import {documentFailureMessage} from './presentation';
import {displayPdfName} from './file-name';
import { useMeetings } from '../meetings/context';
import { documentsApi } from './api';
import { AttachedDocument } from './model';
import { RemoteDocument } from './remote';

export function RemoteDocuments({meetingId,files}:{meetingId:string;files:AttachedDocument[]}){
 const {markDocumentUploaded,removeDocument}=useMeetings();
 const [items,setItems]=useState<RemoteDocument[]>([]),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reload,setReload]=useState(0),[fetching,setFetching]=useState(true);
 const [activeUpload,setActiveUpload]=useState('');const action=useRef(false);
 const query=useMemo(()=>({meetingId,revision:reload}),[meetingId,reload]);
 useFocusEffect(useCallback(()=>{
  let active=true,running=false;let timer:ReturnType<typeof setTimeout>|undefined;
  const poll=async()=>{
   if(!active||running||AppState.currentState==='background'||AppState.currentState==='inactive')return;
   running=true;setFetching(true);
   try{const result=await documentsApi.list(query.meetingId);if(active){setItems(result);setError('');if(result.some(item=>item.status==='queued'||item.status==='processing'))timer=setTimeout(()=>{void poll();},3000);}}
   catch{if(active)setError('분석 결과를 불러오지 못했습니다. 새로고침해 주세요.');}
   finally{running=false;if(active)setFetching(false);}
  };
  const listener=AppState.addEventListener('change',state=>{clearTimeout(timer);if(state==='active')void poll();});
  void poll();return()=>{active=false;clearTimeout(timer);listener.remove();};
 },[query]));
 const refresh=()=>setReload(value=>value+1);
 return <View style={{gap:16}}>
  <Text style={styles.subtitle}>분석을 요청하면 PDF 원본이 우리 서버에 저장되고 OpenAI로 전송됩니다. 자동 전송되지 않으며, 분석 결과는 AI 추출 자료이므로 원문을 확인해 주세요.</Text>
  <Pressable accessibilityRole="checkbox" accessibilityLabel="PDF의 OpenAI 전송 및 분석 동의" accessibilityState={{checked:consent}} onPress={()=>setConsent(!consent)} style={{minHeight:48,justifyContent:'center'}}><Text style={styles.subtitle}>{consent?'☑':'☐'} 선택한 PDF의 OpenAI 전송·분석에 동의합니다</Text></Pressable>
  {!!error&&<Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text>}
  {files.filter(file=>!file.remoteId).map(file=><View key={file.id} style={styles.card}><Text selectable numberOfLines={2} style={styles.heading}>{displayPdfName(file.name)}</Text><Text style={styles.subtitle}>이 기기에 첨부됨 · 아직 전송하지 않았어요</Text>{activeUpload===file.id&&<View style={{flexDirection:'row',alignItems:'center',gap:8}}><ActivityIndicator color={theme.colors.primary}/><Text style={styles.subtitle}>PDF를 서버에 전송하고 있어요…</Text></View>}<Action label={activeUpload===file.id?'PDF 전송 중…':'서버에 보내 분석하기'} disabled={!consent||busy} onPress={async()=>{if(!consent||action.current)return;action.current=true;setBusy(true);setActiveUpload(file.id);setError('');try{const result=await documentsApi.upload(meetingId,file,file.id,true);markDocumentUploaded(file.id,result.documentId);refresh();}catch(e){setError(e instanceof ApiError&&e.serverCode?documentFailureMessage(e.serverCode):'업로드하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');}finally{action.current=false;setActiveUpload('');setBusy(false);}}} /><Action label="첨부 취소" secondary disabled={busy} onPress={async()=>{if(busy)return;setBusy(true);try{await removeDocument(file.id);}catch{setError('첨부 사본을 정리하지 못했습니다. 다시 시도해 주세요.');}finally{setBusy(false);}}} /></View>)}
  <Action label="분석 상태 새로고침" secondary disabled={busy} onPress={refresh} />
  {fetching&&!items.length&&<Text style={styles.subtitle}>분석 상태를 확인하고 있어요…</Text>}
  {!fetching&&!items.length&&!error&&<Text style={styles.subtitle}>서버에 저장된 자료가 없습니다.</Text>}
  {items.map(document=><View key={document.documentId} style={styles.card}>
   <Text selectable numberOfLines={2} style={styles.heading}>{displayPdfName(document.fileName)}</Text><Text style={styles.subtitle}>{document.pageCount}쪽 · {(document.size/1024/1024).toFixed(2)} MB</Text><DocumentProgress document={document}/>
   {document.status==='failed'&&<><Text style={styles.subtitle}>{documentFailureMessage(document.error)}</Text>{!!document.error&&<Text style={styles.caption}>오류 코드: {document.error}</Text>}<Action label="분석 재시도" secondary disabled={!consent||busy} onPress={async()=>{if(!consent||action.current)return;action.current=true;setBusy(true);try{await documentsApi.retry(document.documentId,true);refresh();}catch(e){setError(e instanceof ApiError&&e.serverCode?documentFailureMessage(e.serverCode):'재시도하지 못했습니다. 연결 상태를 확인해 주세요.');}finally{action.current=false;setBusy(false);}}} /></>}
   {document.analysis&&<><Text style={styles.heading}>{document.analysis.summary}</Text><Text style={styles.subtitle}>AI 추출 · 원문 확인 필요</Text>{document.analysis.facts.map((fact,index)=><View key={index} style={{gap:8}}><Text style={styles.subtitle}>{fact.text}</Text><Text style={styles.badge}>{document.fileName} · {fact.page}쪽</Text><Text style={styles.subtitle}>“{fact.quote}”</Text></View>)}{document.analysis.openQuestions.length>0&&<Text style={styles.heading}>확인할 질문</Text>}{document.analysis.openQuestions.slice(0,2).map(question=><Text key={question} style={styles.subtitle}>{question}</Text>)}{document.analysis.warnings.map(warning=><Text key={warning} style={styles.subtitle}>{warning}</Text>)}</>}
  </View>)}
 </View>;
}

const styles=StyleSheet.create({card:{padding:16,borderRadius:16,borderWidth:1,borderColor:theme.colors.border,gap:12},heading:{fontSize:17,lineHeight:24,fontWeight:'600',color:theme.colors.textPrimary},subtitle:{fontSize:14,lineHeight:21,color:theme.colors.textSecondary},badge:{fontSize:13,lineHeight:19,color:theme.colors.primary},caption:{fontSize:12,lineHeight:18,color:theme.colors.textSecondary}});
