import {useRef,useState} from 'react';
import {Text,View} from 'react-native';
import {environment} from '../../config/environment';
import {useIsFocused} from '@react-navigation/native';
import {Action} from '../../components/Action';
import {styles} from '../../components/contentStyles';
import {parsePairingQr} from './qr';
type Props={onCode:(code:string)=>void;onClose:()=>void};
export function PairingScanner(props:Props){return environment.target==='mobile'?<MobileScanner {...props}/>:null;}
function MobileScanner({onCode,onClose}:Props){
 // Load only when the phone scanner is mounted; the vehicle excludes this native module.
 const {CameraView,useCameraPermissions}=require('expo-camera') as typeof import('expo-camera');
 const [permission,requestPermission]=useCameraPermissions();const [message,setMessage]=useState('');const scanned=useRef(false);const focused=useIsFocused();
 return <View style={{gap:12}}><Text style={styles.subtitle}>차량 화면의 QR을 비춰 주세요. 스캔 후 차량 정보를 확인하고 승인합니다.</Text>{permission?.granted&&focused?<CameraView style={{height:280,width:'100%'}} facing="back" onMountError={()=>setMessage('카메라를 사용할 수 없어요. 숫자 코드를 입력해 주세요.')} barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={({data})=>{if(scanned.current)return;const code=parsePairingQr(data);if(!code){setMessage('프리브 차량 연결 QR을 스캔해 주세요.');return;}scanned.current=true;onCode(code);}} />:<><Text style={styles.subtitle}>QR 스캔에는 카메라 권한이 필요해요. 허용하지 않아도 숫자로 연결할 수 있습니다.</Text>{permission?.canAskAgain&&<Action label="카메라 사용 허용" onPress={()=>{void requestPermission().catch(()=>setMessage('카메라를 사용할 수 없어요. 숫자 코드를 입력해 주세요.'));}} />}</>}{!!message&&<Text accessibilityLiveRegion="polite" style={styles.subtitle}>{message}</Text>}<Action label="숫자 코드로 입력" secondary onPress={onClose} /></View>;
}
