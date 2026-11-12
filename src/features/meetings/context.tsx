import { useAuth } from '../../auth/context';
import { listLiveMeetings } from './remote';
import { environment } from '../../config/environment';
import { Alert } from 'react-native';
import { deleteLocalPdf, initializeDocumentCache } from '../documents/files';
import { AttachedDocument, LocalPdf, validateLocalPdf } from '../documents/model';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { findMeeting, Meeting } from './demo';
import { MeetingNote, normalizeNote, NoteInput, notesReducer } from '../records/model';
type State = {
  liveMeetings:Meeting[];loadingMeetings:boolean;meetingError:string|null;
  refreshMeetings:()=>Promise<void>;rememberMeeting:(meeting:Meeting)=>void;getMeeting:(id:string)=>Meeting|undefined;
  markDocumentUploaded:(id:string,remoteId:string)=>void;
  documents: AttachedDocument[];
  addDocument: (meetingId: string, file: LocalPdf) => void;
  removeDocument: (id: string) => Promise<void>;
  demo: boolean; setDemo: (value: boolean) => void; notes: MeetingNote[];
  saveNote: (meetingId: string, input: NoteInput, noteId?: string) => void;
  deleteNote: (id: string) => void; toggleTask: (id: string) => void;
};
const Context = createContext<State | null>(null);
export function MeetingProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    if (environment.target === 'mobile') void initializeDocumentCache().catch(() => Alert.alert('첨부파일 정리 실패', '지난 체험의 앱 캐시 파일을 정리하지 못했습니다. 자료 첨부에서 다시 시도해 주세요.'));
  }, []);
  const [demo, updateDemo] = useState(false);
  const {session}=useAuth();const userId=session?.userId;
  const [liveMeetings,setLiveMeetings]=useState<Meeting[]>([]),[loadingMeetings,setLoadingMeetings]=useState(false),[meetingError,setMeetingError]=useState<string|null>(null);
  const liveRef=useRef<Meeting[]>([]),revision=useRef(0);
  const refreshMeetings=useCallback(async()=>{
    if(!userId||demo)return;const version=++revision.current;setLoadingMeetings(true);setMeetingError(null);
    try{const result=await listLiveMeetings();if(revision.current===version){liveRef.current=result;setLiveMeetings(result);}}
    catch{if(revision.current===version)setMeetingError('일정을 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.');}
    finally{if(revision.current===version)setLoadingMeetings(false);}
  },[userId,demo]);
  const invalidateMeetings=useCallback(()=>{revision.current++;},[]);
  useEffect(()=>{void refreshMeetings();return invalidateMeetings;},[refreshMeetings,invalidateMeetings]);
  const rememberMeeting=(meeting:Meeting)=>{revision.current++;liveRef.current=[meeting,...liveRef.current.filter(item=>item.id!==meeting.id)];setLiveMeetings(liveRef.current);setLoadingMeetings(false);};
  const [notes, dispatch] = useReducer(notesReducer, []);
  const [documents, updateDocuments] = useState<AttachedDocument[]>([]);
  const documentsRef = useRef<AttachedDocument[]>([]);
  const demoRef = useRef(demo);
  demoRef.current = demo;
  const setDocuments = (next: AttachedDocument[]) => { documentsRef.current = next; updateDocuments(next); };
  const setDemo = (value: boolean) => {
    const previous = documentsRef.current;
    demoRef.current = value;
    dispatch({ type: 'clear' }); setDocuments([]); updateDemo(value);
    void Promise.all(previous.map(document => deleteLocalPdf(document.uri))).catch(() => Alert.alert('첨부파일 정리 실패', '일부 앱 캐시 파일을 정리하지 못했습니다. 원본 파일에는 영향이 없습니다.'));
  };
  const getMeeting=(id:string)=>demoRef.current?findMeeting(id,true):liveRef.current.find(meeting=>meeting.id===id);
  const markDocumentUploaded=(id:string,remoteId:string)=>setDocuments(documentsRef.current.map(document=>document.id===id?{...document,remoteId}:document));
  const addDocument = (meetingId: string, file: LocalPdf) => {
    if (!getMeeting(meetingId)) throw new Error('현재 일정에서만 첨부할 수 있어요.');
    if (documentsRef.current.length >= 20) throw new Error('체험에서는 최대 20개 파일을 첨부할 수 있어요.');
    const validated = validateLocalPdf(file);
    const document: AttachedDocument = { ...validated, id: `document-${Date.now()}-${Math.random().toString(36).slice(2)}`, meetingId, status: 'attached', createdAt: new Date().toISOString() };
    setDocuments([...documentsRef.current, document]);
  };
  const removeDocument = async (id: string) => {
    const document = documentsRef.current.find(item => item.id === id);
    if (!document) throw new Error('첨부자료를 찾을 수 없습니다.');
    await deleteLocalPdf(document.uri);
    setDocuments(documentsRef.current.filter(item => item.id !== id));
  };
  const saveNote = (meetingId: string, input: NoteInput, noteId?: string) => {
    if (!findMeeting(meetingId, demo)) throw new Error('체험 일정에서만 기록을 저장할 수 있어요.');
    const normalized = normalizeNote(input);
    const existing = noteId ? notes.find(note => note.id === noteId && note.meetingId === meetingId) : undefined;
    if (noteId && !existing) throw new Error('수정할 기록을 찾을 수 없습니다.');
    const id = noteId ?? `demo-note-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    dispatch({ type: 'save', note: { id, meetingId, ...normalized, done: existing?.followUp === normalized.followUp ? existing.done : false, updatedAt: new Date().toISOString() } });
  };
  return <Context.Provider value={{ liveMeetings,loadingMeetings,meetingError,refreshMeetings,rememberMeeting,getMeeting,markDocumentUploaded,demo, setDemo, documents, addDocument, removeDocument, notes: demo ? notes : [], saveNote,
    deleteNote: id => dispatch({ type: 'delete', id }), toggleTask: id => dispatch({ type: 'toggle', id }),
  }}>{children}</Context.Provider>;
}
export function useMeetings() {
  const value = useContext(Context);
  if (!value) throw new Error('MeetingProvider missing');
  return value;
}
