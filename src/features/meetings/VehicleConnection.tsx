import QRCode from 'react-native-qrcode-svg';
import {pairingQr} from '../pairing/qr';
import {useCallback,useRef,useState} from 'react';
import {router,useFocusEffect} from 'expo-router';
import {AppState,Text,View} from 'react-native';
import {useAuth} from '../../auth/context';
import {ApiError} from '../../api/client';
import {VehicleActions,VehicleAction} from '../../components/VehicleActions';
import {Screen} from '../../components/Screen';
import {styles} from '../../components/contentStyles';
import {createPairing,pollPairing,cancelPairing,pairingMessage,VehiclePairing} from '../pairing/api';
export function VehicleConnection(){const auth=useAuth();const [request,setRequest]=useState<VehiclePairing|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const lock=useRef(false),mounted=useRef(true),revision=useRef(0);
 useFocusEffect(useCallback(()=>{mounted.current=true;return()=>{mounted.current=false;revision.current++;};},[]));
 useFocusEffect(useCallback(()=>{if(!request||auth.session)return;let active=true,running=false;let timer:ReturnType<typeof setTimeout>|undefined;
  const poll=async()=>{if(!active||running||AppState.currentState!=='active')return;if(Date.parse(request.expiresAt)<=Date.now()){setRequest(null);setMessage('연결 코드가 만료됐어요. 다시 시작해 주세요.');return;}running=true;const version=revision.current;
   try{const session=await pollPairing(request);if(!active||version!==revision.current)return;if(session){setRequest(null);await auth.signIn(session);if(active)router.replace('/');return;}}
   catch(e){if(active&&version===revision.current){if(e instanceof ApiError&&[401,409,410].includes(e.status||0)){setRequest(null);setMessage(pairingMessage(e));return;}setMessage(pairingMessage(e));}}
   finally{running=false;}
   if(active)timer=setTimeout(()=>{void poll();},Math.max(3500,request.intervalSeconds*1000));
  };
  const listener=AppState.addEventListener('change',state=>{clearTimeout(timer);if(state==='active')void poll();});void poll();return()=>{active=false;clearTimeout(timer);listener.remove();};
 },[request,auth.session,auth.signIn]));
 async function start(){if(lock.current)return;lock.current=true;setBusy(true);setMessage('');const version=revision.current;try{const next=await createPairing();if(mounted.current&&version===revision.current)setRequest(next);}catch(e){if(mounted.current)setMessage(pairingMessage(e));}finally{lock.current=false;if(mounted.current)setBusy(false);}}
 async function cancel(){if(!request)return;revision.current++;const current=request;setRequest(null);try{await cancelPairing(current);}catch{setMessage('화면의 요청을 종료했어요. 서버 요청은 최대 5분 후 만료됩니다.');}}
 const actions:VehicleAction[]=[...(auth.session?[{label:'차량 연결 해제',icon:'disconnect' as const,onPress:()=>{void auth.signOut().then(()=>router.replace('/')).catch(()=>setMessage('서버 연결을 확인한 후 다시 시도해 주세요.'));}}]:request?[{label:'연결 요청 취소',icon:'cancel' as const,onPress:()=>{void cancel();}}]:[{label:'주차 중 차량 연결 시작',icon:'connection' as const,primary:true,busy,onPress:()=>{void start();}}]),{label:'미팅 화면으로 돌아가기',icon:'home',onPress:()=>router.replace('/')}];
 return <Screen title="휴대폰으로 차량 연결">{auth.session?<><Text style={styles.heading}>휴대폰 계정과 연결됨</Text><Text style={styles.subtitle}>차량 세션은 최대 7일 유지되며 휴대폰 설정에서 원격 해제할 수 있습니다.</Text></>:request?<>
 <View style={{alignItems:'center',alignSelf:'center',backgroundColor:'#FFFFFF',padding:20,borderRadius:20,gap:16}}><QRCode value={pairingQr(request.userCode)} size={220} quietZone={16} /><Text selectable accessibilityLabel="차량 연결 숫자 코드" style={{fontSize:52,lineHeight:64,fontWeight:'700',letterSpacing:6,color:'#172640'}}>{request.userCode}</Text></View><Text style={styles.subtitle}>로그인한 휴대폰의 설정 → 차량 연결에서 QR을 스캔하거나 숫자를 입력하고, 이 화면의 코드와 같은지 확인한 뒤 승인하세요.</Text><Text style={styles.subtitle}>만료 시각 {new Date(request.expiresAt).toLocaleTimeString('ko-KR')} · 주차 중에만 진행해 주세요.</Text>
 </>:<><Text style={styles.heading}>주차 중 휴대폰에서 승인해 주세요</Text><Text style={styles.subtitle}>이 차량에서 내 일정과 분석 자료를 조회하도록 로그인한 휴대폰에서 승인합니다. Google 로그인은 휴대폰에서만 진행합니다.</Text></>}
 {!!message&&<Text accessibilityLiveRegion="polite" style={styles.subtitle}>{message}</Text>}<VehicleActions items={actions} layout="row" maxSize={220} /></Screen>;
}
