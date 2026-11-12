# Pleos 미팅 준비 비서 개발 명세

버전 1.8 | 확정일 2026-10-27 | 목표 공모전 MVP 개발과 시연

개발 환경은 VS Code의 앱·서버 멀티 루트 작업 공간, 차량 통합 테스트는 Pleos Connect Emulator로 한다. DB 정보는 사용자가 서버 `.env`에 입력한 후 명시적으로 `npm run db:init`을 실행해 MySQL DB를 생성한다. 절차는 `local-development.md`를 적용한다.

인증은 `authentication-spec.md`를 적용한다. 모바일은 Google 로그인, 차량은 로그인된 휴대폰의 QR·일회용 코드 승인 방식이다. Calendar 읽기 동의는 로그인과 분리한다. 인증 설계 확정이며 구현 완료를 의미하지 않는다.

화면 구현은 같은 폴더의 `design-guide.md`와 `design-tokens.json`을 적용한다. `design-preview.html`에서 휴대폰·Pleos의 넓은/분할/낮은 창을 확인한다. 브리프를 기본 구조로, 컨버세이션을 미팅 상세 대화 화면의 참고로 사용한다. 창 변경 시 미팅·질문·브리핑 상태를 유지하며 실제 앱 창의 논리 크기로 레이아웃을 결정한다.

## 확정 구조

- 하나의 Expo / React Native / TypeScript 앱 프로젝트에서 `mobile`, `pleos` 두 대상으로 빌드한다.
- 휴대폰은 Google 연결, 일정 조회, PDF 첨부, 분석 결과와 소통 프로필·기억 관리 기능을 제공한다.
- Pleos는 계정 연결, 미팅 준비 대화, 브리핑, 목적지·주차장 안내를 제공한다.
- 공통 API 클라이언트, DTO, 검증 스키마, 인증 상태, 업무 로직을 공유한다. 기기 기능은 어댑터로 분리한다.
- Pleos SDK는 Kotlin 네이티브 모듈로 연결하고 휴대폰 빌드에서는 해당 의존성·권한을 제외한다.
- 앱 Git 저장소는 `<앱 저장소>`, 서버 Git 저장소는 `<서버 저장소>`로 분리한다. 서버 코드를 앱 저장소에 중첩하거나 Git 서브모듈로 연결하지 않는다.
- 서버는 **Node.js + TypeScript**, DB는 **MySQL**, 파일은 비공개 객체 저장소, 문서 분석은 비동기 작업자로 처리한다.
- 서버 TypeScript를 JavaScript로 빌드한 뒤 **PM2**로 API와 분석 작업자를 각각 실행한다. 별도 Railway·Render 배포는 사용하지 않는다.
- 두 앱 빌드 간 공통 코드는 앱 저장소에서 공유한다. 앱과 서버는 서버 저장소의 OpenAPI 명세를 기준으로 DTO·API 클라이언트를 생성·검증한다. 서버 전용 코드·비밀키·DB 연결 정보는 앱에 포함하지 않는다.
- AI는 서버에서 외부 API로 호출한다. OCR·파서는 필요할 때 보조 수단으로 사용한다.
- 별도 웹 서비스, 음악 추천, 자동 선제 대화, 성격 자동 판정, 차량 제어, 마켓 출시 준비는 제외한다.

## 사용자 흐름

1. 앱 내 안내를 확인하고 휴대폰에서 Google로 로그인한다. Google Calendar는 별도 읽기 동의로 연결한다.
2. 캘린더에서 일정을 조회한다. 직업·대화 취향·파일 첨부는 선택 사항이다.
3. 일정에 PDF를 첨부하면 서버가 원본을 보관하고 AI로 내용·조건·미결사항을 분석한다.
4. 주차 중 차량 QR·코드를 로그인된 휴대폰에서 확인·승인한다. 차량 전용 세션으로 같은 계정의 미팅 준비를 요청한다.
5. Gleo가 등록된 앱 Action을 호출한다. 앱은 서버에서 관련 근거와 업무 기억을 조회해 Callback으로 반환한다.
6. Gleo가 반환 데이터를 바탕으로 답변한다. 추가 질문 때 관련 근거를 다시 조회한다.
7. 사용자 요청과 확인 후 미팅 장소 또는 선택한 주차장을 NaviHelper로 안내한다.
8. 사용자가 미팅 결과를 기록하면 확인된 메모·후속 할 일·소통 선호를 저장한다.

## 기능 및 완료 기준

