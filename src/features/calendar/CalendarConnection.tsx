import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '../../auth/context';
import { useCalendar } from './context';
import { Action } from '../../components/Action';
import { styles } from '../../components/contentStyles';
export function CalendarConnection({onboarding=false}:{onboarding?:boolean}) {
 const {session}=useAuth();const calendar=useCalendar();const [notice,setNotice]=useState(onboarding);
 return <View style={{gap:12}}>
 {calendar.connected?<Text style={styles.subtitle}>Google 캘린더 연결됨 · 새로고침을 누르면 Google의 최신 일정을 가져옵니다.</Text>:<>
 <Text style={styles.subtitle}>Google 일정을 불러오면 바로 미팅 준비를 시작할 수 있어요. 기본 캘린더의 향후 90일 일정 최대 100개를 가져옵니다.</Text>
 {session?<>{!notice?<Action label="Google 일정 불러오기" secondary disabled={!calendar.ready||calendar.busy} onPress={()=>setNotice(true)} />:<>
 <Text style={styles.subtitle}>일정 읽기 권한을 승인하면 일정 제목·시각·장소·식별자를 프리브 서버에 저장합니다. 원본 일정은 수정하지 않습니다. 가져온 일정은 서비스 이용 기간 동안 보관하며 삭제는 지원 이메일로 요청할 수 있습니다. PDF·AI 분석 동의는 별도입니다.</Text>
 <Action label={calendar.busy?'일정 불러오는 중…':'동의하고 Google 일정 불러오기'} disabled={calendar.busy||!calendar.ready} onPress={()=>{void calendar.connect();}} />
 {!onboarding&&<Action label="취소" secondary disabled={calendar.busy} onPress={()=>setNotice(false)} />}
 </>}</>:<Text style={styles.subtitle}>로그인 후 캘린더를 연결할 수 있어요.</Text>}
 </>}
 {!!calendar.message&&<Text accessibilityLiveRegion="polite" style={styles.subtitle}>{calendar.message}</Text>}
 </View>;
}
