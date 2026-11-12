# 기본 구조 작업 결과

2026-10-28 | 공통 기반과 현재 구현 경계

## 현재 경계

앱은 `<앱 저장소>`, 서버는 `<서버 저장소>`의 독립 Git 저장소다. 서로의 소스를 상대 경로로 import하지 않는다. Node.js·TypeScript 서버, MySQL, PM2 구조이며 서버 OpenAPI가 API 계약의 기준이다.

```text
앱
config/                  빌드 대상과 앱 식별자
plugins/                 Pleos 전용 Manifest·Gradle 설정
scripts/                 플랫폼 공통 실행 래퍼
src/app/                 Expo Router 연결만 담당
src/bootstrap/           전역 Provider
src/config/              빌드 대상·공개 API 주소
src/api/                 HTTP 클라이언트·오류·generated 경계
src/auth/                SecureStore 세션·전역 인증 상태
src/platform/            기기 어댑터·실제 창 크기 레이아웃
src/theme/               document 디자인 토큰 사용
src/components/          공통 UI
src/features/            기능별 화면·로직
modules/                 추후 검증된 Kotlin SDK 브리지
tests/                   빌드 분리·API 실패·레이아웃 테스트
document/                명세·디자인·작업 기준

서버
src/api/                 HTTP 진입점·인증된 문서 업로드/조회
src/worker/              DB 작업 인계·OpenAI 분석·결과 저장
src/infrastructure/      MySQL 연결·문서 저장소·작업 큐
src/domain/              PDF·분석 결과 검증
src/integrations/        OpenAI 문서 분석
src/database/            명시적 DB 생성·버전 마이그레이션
src/tools/               실제 API/DB/AI 스모크 도구
src/config.ts            환경변수 검증
openapi/                 API 계약
migrations/              MySQL 001 문서 처리 스키마
ecosystem.config.cjs     PM2 API·worker 실행
tests/                   상태 확인·설정 검증
```

## 빌드와 실행

앱:

```sh
npm ci
npm run check
npm run verify:targets
npm run start
npm run start:pleos
npm run android
npm run android:pleos
npm run export:mobile
npm run export:pleos
```

`android` 명령은 빌드 대상에 맞게 무시된 android 폴더를 clean prebuild 후 실행한다. 생성 android 폴더를 직접 편집하지 않고 config plugin으로 변경한다. 대상별 패키지는 `com.jb8.preve.mobile`, `com.jb8.preve.pleos`다. 이전 문자비서의 EAS 프로젝트·패키지·서명 설정을 재사용하지 않는다. EAS 빌드는 새 프로젝트 연결 및 자격 증명 설정 후 사용한다. 네이티브 SDK는 Expo Go로 검증하지 않는다.

`.env.example`의 `EXPO_PUBLIC_API_BASE_URL`은 공개 설정이다. 개발 시 에뮬레이터에서 PC의 서버에 접근하려면 `localhost` 대신 에뮬레이터·네트워크에 맞는 주소를 설정한다. 실제 차량 시연은 HTTPS API를 사용한다. 비밀키·MySQL 정보는 서버에만 둔다.

서버:

```sh
npm ci
npm run env:setup
# 서버 .env에 MySQL 정보를 직접 입력한 다음 실행
npm run db:init
npm run db:migrate
npm run build
npm test
npm start
pm2 start ecosystem.config.cjs
```

PM2는 배포 호스트에 설치되어 있어야 한다. `/health`는 프로세스 상태, `/ready`는 MySQL 도달 여부다. MySQL 미설정이면 `/ready`는 503이다. 문서 업로드·조회·재시도는 서비스 세션·소유권을 검사한다. 실제 worker가 DB 큐의 PDF를 분석한다. 2026-10-28 DB·업무 테이블 생성과 실제 통합 검증을 완료했다. Google 로그인·세션 발급·Calendar·HTTPS 배포는 후속이다.

## 정리 범위

문자 읽기·스팸·온디바이스 ONNX·SQLCipher·기존 문자비서 라우트·관련 빌드/모델 테스트·플러그인을 제거했다. 기존 앱 아이콘·스토어 자료·과거 docs는 `tmp/legacy/files`로 옮겼다. 기존 코드와 로컬 변경 ONNX는 `tmp/legacy/pre-framework.zip`에 파일별 비교 후 보관했다. 이 경로는 Git과 EAS 빌드에서 제외한다. 문서와 사용자 변경을 초기화하는 git reset·clean은 사용하지 않았다.

## 다음 작업

VS Code는 앱 루트의 automobile.code-workspace로 두 저장소를 함께 연다. 차량 UI·SDK 통합 검증은 Pleos 에뮬레이터에서 한다. 서버 .env 입력과 DB 생성 명령은 local-development.md를 따른다. db:init은 자동 실행하지 않으며 사용자 입력 완료 후 명시적으로 실행한다.

인증 방향은 확정됐다. 휴대폰 Google 로그인, 차량 QR·코드의 휴대폰 승인, Calendar 별도 동의로 구현한다. authentication-spec.md 참고. 현재 세션 저장 골격과 실제 Google 인증·페어링 구현을 구분한다.

1. 실제 SDK 사용 권한·의존성을 확인하고 mobile 빌드에 포함되지 않는 Pleos Kotlin 브리지를 연결한다.
2. 서버 OpenAPI의 인증 계약을 확정하고 앱 클라이언트를 생성한다.
3. 실제 계정·Calendar 일정과 앱 PDF 업로드·분석 결과 UI를 연결한다.

모바일은 일정·거래처·기록·설정과 PDF 로컬 첨부를 제공한다. Pleos는 별도 연결 안내·미팅 선택·반응형 브리핑이다. 앱 체험과 실제 서버 분석을 구분하며, 상세 구현 상태는 implementation-status.md를 기준으로 한다.

## 현재 검증 결과

- 앱 타입·ESLint 및 18개 자동 테스트 통과. 모바일 Android 번들 생성 성공.
- Pleos APK 실제 설치·터치·창 크기 변경 검증 통과. 최근 추가한 PDF 선택기는 새 APK 빌드 및 휴대폰 검증이 필요하다.
- 서버 타입 빌드·12개 자동 테스트, 실제 DB 생성·마이그레이션 및 재실행 통과.
- 실제 HTTP 업로드→DB 큐→OpenAI 분석→결과 조회 및 소유권·세션 해제 검증 통과. 중단 복구·재시도 제한도 검증.
- 앱/서버 기능별 GitLab push 완료. 프로덕션 배포·PM2 상시 실행은 아직 수행하지 않았다.
