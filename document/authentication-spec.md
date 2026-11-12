# Google 로그인과 차량 계정 연결 명세

버전 1.0 | 2026-10-27 | 개발 명세의 인증 기준

## 최신 구현 상태 (2026-10-28)

Google OAuth·실제 Calendar 가져오기 완료. 차량 연결은 QR 스캔 없이 8자리 코드 확인·승인 경로를 구현했다. /v1/auth/pairings에서 발급하고 /resolve, /{pairId}/approve, /{pairId}/deny, /token, /cancel을 사용한다. /token·/cancel은 body의 pairId+deviceSecret으로 인증한다. 차량 폴링 최소 3초, 5분 만료, 최초 1회 교환, 최대 7일 차량 세션, 모바일 원격 해제를 제공한다. 실기↔Pleos E2E와 SDK 주행 제한은 후속이다.
Calendar는 현재 단기 액세스 토큰을 사용한 사용자 요청 동기화(/v1/calendar/google/sync)이며 Google refresh 토큰을 저장하거나 백그라운드 자동 동기화하지 않는다. 아래 이전 설계 중 서버 authorization code 교환·암호화 장기 토큰·QR 스캔은 구현 완료로 간주하지 않는다.

## 확정 방향과 현재 상태

휴대폰은 **Google 로그인만 우선 지원**한다. 자체 비밀번호 가입·다른 소셜 로그인은 제외한다. 차량은 **로그인된 휴대폰에서 QR 또는 일회용 코드를 확인·승인**해 같은 서비스 계정의 차량 전용 세션을 발급받는다. Calendar 접근 동의는 로그인과 분리한다.

2026-10-28 현재 Google Credential Manager 휴대폰 모듈·로그인 UI, 서버 ID 토큰 검증/nonce/서비스 세션 발급·갱신·해제, 앱 SecureStore/동시 갱신 제어를 구현했다. 실제 Google 계정 로그인은 사용자 요청에 따라 Client ID·SHA 설정 후 별도 검증한다. 아래 차량 페어링과 Calendar는 아직 구현 전이다. 차량 페어링은 우리 서비스의 자체 프로토콜이다. Google TV용 device flow나 Pleos Account 자동 SSO로 표현하지 않는다.

## 모바일 Google 로그인

1. 앱 내 데이터 처리 안내 → `Google로 계속하기` → Google 계정 선택·동의.
2. 서버의 일회용 로그인 challenge와 nonce를 받아 지원되는 네이티브 로그인 흐름에 연결한다.
3. 휴대폰이 ID 토큰과 challengeId를 서버에 HTTPS로 전달한다.
4. 서버는 공식 라이브러리로 서명·issuer·audience·만료·nonce를 검증하고 challenge를 일회 소비한다.
5. 검증된 Google sub를 내부 userId에 연결해 자체 service accessToken / refreshToken / sessionId를 발급한다.
6. 휴대폰은 서비스 토큰을 SecureStore에 저장한다. 이후 API는 서비스 accessToken을 사용한다.

Android는 Credential Manager 기반의 공식 Google 로그인 흐름을 우선 검토한다. Expo 호환 네이티브 라이브러리 또는 Kotlin 모듈은 구현 시 선택한다. 레거시 Google Sign-In API를 새 구현의 기본값으로 고정하지 않는다. 휴대폰 빌드에만 로그인·QR 스캔 의존성을 연결하고 Expo Go 대신 네이티브 개발 빌드로 검증한다.

서버는 이메일·클라이언트 userId를 신뢰하지 않는다. 계정의 유일 키는 provider=google + 검증된 sub다. Google ID 토큰을 우리 API의 장기 Bearer로 사용하지 않는다. 취소·오류·만료·잘못된 audience는 로그인 실패로 처리한다.

## Calendar 연결

