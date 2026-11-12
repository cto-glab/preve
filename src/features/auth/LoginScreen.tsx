import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../../auth/context';
import { beginGoogleLogin, finishGoogleLogin, clearGoogleCredentialState, canGoogleSignIn, googleLoginMessage, PendingGoogleLogin } from '../../auth/google';
import { GoogleButton } from './GoogleButton';
import { Action } from '../../components/Action';
import { Screen } from '../../components/Screen';
import { styles } from '../../components/contentStyles';
export function LoginScreen() {
 const auth=useAuth(); const [pending,setPending]=useState<PendingGoogleLogin|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''); const lock=useRef(false);
 async function start(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{if(!canGoogleSignIn())throw new Error('설정 누락');setPending(await beginGoogleLogin());}catch(e){setError(googleLoginMessage(e));}finally{lock.current=false;setBusy(false);}}
 async function accept(){if(lock.current||!pending)return;lock.current=true;setBusy(true);setError('');try{await auth.signIn(await finishGoogleLogin(pending));setPending(null);}catch{setPending(null);setError('로그인을 완료하지 못했어요. 연결을 확인하고 다시 시작해 주세요.');}finally{lock.current=false;setBusy(false);}}
 async function cancel(){if(lock.current)return;setPending(null);setError('');await clearGoogleCredentialState().catch(()=>{});}
 if(pending)return <Screen title="프리브 이용 동의">
  <Text style={styles.subtitle}>Google 계정을 확인했어요. 아래 내용을 확인하고 동의하면 프리브 계정 연결이 완료됩니다.</Text>
  <View style={styles.card}><Text style={styles.heading}>서비스 이용 안내 · 필수</Text><Text style={styles.subtitle}>프리브는 미팅 일정과 자료를 정리하는 서비스입니다. 입력·분석 결과는 직접 확인해 사용해 주세요. 다른 사람의 권리를 침해하는 자료는 등록할 수 없습니다.</Text></View>
  <View style={styles.card}><Text style={styles.heading}>개인정보 수집·이용 · 필수</Text><Text style={styles.subtitle}>계정 식별과 로그인 유지를 위해 Google 계정 식별자, 기기 이름, 로그인·동의 정보를 처리합니다. 서비스 계정 정보는 서비스 이용 기간 동안 보관합니다. 계정 삭제는 지원 이메일 jhl10251@gmail.com으로 요청할 수 있습니다. 동의를 거부할 수 있으며 거부하면 계정 서비스에 진입하지 않습니다.</Text></View>
  <Text style={styles.subtitle}>캘린더 일정 읽기와 PDF의 OpenAI 전송·분석은 여기에 포함되지 않으며 해당 기능을 사용할 때 별도로 동의를 받습니다.</Text>
  {!!error&&<Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text>}
  <Action label={busy?'계정 연결 중…':'필수 항목에 동의하고 시작하기'} disabled={busy} onPress={()=>{void accept();}} />
  <Action label="동의하지 않고 돌아가기" disabled={busy} secondary onPress={()=>{void cancel();}} />
 </Screen>;
 return <Screen title="프리브"><View style={{flex:1,justifyContent:'center',gap:24,paddingVertical:48}}>
  <Text style={styles.heading}>미팅 전 준비를 한곳에서</Text><Text style={styles.subtitle}>일정과 자료를 연결하고, 다음 미팅을 준비하세요.</Text>
  <GoogleButton disabled={busy||!auth.ready} busy={busy} onPress={()=>{void start();}} />
  {!auth.ready&&<Text style={styles.subtitle}>저장된 계정을 확인하고 있어요.</Text>}
  {!!error&&<Text accessibilityRole="alert" style={styles.subtitle}>{error}</Text>}
  <Text style={styles.subtitle}>Google 계정을 선택한 뒤 프리브 이용 동의를 진행합니다.</Text>
 </View></Screen>;
}
