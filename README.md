# 프리브 (preve)

**휴대폰에서 일정과 PDF 자료를 준비하고, 차량에서 미팅 정보를 확인하며 음성으로 질문하는 미팅 준비 앱입니다.**

현대자동차그룹 차량용 앱 개발 공모전용 프로젝트입니다. 하나의 Expo·React Native·TypeScript 코드에서 모바일과 Pleos Connect 차량 앱을 별도로 빌드합니다.

## APK 파일 위치

저장소 루트의 **`apk/` 폴더**에 최종 설치용 APK를 제공합니다. Expo Go나 개발 서버 없이 설치·실행하는 서명된 release APK입니다.

| 대상               | 설치 APK                                                                     | 패키지명               |
| ------------------ | ---------------------------------------------------------------------------- | ---------------------- |
| Pleos Connect 차량 | [apk/gaonlab_preve-pleos_release.apk](apk/gaonlab_preve-pleos_release.apk)   | `com.jb8.preve.pleos`  |
| Android 휴대폰     | [apk/gaonlab_preve-mobile_release.apk](apk/gaonlab_preve-mobile_release.apk) | `com.jb8.preve.mobile` |

두 APK 모두 ARM64(`arm64-v8a`)와 에뮬레이터용 `x86_64`를 포함합니다. 앱 표시 이름은 모두 **프리브**, 버전은 `0.1.0`입니다. 위 저장소의 APK 파일을 다운로드해 설치합니다.

[설치 검증 기록](apk/verification.json) · [SHA-256 해시](apk/SHA256SUMS.txt) · [APK 안내](apk/README.md)

## 실행 방법

### 설치 APK로 실행

1. 휴대폰에 `gaonlab_preve-mobile_release.apk`를 설치하고 **프리브**를 실행합니다. APK 설치 시 Android에서 요청하는 출처 설치 허용 설정이 필요할 수 있습니다.
2. Google 로그인 → 필수 약관 동의 → Google 캘린더 연결 안내를 진행합니다. 캘린더를 연결하지 않아도 일정을 직접 등록할 수 있습니다.
3. 휴대폰에서 일정·거래처를 등록하고, 미팅에 PDF를 첨부해 분석에 동의합니다. 분석 완료 후 요약·페이지별 근거·확인 질문을 조회합니다.
4. Pleos Connect 기기 또는 에뮬레이터에 `gaonlab_preve-pleos_release.apk`를 설치합니다. 차량 앱에서 연결 QR/6자리 코드를 생성하고 휴대폰 설정 → 차량 연결에서 확인·승인합니다.
5. 차량의 내 미팅·캘린더에서 일정을 확인합니다. **프리브와 대화 → 말하기**를 누르면 음성 전송 안내·마이크 권한 확인 후 질문할 수 있습니다.
6. “오늘 일정 알려줘”, “다음 미팅 자료 요약해 줘”, “납기는?”, “출처 알려줘” 등을 물어보세요. 발화가 끝나면 자동으로 전송하며, 답변 후 다시 듣습니다. “대화 끝” 또는 **대화 중지**로 종료합니다.

Android SDK의 ADB로도 설치할 수 있습니다. `<기기ID>`는 `adb devices`에서 확인합니다.

```sh
adb devices
adb -s <휴대폰_기기ID> install -r apk/gaonlab_preve-mobile_release.apk
adb -s <차량_기기ID> shell am get-current-user
adb -s <차량_기기ID> install -r --user <위에서_확인한_사용자ID> apk/gaonlab_preve-pleos_release.apk
```

검증한 Pleos 에뮬레이터의 운전자 프로필은 사용자 `10`입니다. 휴대폰과 차량 APK는 서로 다른 패키지이므로 대상 환경에 맞게 설치하세요. `-r` 업데이트 설치는 기존 앱 데이터를 유지합니다.

### 소스에서 개발 실행

Node.js 22 LTS, JDK 17, Android SDK 및 Android 빌드 환경이 필요합니다. `.env.example`을 참고해 루트 `.env`에 공개 설정을 넣습니다.

```env
EXPO_PUBLIC_API_BASE_URL=https://YOUR_API_HOST
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<서버와 동일한 Google 웹 OAuth Client ID>
```

```sh
npm ci
npm run check
npm run android          # 휴대폰 대상
npm run android:pleos    # Pleos 대상
```