- 로그인은 기본 신원 확인 범위만 사용한다. `Google Calendar 연결`을 누를 때 별도의 읽기 동의를 요청한다.
- MVP 기본 scope는 `calendar.events.readonly`. 캘린더 목록 선택 등 추가 기능은 필요한 scope만 별도 요청한다.
- 서버 동기화는 Android AuthorizationClient 등 지원 흐름에서 받은 서버용 authorization code를 서버가 교환한다. ID 토큰만으로 Calendar를 호출하지 않는다.
- Google access/refresh token은 서버에 암호화 저장한다. 차량은 Google 토큰을 받지 않고 서비스 API로 일정을 조회한다.
- Calendar 계정이 로그인 계정과 다르면 자동 연결하지 않고 재선택을 안내한다. 승인 계정의 식별 검증이 필요하다.
- Calendar 권한 거절은 서비스 로그아웃과 다르다. 연결 없음·일정 없음·오류를 구분한다. 샘플은 별도 표시된 체험 모드에서만 사용한다.
- 연결 해제 시 제공자 권한 해제·서버 토큰 폐기·동기화 중단을 수행한다. 저장 일정 삭제 여부는 명시된 사용자 동작에 따른다.

## 차량 QR 및 코드 연결

```text
주차 중 차량에서 계정 연결
→ 서버가 pairId·표시 코드·deviceSecret 발급
→ 차량에 QR·코드·만료 남은 시간 표시
→ 로그인된 휴대폰에서 QR 스캔 또는 코드 입력
→ 휴대폰에서 계정·기기 별칭·차량 코드 대조 후 승인 또는 거절
→ 요청한 차량만 deviceSecret으로 승인 결과 교환
→ 차량 전용 세션 저장 → 같은 userId의 업무 기억 조회
```

QR 스캔만으로 자동 승인하지 않는다. 카메라 권한 거절 시 코드 입력을 제공한다. 미로그인 휴대폰은 Google 로그인 후 확인 화면으로 복귀한다. 앱 미설치 시 설치·실행 안내를 제공하며 별도 웹 연결 페이지는 만들지 않는다. 차량 화면에 Google 비밀번호 입력란을 만들지 않는다.

주행 제한 중에는 새 연결을 진행하지 않는다. 기기 별칭은 검증된 차종·VIN으로 표현하지 않는다. 다른 차량은 같은 userId에 별도 sessionId로 연결한다.

### 상태와 제품 기본값

`pending → approved → consumed`, `pending → denied | expired | cancelled`, `approved → expired | cancelled`.

| 항목 | 기본값·규칙 |
|---|---|
| 만료 | 생성부터 5분, 승인으로 연장하지 않음 |
| 표시 코드 | 혼동 문자 제외 무작위 영숫자 8자, 4자씩 구분 |
| pairId | 예측 불가 무작위 공개 ID |
| deviceSecret | 최소 32바이트 무작위값. 차량 생성 응답에만 반환, 서버에 해시 저장 |
| QR | `preve-mobile://pair?request={pairId}`. 토큰·deviceSecret·개인정보 제외 |
| 폴링 | 최소 3초. 429·서버 지시에 따라 지연, 백그라운드·만료·취소 시 중지 |
| 코드 확인 제한 | 모바일 세션당 5회/분, IP당 20회/분 |
| 생성 제한 | IP당 10회/10분 |

수치는 환경변수로 조절할 MVP 기본값이다. 승인자는 모바일 서비스 토큰에서 결정하고 body userId를 신뢰하지 않는다. QR·코드만 가진 사람은 차량 토큰을 받을 수 없다. 교환에는 pairId+deviceSecret이 필요하다. MySQL 트랜잭션과 조건부 상태 변경으로 승인·소비를 원자적으로 처리한다. 최초 1회만 세션을 발급한다. 응답 유실로 consumed라면 새 요청·재승인한다. 요청·코드·비밀값을 일반 로그에 남기지 않는다.

## 서비스 세션

| 항목 | 제품 기본 정책 |
|---|---|
| accessToken | 10분. userId·sessionId·역할·만료 및 서버의 세션 해제 상태 검증 |
| refreshToken | 휴대폰 최대 30일, 차량 최대 7일. 갱신 시 회전, 이전 토큰 재사용 감지 시 해당 세션 해제 |
| 서버 저장 | refreshToken 해시, userId, sessionId, deviceType, createdAt, expiresAt, revokedAt |
| 앱 저장 | SecureStore. 로그·URL·Analytics·AsyncStorage에 토큰 저장 금지 |
| 로그아웃 | 해당 서버 세션 해제 + 기기 토큰·업무 캐시 삭제 |
| 원격 해제 | 휴대폰의 연결 기기 목록에서 특정 차량만 해제 |
| 계정 삭제 | 모든 세션·Calendar 연결 해제, 명세에 따른 데이터 삭제 |

