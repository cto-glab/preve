import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Action } from '../../components/Action';
import { Screen } from '../../components/Screen';
import { styles } from '../../components/contentStyles';
export default function PrivacyNotice() {
  return <Screen title="데이터 처리 안내">
    <View style={styles.card}><Text style={styles.heading}>체험 데이터</Text><Text style={styles.subtitle}>체험 일정·거래처·문서 근거는 가상의 샘플입니다. 입력한 체험 메모와 후속 할 일은 현재 앱 세션에만 보관됩니다. 직접 첨부한 PDF는 실제 파일이며 앱 캐시에 사본을 만듭니다. 체험 종료 시 사본을 삭제하며, 앱 재시작 시 지난 첨부 캐시를 정리합니다. 파일 선택기가 만든 임시 사본은 운영체제의 캐시 정책에 따릅니다.</Text></View>
    <View style={styles.card}><Text style={styles.heading}>일정과 자료</Text><Text style={styles.subtitle}>PDF는 휴대폰에서 첨부·삭제할 수 있습니다. Google 로그인은 계정 식별자를 서비스 계정에 연결합니다. Calendar 읽기 권한과 자료 외부 전송은 로그인과 별도로 동의를 받습니다. 직접 등록한 일정의 자료는 별도 전송 동의 후 서버·OpenAI로 보내 분석할 수 있습니다. 캘린더 연결 버튼에서 별도 동의와 Google 읽기 권한 승인을 받은 뒤 기본 캘린더의 향후 90일 일정 제목·시각·장소·식별자를 프리브 서버로 가져옵니다. 원본 일정은 수정하지 않습니다.</Text></View>
    <View style={styles.card}><Text style={styles.heading}>AI 분석과 대화</Text><Text style={styles.subtitle}>체험 브리핑은 미리 준비한 예시이며 외부 AI에 전송되지 않습니다. 실제 자료는 전송·분석 동의 후 OpenAI로 보냅니다. 서버 원본 삭제와 계정 삭제 화면은 아직 제공하지 않습니다.</Text></View>
    <View style={styles.card}><Text style={styles.heading}>차량과 기록</Text><Text style={styles.subtitle}>현재 체험 기록은 다른 기기와 동기화되지 않습니다. 차량 연결 시 휴대폰 승인과 기기별 연결 해제 기능을 제공합니다.</Text></View>
    <Text style={styles.subtitle}>현재 제공되는 체험 기능에 관한 안내입니다. 실제 계정 서비스의 동의 절차와는 별도입니다.</Text>
    <Action label="설정으로 돌아가기" secondary onPress={() => router.replace('/settings')} />
  </Screen>;
}
