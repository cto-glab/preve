# 프리브 설치 APK

- `gaonlab_preve-pleos_release.apk`: Pleos Connect 차량용, `com.jb8.preve.pleos`
- `gaonlab_preve-mobile_release.apk`: Android 휴대폰용, `com.jb8.preve.mobile`

두 파일은 개발 서버나 Expo Go 없이 설치·실행할 수 있는 서명된 release APK입니다. ARM64와 x86_64를 포함합니다. 휴대폰과 차량 앱은 별도 패키지이므로 각 환경에 맞는 파일을 설치하세요.
계정 로그인·캘린더·PDF 분석·음성 대화는 배포된 프리브 서버와 인터넷 연결이 필요합니다. 차량 앱은 Pleos Connect 환경에서 실행합니다.

파일 해시는 SHA256SUMS.txt, 실제 설치·실행 확인 범위와 빌드 소스 커밋은 verification.json을 확인하세요. APK를 수정하거나 다시 빌드하면 해시와 검증 기록도 갱신해야 합니다.

실제 설치·메인 화면 실행 확인 범위는 verification.json에 기록했습니다. 전체 기능 검증과 실제 차량 하드웨어 검증은 별도로 구분합니다.
