import {useState} from 'react';
import {Alert,Text,View} from 'react-native';
import {api} from '../../api';
import {Action} from '../../components/Action';
import {styles} from '../../components/contentStyles';
type Device={sessionId:string;target:'mobile'|'pleos';deviceName:string};
export function ConnectedDevices(){const [devices,setDevices]=useState<Device[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function load(){if(busy)return;setBusy(true);try{const r=await api.request<{sessions:Device[]}>('/v1/auth/sessions');if(!Array.isArray(r.sessions))throw new Error();setDevices(r.sessions.filter(d=>d.target==='pleos'));setMessage(r.sessions.some(d=>d.target==='pleos')?'':'연결된 차량이 없습니다.');}catch{setMessage('연결 기기를 확인하지 못했어요.');}finally{setBusy(false);}}
 async function revoke(id:string){setBusy(true);try{await api.request('/v1/auth/sessions/'+id,{method:'DELETE'});setDevices(list=>list.filter(item=>item.sessionId!==id));setMessage('차량 연결을 해제했어요.');}catch{setMessage('연결 해제를 완료하지 못했어요.');}finally{setBusy(false);}}
 return <View style={{gap:12}}><Action label="연결된 차량 확인" secondary disabled={busy} onPress={()=>{void load();}} />{devices.map(d=><View key={d.sessionId}><Text style={styles.subtitle}>{d.deviceName}</Text><Action label="차량 연결 해제" secondary disabled={busy} onPress={()=>Alert.alert('차량 연결을 해제할까요?','해당 차량에서 일정과 분석 결과를 더 이상 불러올 수 없습니다.',[{text:'취소',style:'cancel'},{text:'연결 해제',style:'destructive',onPress:()=>{void revoke(d.sessionId);}}])} /></View>)}{!!message&&<Text style={styles.subtitle}>{message}</Text>}</View>;
}
