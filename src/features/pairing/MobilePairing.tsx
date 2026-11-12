import {PairingScanner} from './PairingScanner';
import {useRef,useState} from 'react';
import {Text,TextInput,View} from 'react-native';
import {useAuth} from '../../auth/context';
import {Action} from '../../components/Action';
import {styles} from '../../components/contentStyles';
import {resolvePairing,decidePairing,pairingMessage,PairingPreview} from './api';
export function MobilePairing({initialCode=''}:{initialCode?:string}={}){const {session}=useAuth();const [code,setCode]=useState(/^\d{6}$/.test(initialCode)?initialCode:''),[preview,setPreview]=useState<PairingPreview|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const [scanning,setScanning]=useState(false);const lock=useRef(false);
 async function resolve(value=code){if(lock.current||!session)return;lock.current=true;setBusy(true);setMessage('');try{setPreview(await resolvePairing(value));}catch(e){setMessage(pairingMessage(e));}finally{lock.current=false;setBusy(false);}}
 async function decide(approve:boolean){if(lock.current||!preview)return;lock.current=true;setBusy(true);setMessage('');try{if(Date.parse(preview.expiresAt)<=Date.now())throw new Error();await decidePairing(preview.pairId,approve);setPreview(null);setCode('');setMessage(approve?'차량 연결을 승인했어요. 차량에서 완료를 확인해 주세요.':'차량 연결을 거절했어요.');}catch(e){setPreview(null);setMessage(pairingMessage(e));}finally{lock.current=false;setBusy(false);}}
 return <View style={{gap:12}}><Text style={styles.heading}>차량 연결</Text>{!session?<Text style={styles.subtitle}>로그인 후 차량의 일회용 코드를 입력해 주세요.</Text>:preview?<>
 <Text style={styles.heading}>{preview.deviceName} · {preview.userCode}</Text><Text style={styles.subtitle}>차량에 표시된 코드와 같은지 확인해 주세요. 승인하면 이 차량에서 내 일정과 분석 자료를 최대 7일 동안 조회할 수 있습니다. Google 토큰은 차량에 전달하지 않습니다.</Text>
 <Action label="코드 확인 후 차량 연결 승인" disabled={busy} onPress={()=>{void decide(true);}} /><Action label="연결 거절" secondary disabled={busy} onPress={()=>{void decide(false);}} />
 </>:scanning?<PairingScanner onClose={()=>setScanning(false)} onCode={value=>{setScanning(false);setCode(value);void resolve(value);}} />:<><Action label="차량 QR 스캔" disabled={busy} onPress={()=>setScanning(true)} /><Text style={styles.subtitle}>주차한 차량에서 연결을 시작한 뒤 표시된 QR을 스캔하거나 6자리 숫자를 입력하세요.</Text><TextInput accessibilityLabel="차량 연결 코드" keyboardType="number-pad" autoCorrect={false} maxLength={7} value={code} onChangeText={value=>setCode(value.replace(/\D/g,'').slice(0,6))} placeholder="123456" editable={!busy} style={{borderWidth:1,borderColor:'#747775',borderRadius:12,padding:16,fontSize:20,color:'#1F1F1F',backgroundColor:'#FFFFFF'}} /><Action label={busy?'코드 확인 중…':'차량 코드 확인'} disabled={busy||code.replace(/[ -]/g,'').length!==6} onPress={()=>{void resolve();}} /></>}
 {!!message&&<Text accessibilityLiveRegion="polite" style={styles.subtitle}>{message}</Text>}</View>;
}