| ID | 기능 | 완료 기준 |
|---|---|---|
| F00 | mobile / pleos 빌드 구분 | 같은 소스로 두 앱 빌드. 앱 ID·권한·Manifest·네이티브 의존성 분리. config plugin으로 재생성 가능. Expo Go에 의존하지 않음. |
| F01 | Google 로그인·차량 연결 | Google ID 토큰 서버 검증. QR·코드 휴대폰 승인 후 차량 세션 발급. 세션 갱신·원격 해제·캐시 삭제·차량 간 복원. authentication-spec.md 적용. |
| F02 | 일정·담당자 연결 | Google 읽기 권한. 제목·시간대·장소·설명·참석자 조회. 외부 일정 ID로 중복 방지·수정·취소 반영. 이메일 우선 식별. 모호하면 사용자 확인. |
| F03 | AI PDF 분석 | 파일당 20MB·100쪽 제한을 MVP 기본값으로 적용. 실제 파일 형식 검사. 원본·근거 페이지 보관. 요약·조건·미결사항 저장. 숫자·날짜 검증, 실패 이유·재시도 표시. |
| F04 | 근거·업무 기억 검색 | 같은 일정 → 담당자·프로젝트 → 거래처 순 검색. 유사 일정은 일반 질문 틀만 재사용. 타사 금액·개인 선호 혼입 금지. 자료 부족은 미확인으로 반환. |
| F05 | 소통 프로필 | 역할·관심사·설명 선호·이전 우려를 초안으로 제시. 필요한 질문만 대화당 최대 2개. 건너뛰기 가능. 새 장기 기억은 사용자 확인 후 저장. |
| F06 | Gleo 연결 | Schema·Intent·Callback 실증. 앱으로 질문 인자가 전달되는지 확인. 매 요청에 업무 맥락 제공. 7초 제한 이전 응답. 전체 대화 녹취에 의존하지 않음. |
| F07 | 장소·주차·내비 | 외부 장소·주차 데이터로 후보 조회. 주소·좌표 확인 후 requestRoute. 최종 결과는 이벤트로 검증. 실시간 빈자리 없으면 미확인 표기. |
| F08 | 음성 기록·차량 UX | 요청한 음성 메모만 Pleos STT 사용. 앱 TTS 재생 시 Gleo Callback silent로 중복 방지. CarUxRestrictions·오디오 포커스·통화·단절 처리. |
| F09 | 앱 내 안내·동의·삭제 | 이용·개인정보·AI 외부 전송 안내, 관련 동의 및 버전·시각 기록. 선택 동의 거절, 연결 해제, 기억·파일·계정 삭제 제공. 공개 정책 URL은 이번 범위에서 제외. |

## 문서 처리

`queued → processing → ready | failed`

- 파일 업로드 응답은 documentId와 status를 즉시 반환한다. 무거운 분석을 Gleo 요청 안에서 실행하지 않는다.
- 원본 파일, 페이지별 근거, AI 요약·조건·미결사항·불확실성을 보관한다. 원문과 AI 추정을 구분한다.
- 문서에 있는 지시문을 시스템 명령으로 취급하지 않는다. 문서 내용은 분석 대상 데이터다.
- 문서 삭제 시 연결된 분석 결과·검색 인덱스·업무 요약도 삭제 또는 재생성한다.

## 업무 기억과 차량 간 연속성

- 기억은 차량 ID가 아닌 서비스 userId에 귀속한다. 차량은 지원 SDK와 앱 설치·동일 계정 로그인이 필요하다.
- 거래처·담당자·프로젝트·일정을 구분한다. 동명이인이나 비슷한 일정 제목만으로 병합하지 않는다.
- 관찰 사실, 사용자 의견, AI 추정을 분리하고 출처·날짜·사용자 확인 여부를 기록한다.
- 앱이 실제로 받은 요청·함수 인자·반환 결과, 확인된 메모, 미결 질문·후속 할 일을 저장한다.
- Gleo 전체 사용자 발화·최종 음성 응답을 수신할 수 있다고 전제하지 않는다. ActionLog를 전체 대화 원문으로 표시하지 않는다.
- 다른 차량에서는 관련 업무 요약을 서버에서 조회해 Gleo에 반환한다. Gleo 자체의 세션 이관을 전제하지 않는다.
- 기억 수정·삭제 시 관련 요약·검색 결과·기기 캐시도 갱신한다.

## 데이터 및 API 계약

주요 모델: UserProfile, Company, Contact, Project, Meeting, Document, Evidence, Memory, ActionLog, ActionItem.

- 업무 데이터는 userId를 포함한다. 요청의 userId를 신뢰하지 않고 인증 세션에서 소유자를 결정한다.
- Evidence: documentId, page, quote.
- Memory: scopeType, scopeId, kind(fact / user_opinion / inference), sourceIds, observedAt, confirmedAt, deletedAt.
- Meeting 외부 키: (userId, calendarId, eventId).

| API | 입력 또는 출력 |
|---|---|
| GET /v1/meetings?from&to | 사용자 일정 목록 |
| POST /v1/meetings/{id}/documents | multipart PDF → documentId, status |
| GET /v1/documents/{id} | status, error |
| POST /v1/meetings/{id}/query | question → answerFacts, evidence[], missingFields[], contextSummary |
| GET /v1/meetings/{id}/context | 관련 업무 요약·확인된 선호·미결사항 |
| POST /v1/meetings/{id}/notes | 확인된 메모·후속 할 일 |
| POST /v1/memories | 사용자 확인 후 저장 |
| PATCH / DELETE /v1/memories/{id} | 수정·삭제 및 파생 데이터 무효화 |