토큰 갱신은 동시에 하나만 수행하고 인증 실패 후 재요청은 1회로 제한한다. 사용자 전환 시 이전 캐시를 제거한다. 차량 전원 종료가 세션 삭제를 뜻하지 않으며 연결 화면에서 유지 기간과 해제 방법을 안내한다.

## 서버 API 계약

google/challenge·google·refresh·logout·sessions 경로는 서버 OpenAPI 0.3.0으로 구현했다. pairings와 Calendar 경로는 아직 구현 예정이며 실제 호출 성공으로 취급하지 않는다.

| API | 인증·입력 | 결과 |
|---|---|---|
| POST /v1/auth/google/challenge | 비로그인·요청 제한 | challengeId, nonce, expiresAt |
| POST /v1/auth/google | challengeId, idToken, 별칭 | userId, sessionId, 서비스 토큰·만료 |
| POST /v1/auth/refresh | refreshToken | 회전된 서비스 토큰 |
| POST /v1/auth/logout | 서비스 Bearer | 해당 세션 해제 |
| GET /v1/auth/sessions | 모바일 Bearer | 연결 기기 목록, 토큰 제외 |
| DELETE /v1/auth/sessions/{id} | 모바일 Bearer·소유권 | 특정 세션 해제 |
| POST /v1/auth/pairings | 차량 요청·생성 제한 | pairId, userCode, deviceSecret, qrPayload, expiresAt, intervalSeconds |
| POST /v1/auth/pairings/resolve | 모바일 Bearer, userCode | pairId·별칭·코드·만료 |
| GET /v1/auth/pairings/{id} | 모바일 Bearer | 승인 전 요청의 별칭·코드·만료만 제공 |
| POST /v1/auth/pairings/{id}/approve | 모바일 Bearer·명시적 확인 | pending에서만 승인 |
| POST /v1/auth/pairings/{id}/deny | 모바일 Bearer·확인 | pending 요청 거절 |
| POST /v1/auth/pairings/token | pairId, deviceSecret | pending은 202, approved는 1회 세션 발급, 종료 상태는 오류 |
| POST /v1/auth/pairings/{id}/cancel | 해당 deviceSecret | pending/approved 취소 |
| POST /v1/integrations/google/calendar | 모바일 Bearer, 승인 code | 서버 교환 후 연결 상태 |
| DELETE /v1/integrations/google/calendar | 모바일 Bearer | 연결 해제·동기화 중단 |

승인 전 로그인·페어링 API는 전역 Bearer 필수의 예외로 명시하고 요청 제한과 필요한 별도 비밀 검증을 적용한다. 오류 enum·상태 코드는 OpenAPI 작성 시 고정한다.

추가 모델: AuthIdentity, Session, LoginChallenge, VehiclePairing, GoogleCalendarConnection. 자료 소유권은 내부 userId 기준이다.

## 준비와 검증

Google Cloud 프로젝트·동의 화면, 모바일 패키지 `com.jb8.preve.mobile`의 실제 서명 SHA, 서버 검증용 client ID를 준비한다. 공개 client ID와 서버 secret을 구분한다. 실제 Android 로그인과 코드 교환이 성공한 뒤 라이브 연결로 표시한다.

필수 테스트: 로그인 취소·잘못된 토큰·nonce 재사용, Calendar 동의 거절·해제, QR 대신 코드 입력, 만료·잘못된 secret·승인 전 교환, 동시 승인·일회 소비, refresh 재사용·갱신 경쟁, 원격 해제, A/B 차량 연결 후 A만 해제, 같은 계정 맥락 복원.

## 공식 참고

Google 인증·권한 분리는 공식 문서를 따른다. 차량 페어링·수명·제한 값은 서비스 자체 설계다.

- https://developer.android.com/identity/sign-in/credential-manager-siwg
- https://developer.android.com/identity/authorization
- https://developers.google.com/identity/sign-in/android/backend-auth
- https://developers.google.com/workspace/calendar/api/auth
