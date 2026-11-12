import {router,useLocalSearchParams} from 'expo-router';
import {Text} from 'react-native';
import {Screen} from '../components/Screen';
import {Action} from '../components/Action';
import {styles} from '../components/contentStyles';
import {MobilePairing} from '../features/pairing/MobilePairing';
import {useAuth} from '../auth/context';
import {environment} from '../config/environment';
export default function Pair(){const {code}=useLocalSearchParams<{code?:string}>();const {session}=useAuth();return <Screen title="차량 연결">{environment.target==='mobile'&&session?<MobilePairing initialCode={typeof code==='string'?code:''} />:<Text style={styles.subtitle}>휴대폰 앱에서 로그인한 뒤 설정 → 차량 연결에서 QR을 스캔해 주세요.</Text>}<Action label="홈으로" secondary onPress={()=>router.replace('/')} /></Screen>;}