모든 업무 API에 서비스 Bearer와 소유권 검사를 적용한다. 로그인·승인 전 페어링은 authentication-spec.md의 예외 규칙을 적용한다. Calendar 연결·해제, 프로필 CRUD, 파일·계정 삭제 API도 제공한다. 두 빌드는 같은 서버 API 계약을 사용한다.

### 별도 서버 저장소와 실행

서버 경로 `<서버 저장소>`는 소스 작업 위치다. 해당 경로 이름만으로 Docker 실행을 전제하지 않는다. 실제 배포 호스트·운영체제·도메인은 구현 시 확인하며, 외부에서 호출 가능한 HTTPS API를 제공한다.

서버 저장소의 권장 구분은 `src/api`, `src/worker`, `src/domain`, `src/integrations`, `openapi`, `migrations`다. API와 작업자는 도메인·AI·DB 코드를 공유하되 별도 엔트리포인트를 사용한다.

- `npm ci` → `npm run env:setup` → 사용자 `.env` 입력 → `npm run db:init` → 구현된 MySQL 마이그레이션 → `pm2 start ecosystem.config.cjs` 순서로 실행한다. 최초 DB 생성과 테이블 마이그레이션은 별도다. 입력 전 DB에 연결하지 않는다.
- PM2 프로세스명은 `meeting-api`, `meeting-worker`로 구분한다. API는 HTTPS 요청을 처리하고 작업자는 DB에 저장된 분석 작업을 처리한다.
- 환경변수로 MySQL 연결, AI 키, Google 인증 정보, 파일 저장소 정보를 주입한다. `.env`, 업로드 파일, 로그, 빌드 결과는 Git에서 제외한다.
- 분석 작업의 상태·잠금·재시도 횟수는 MySQL에 영속화한다. API 또는 작업자 재시작 후 중복 분석·유실을 방지한다.
- API 준비 상태 확인, 종료 시 진행 중 요청·작업 정리, PM2 로그 확인을 구현한다. 부팅 자동 시작은 실제 서버 OS에 맞게 설정한다.
- OpenAPI 변경과 생성 클라이언트 버전을 함께 기록한다. 앱과 서버는 상대 경로 소스 import 없이 HTTPS와 명세로 연결한다.

### Gleo 계약

제안 Action: next_meeting, meeting_brief, meeting_qa, contact_context, save_note, navigate_meeting. 실제 스키마는 공식 가이드와 실행 검증에 맞춘다.

- 입력: meetingId, question 등 필요한 인자. 없는 값은 확인 요청.
- Callback: functionName, status(success / asking / fail), 영문 message, JSON 배열 문자열 data, mode(voice / silent / beep).
- data에는 근거·출처·업무 요약·불확실성을 전달한다. 서버 조회 제한 기본값 5초. Action 7초 제한 이전 Callback을 보낸다.
- 분석 중이면 현재 상태를 즉시 반환한다. 영구적으로 기다리거나 지원이 확인되지 않은 비동기 Gleo 완료 통지를 전제하지 않는다.
- 변경 Action은 requestId로 중복 저장을 방지한다.

## 개발 순서와 실증 조건

1. 별도 서버 저장소의 Node.js·TypeScript·MySQL·PM2 기본 실행과 두 앱 빌드·Kotlin 브리지·Gleo 질문 인자·Callback을 먼저 검증한다.
2. 서비스 계정·앱 내 안내·Google 일정 연동을 구현한다.
3. PDF AI 분석과 근거 검색을 구현한다.
4. 업무 기억·대화·소통 프로필을 연결한다.
5. 주차장 후보와 NaviHelper를 연결한다.
6. 동일 계정의 차량 간 복원, 동명이인·타사 정보 격리, 삭제·오디오 선점·네트워크 실패를 통합 검증한다.

서버 프레임워크·AI 모델·저장소 공급자는 구현 시 환경에 맞춰 선택한다. SDK 권한, Gleo Schema 승인·테스트 환경, Expo의 Pleos 실행 호환성, 주행 중 기능 허용 범위는 아직 실증 항목이다. 모의 어댑터로 앱·서버 개발은 병행할 수 있으나 실제 연동 성공으로 보고하지 않는다.

시연 데이터: 요청서 납기 4주와 제안서 납기 6주를 비교해 출처와 함께 안내하고, 추가 질문 및 기억 복원을 보여준다. 개인정보가 없는 샘플 자료를 기본으로 사용한다.

## 공식 참고

- https://appdevchallenge.auto-hmg.io/guide/development
- https://document.pleos.ai/docs/pleos-only/app-integration-guide/guide/core-concepts
- https://document.pleos.ai/docs/pleos-only/app-integration-guide/guide/action_callback
- https://document.pleos.ai/docs/pleos-only/app-integration-guide/guide/deliver-schema
- https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/NaviHelper/destinations
- https://docs.expo.dev/build-reference/variants/
- https://docs.expo.dev/modules/overview/