네이티브 Google 로그인·녹음·재생 모듈이 있어 Expo Go로는 전체 기능을 실행할 수 없습니다. 생성되는 `android/`는 빌드 대상에 따라 달라집니다. 모바일↔차량 대상을 전환해 재생성할 때 기존 서명 키를 보존해야 합니다. 제출 파일은 로컬 Gradle의 `assembleRelease`로 생성했습니다.

## 테스트 환경 및 필요한 설정

### 실제 확인한 환경

| 대상      | 환경                                               | 확인 범위                                                                  |
| --------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| 모바일    | Samsung Galaxy Z Fold4 / SM-F936N 실기기           | 제출 APK 설치, 실제 앱 화면 실행, 설치본과 제출 파일의 SHA-256 일치        |
| 차량      | Pleos Connect Emulator v2.1.0 / x86_64 / 사용자 10 | 제출 APK 설치, 조작 가능한 앱 화면 실행, 설치본과 제출 파일의 SHA-256 일치 |
| 빌드      | JDK 17 · Gradle 8.14.3 · Android SDK 36            | 두 대상 release 빌드, APK 서명·패키지·ARM64/x86_64 확인                    |
| 자동 검증 | 앱 66개 · 서버 30개 테스트                         | 계정 격리, 일정 선택, 분석 형식, 음성 API 및 오류 처리 등                  |

Google STT→가상 일정 HTTP 조회→TTS 왕복은 실제 API로 검증했습니다. 이번 제출 APK의 설치·실행 확인은 전체 로그인/PDF/연속 대화의 재검증이나 실제 차량 하드웨어 검증을 의미하지 않습니다. 설치 파일별 검증 환경은 [APK 검증 기록](apk/verification.json)에 정리했습니다.

### 계정·네트워크·권한

- **인터넷과 프리브 서버가 필요합니다.** APK 자체 실행에는 Expo 개발 서버가 필요 없지만 로그인·일정 동기화·PDF 분석·음성 대화는 배포 API를 사용합니다. 오프라인 설치만으로 서버 기능까지 제공하지 않습니다.
- 현재 Google OAuth는 공모전 단일 환경·테스트 모드입니다. 실제 로그인에는 Google Cloud에 테스트 사용자로 등록된 계정이 필요합니다. 다른 심사 계정을 쓰려면 사전 등록해야 합니다.
- Google Calendar API 활성화 및 일정 읽기 권한 승인이 필요합니다. 연결 후 **새로고침**으로 최신화하며, 앱 진입마다 Google 일정을 자동으로 가져오지 않습니다.
- 휴대폰의 차량 QR 스캔에는 카메라 권한이 필요합니다. 권한 없이 6자리 숫자 코드를 입력할 수도 있습니다.
- 차량 음성 대화에는 마이크 권한이 필요합니다. 에뮬레이터에서는 PC 마이크 입력도 활성화해야 합니다. 음성·읽어줄 답변은 Google STT/TTS로 전송되며 녹음 원본은 프리브 서버에 저장하지 않습니다.
- 음성은 프리브 내부 마이크 버튼으로 시작합니다. **Gleo로 앱을 호출하는 전체 음성 연동은 아직 검증되지 않았습니다.** 차량 상태 SDK·길 안내·서버 대화 기록 복원은 후속 기능입니다.

### 서버 연결

제공 APK는 시연용 서버에 연결됩니다. 직접 빌드하거나 서버를 별도로 운영할 때는 API 주소와 Google 웹 OAuth Client ID를 설정해야 합니다. PDF 분석과 음성 기능에는 서버 측 OpenAI·Google Cloud 설정 및 MySQL이 필요합니다.

서버 인증키·DB 비밀번호·개인 계정 정보는 공개 저장소에서 제공하지 않습니다. 심사에 사용할 Google 계정은 테스트 사용자 등록이 필요하므로 제출자에게 사전 확인해 주세요.

## 주요 기능 및 문서

- 모바일: Google 로그인·약관, Google 일정 가져오기·직접 등록, 거래처 저장·미팅 연결, PDF 업로드·AI 분석·최대 5개 문장 줄 핵심요약·페이지 근거·재시도.
- 차량: QR/숫자 계정 연결, 오늘/다음 일정·캘린더·미팅 준비, 자료 요약·납기·가격·출처 음성 질의, 후속 질문·종료 발화.
- 문서의 사실과 사용자가 확인한 업무 선호를 활용합니다. 성격 추론·음악 추천·자동 선제 대화는 포함하지 않습니다.

[설계 문서](document/README.md) · [인증 설계](document/authentication-spec.md) · [디자인 가이드](document/design-guide.md)
