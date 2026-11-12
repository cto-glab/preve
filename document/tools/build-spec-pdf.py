from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'document/pleos_meeting_assistant_spec_v1_8.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Malgun', 'C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('MalgunBold', 'C:/Windows/Fonts/malgunbd.ttf'))
W, H = 595.276, 841.89
M = 34
CW = W-2*M
C = canvas.Canvas(str(OUT), pagesize=(W,H))
C.setTitle('Pleos 미팅 준비 비서 서비스 플로우 및 개발 기능명세')
C.setAuthor('')
INK = colors.HexColor('#172536')
BLUE = colors.HexColor('#205B83')
PALE = colors.HexColor('#EEF4F8')
GRAY = colors.HexColor('#D9D9D9')

def p(text, x, top, width=CW, size=9, bold=False, color=INK, leading=None):
    s=ParagraphStyle('x',fontName='MalgunBold' if bold else 'Malgun',fontSize=size,
        leading=leading or size*1.43,textColor=color,wordWrap='CJK',spaceAfter=0)
    obj=Paragraph(text,s)
    _, height=obj.wrap(width,1000)
    obj.drawOn(C,x,H-top-height)
    return top+height

def txt(text,x,top,size=9,font='Malgun',color=INK):
    C.setFillColor(color); C.setFont(font,size); C.drawString(x,H-top-size,text)

def head(title,sub,page):
    p(title,M,30,size=20,bold=True,color=colors.black)
    p(sub,M,62,size=9,color=colors.black)
    txt('2026.10.27  |  v1.8  |  preve_server 독립 저장소 및 사용자 DB 설정',M,17,7.5,color=colors.HexColor('#576575'))
    C.setStrokeColor(GRAY); C.line(M,31,W-M,31)
    txt('Pleos 미팅 준비 비서',M,H-24,7.3)
    txt(f'{page} / 2',W-M-25,H-24,7.3)

def arrow(x1,t1,x2,t2,label=None):
    C.setStrokeColor(BLUE); C.setFillColor(BLUE); C.setLineWidth(1)
    y1,y2=H-t1,H-t2
    C.line(x1,y1,x2,y2)
    import math
    a=math.atan2(y2-y1,x2-x1)
    path=C.beginPath();path.moveTo(x2,y2)
    path.lineTo(x2-5*math.cos(a-.45),y2-5*math.sin(a-.45))
    path.lineTo(x2-5*math.cos(a+.45),y2-5*math.sin(a+.45));path.close()
    C.drawPath(path,stroke=0,fill=1)
    if label: p(label,(x1+x2)/2+4,(t1+t2)/2-10,70,size=7.3)

def node(x,top,w,h,title,body,fill=PALE):
    C.setFillColor(fill); C.setStrokeColor(colors.HexColor('#B5C7D4'))
    C.roundRect(x,H-top-h,w,h,6,stroke=1,fill=1)
    p(title,x+9,top+7,w-18,size=9.3,bold=True)
    p(body,x+9,top+24,w-18,size=8,leading=11)

def section(title,top):
    return p(title,M,top,size=10.3,bold=True,color=colors.black)+5

def table(rows, widths, top, size=8):
    style=ParagraphStyle('cell',fontName='Malgun',fontSize=size,leading=size*1.38,
                         wordWrap='CJK',textColor=INK)
    bold=ParagraphStyle('cellhead',parent=style,fontName='MalgunBold')
    data=[[Paragraph(v,bold if i==0 else style) for v in row] for i,row in enumerate(rows)]
    t=Table(data,colWidths=widths,hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#DEEAF2')),
        ('GRID',(0,0),(-1,-1),.45,GRAY),('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
        ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
    ]))
    _,ht=t.wrap(CW,1000);t.drawOn(C,M,H-top-ht)
    return top+ht

head('Pleos 미팅 준비 비서 서비스 플로우',
     '하나의 Expo 프로젝트  |  휴대폰에서 준비하고 Pleos 차량에서 근거를 확인하며 대화한다',1)
y=p('목표  공모전에서 동작하는 MVP를 시연한다. 1인 창업자와 외근 업무자가 일정·자료·기록으로 미팅을 준비한다. '
    '음악 추천과 자동 선제 대화는 제외하며, 상대방은 성격 단정 대신 담당자 소통 프로필로 관리한다.',M,89,size=9.2)

xs=[M,M+181,M+362]; nw=165
for x,s in zip(xs,['Android 휴대폰 앱','공통 서버와 저장소','Pleos 빌드와 Gleo']):
    p(s,x,139,nw,size=10,bold=True,color=colors.black)
node(xs[0],166,nw,62,'01 Google 로그인','앱 내 안내 후 Google 로그인<br/>Calendar는 별도 읽기 동의')
node(xs[1],166,nw,62,'02 일정과 담당자 연결','참석자 이메일·거래처로 매칭<br/>동명이인·모호한 연결만 확인')
arrow(xs[0]+nw,197,xs[1],197)
node(xs[0],249,nw,62,'03 앱에서 자료 첨부','파일 선택기로 PDF 업로드<br/>제안서·견적서·회의록')
node(xs[1],249,nw,62,'04 AI 문서 분석과 저장','멀티모달 AI로 내용·조건 분석<br/>원본·근거·페이지 함께 저장')
arrow(xs[0]+nw,280,xs[1],280)
arrow(xs[0]+nw/2,228,xs[0]+nw/2,249)
arrow(xs[1]+nw/2,228,xs[1]+nw/2,249)
node(xs[2],166,nw,62,'05 QR와 코드로 차량 연결','주차 중 휴대폰에서 확인·승인<br/>차량 전용 세션·업무 기억 복원')
arrow(xs[1]+nw,197,xs[2],197)
node(xs[2],249,nw,62,'06 Gleo가 앱 기능 호출','미팅 준비·자료 질문·길 안내<br/>등록된 Action과 Intent 사용')
arrow(xs[2]+nw/2,228,xs[2]+nw/2,249)
node(xs[1],334,nw,70,'07 근거와 업무 기억 조회','현재 일정 → 담당자·프로젝트<br/>→ 거래처 → 유사 미팅 템플릿<br/>계정 범위로 필요한 내용 반환')
node(xs[2],334,nw,70,'08 Callback으로 답변','Gleo가 반환 데이터로 응답<br/>추가 질문 시 07 반복<br/>자료가 없으면 모른다고 안내')
arrow(xs[1]+nw/2,311,xs[1]+nw/2,334)
arrow(xs[2]+nw/2,311,xs[2]+nw/2,323)
arrow(xs[2]+nw/2,323,xs[1]+nw/2,323)
arrow(xs[1]+nw/2,323,xs[1]+nw/2,334)
arrow(xs[1]+nw,369,xs[2],369)
node(xs[0],334,nw,70,'09 필요한 확인만 요청','자료로 초안 작성 후 1~2문항<br/>건너뛰어도 기본 브리핑 제공<br/>새 선호·기억은 확인 후 저장')
arrow(xs[0]+nw,369,xs[1],369)
node(xs[0],430,nw,65,'10 미팅 후 기록','사용자가 기록 기능 실행<br/>결과·미결사항·후속 할 일<br/>소통 프로필 수정·삭제')
node(xs[1],430,nw,65,'11 사용자별 업무 기억 갱신','앱에 전달된 요청·근거·결과 저장<br/>미결 질문·할 일·확인한 선호<br/>거래처·담당자·프로젝트별 관리')
node(xs[2],430,nw,65,'12 선택한 장소로 안내','사용자 확인 후 좌표 확정<br/>외부 주차장 후보 선택 가능<br/>NaviHelper → 기본 내비')
arrow(xs[2]+nw/2,404,xs[2]+nw/2,430)
arrow(xs[0]+nw,463,xs[1],463)
arrow(xs[2]+nw/2,495,xs[2]+nw/2,507)
arrow(xs[2]+nw/2,507,xs[0]+nw/2,507)
arrow(xs[0]+nw/2,507,xs[0]+nw/2,495)

y=section('동작 원칙',518)
y=p('<b>문서</b>  PDF를 멀티모달 AI로 사전 분석해 요약·조건·미결사항을 저장한다. OCR·파서는 보조 수단이다. '
    'AI 분석도 오류가 있으므로 원본·페이지·근거를 보관하고 금액·날짜를 검증한다.',M,y,size=9)
y=p('<b>기억</b>  앱이 받은 요청·함수 인자·반환 결과와 확인된 메모를 서버 계정에 연결한다. Gleo 전체 발화·최종 답변 수집은 '
    '전제하지 않는다. 다른 차량의 앱에서도 관련 업무 요약을 조회해 Gleo에 전달한다.',M,y+7,size=9)
y=p('<b>음성</b>  Gleo 응답은 voice 모드를 기본으로 한다. 앱 자체 브리핑·메모는 Pleos TTS·STT를 사용한다. '
    '앱이 TTS를 재생할 때 Gleo Callback은 silent로 설정해 중복 출력을 방지한다.',M,y+7,size=9)
y=p('<b>주행과 실패</b>  자동 실행·자동 발화는 하지 않는다. CarUxRestrictions와 오디오 포커스를 준수한다. '
    '통화·안전 안내·Gleo 호출 시 앱 음성을 중단하고, 오프라인에서는 준비된 일정·요약만 표시한다.',M,y+7,size=9)
y=section('공유 구조와 구현 범위',y+12)
y=p('<b>저장소</b>  앱 D:\\react-expo\\automobile / 서버 D:\\docker\\node_server\\preve_server. Git은 분리하고 OpenAPI로 계약을 맞춘다.<br/>'
    '<b>공통</b>  두 앱 빌드는 API·타입·인증·업무 로직 공유. 서버는 Node.js·TypeScript + MySQL, API·작업자는 PM2로 실행.<br/>'
    '<b>분리</b>  mobile 빌드는 파일·설정 관리, pleos 빌드는 차량 UI·Kotlin SDK 모듈을 사용한다. 전용 SDK·권한은 빌드별 분리.<br/>'
    '<b>MVP</b>  일정 / PDF AI 분석 / 근거 기반 대화 / 소통 프로필 / 주차·길 안내 / 기록 / 앱 내 정책·계정 삭제.<br/>'
    '<b>제외</b>  마켓 등록·심사 준비, 공개 정책 URL, 웹 서비스, 음악 추천, 자동 선제 대화, 성격 판정, 차량 제어.<br/>'
    '<b>시연</b>  샘플 요청서·제안서로 분석과 대화를 검증한다. Google 연결은 시스템 브라우저 사용. Office·기업 검색은 확장.',M,y,size=8.4)
assert y < H-42, f'Page 1 overflow: {y}'
C.showPage()

head('Pleos 미팅 준비 비서 개발 기능명세',
     'VS Code · Pleos Emulator  |  앱과 서버 Git 분리 · Node.js TypeScript · MySQL · PM2',2)
y=89
rows=[['ID와 기능','입출력과 구현 규칙','완료 기준'],
 ['F00 두 대상 빌드','mobile / pleos 프로필로 앱 ID·권한·Manifest·네이티브 의존성 분리. 공통 TS 로직·API 사용, 기기 기능은 어댑터. Expo Go 미사용.','동일 소스로 두 앱 빌드, 휴대폰에서 Pleos 서비스 비호출'],
 ['F01 로그인과 연결','휴대폰 Google ID 토큰을 서버에서 검증. 차량 QR·코드를 휴대폰에서 승인해 전용 세션 발급. 갱신·원격 해제·캐시 삭제.','Calendar 별도 동의, 일회 승인·만료, 차량 간 복원'],
 ['F02 일정과 식별','Google Calendar 읽기. 제목·시간대·장소·설명·참석자 저장. 외부 일정 ID로 갱신. 이메일 우선 식별, 모호한 거래처·담당자는 확인.','수정·취소 반영, 동명이인·일정 제목만으로 병합 금지'],
 ['F03 AI 문서 분석','PDF 20MB·100쪽까지. 형식 검증 후 queued → processing → ready/failed. AI API로 요약·조건·미결사항·근거 생성. OCR은 보조.','원본·페이지 보존, 숫자 검증, 실패·재시도 표시'],
 ['F04 맥락과 검색','같은 일정 → 담당자·프로젝트 → 거래처 순 조회. 유사 일정은 질문 틀만 재사용. 앱에 전달된 요청·근거·결과·미결사항 저장.','타사 금액·성향 혼입 금지, 삭제 기억 재사용 금지'],
 ['F05 소통 프로필','담당자 역할·관심사·설명 선호·우려를 자료로 초안 작성. 요청 대화 중 최대 2문항, 건너뛰기 허용. 새 장기 기억은 확인 후 저장.','사실·의견·추정과 출처·날짜 구분, 수정·삭제'],
 ['F06 Gleo 대화','Schema + Intent + Callback. next_meeting / meeting_brief / meeting_qa / contact_context / save_note / navigate_meeting. 매 요청마다 업무 맥락 제공.','7초 내 응답, 질문 인자 수신 검증, 전체 녹취 비의존'],
 ['F07 장소와 주차','외부 지오코딩·주차장 공급자 사용. 사용자 확인 후 NaviHelper.requestRoute 호출. 경로 결과는 이벤트로 확인.','좌표 확인, 안내 성공·실패 표시, 빈자리 미확인 표기'],
 ['F08 기록과 차량 UX','사용자가 요청한 음성 메모만 Pleos STT로 기록. 후속 할 일은 확인 후 저장. CarUxRestrictions·오디오 포커스 적용.','음성 중복 없음, 주행 제한·통화·단절 대응'],
 ['F09 안내와 동의','앱 내 이용·개인정보·AI 외부 전송 안내와 관련 동의. 안내 버전·동의 시각 저장. 설정에 연결 해제·기억·파일·계정 삭제 제공.','앱 내 재열람·선택 동의 거절 처리, 공개 URL 제외']]
y=table(rows,[82,300,CW-382],y,size=8.2)

y=section('데이터와 API 계약',y+12)
y=p('<b>데이터</b>  UserProfile / Company / Contact / Project / Meeting / Document / Evidence / Memory / ActionLog / ActionItem. '
    '모든 데이터에 userId. Evidence는 documentId·page·quote, Memory는 scopeId·kind·sourceIds·observedAt·confirmedAt·deletedAt. '
    'ActionLog는 수신 인자·반환 결과만 기록하며 최종 발화로 표기하지 않는다.',M,y,size=8.4)
y=p('<b>공통 REST</b>  GET /v1/meetings?from&amp;to · POST /v1/meetings/{id}/documents(multipart) → documentId,status · '
    'GET /v1/documents/{id} → status,error · POST /v1/meetings/{id}/query {question} → '
    '{answerFacts,evidence[],missingFields[],contextSummary} · GET /v1/meetings/{id}/context · POST /v1/meetings/{id}/notes · '
    'POST /v1/memories(확인 후 저장) · PATCH/DELETE /v1/memories/{id}. '
    '서버 OpenAPI로 클라이언트 생성·검증. 두 빌드가 동일 API 사용. Bearer 인증·소유권 검사, Google 연결·해제, 프로필 CRUD 제공. '
    '삭제 시 파생 데이터 무효화. 로그인·페어링 API와 세션 정책은 authentication-spec.md 적용.',M,y+5,size=8.2)
y=p('<b>Gleo 계약</b>  Action 입력은 meetingId·question 등 최소값. Callback은 '
    'functionName, status(success / asking / fail), 영문 message, JSON 배열 문자열 data, mode를 사용한다. '
    'data에 근거·페이지·업무 요약·불확실성을 포함한다. 서버 조회 제한은 5초, 문서 분석은 비동기. '
    '같은 Action 재시도로 메모가 중복 저장되지 않게 requestId를 사용한다.',M,y+5,size=8.4)

y=section('개발 순서와 검증',y+11)
y=p('<b>서버 준비</b>  npm ci → npm run env:setup → 사용자 서버 .env 입력 → npm run db:init → PM2 실행. '
    '기존 DB 보존, 업무 테이블은 별도 마이그레이션. VS Code·Pleos 테스트 절차는 local-development.md 적용.',M,y,size=8.2)
y=p('<b>순서</b>  ① 서버 기본 실행·두 빌드·Gleo 실증 → ② 계정·안내·일정 → ③ AI 분석 → ④ 기억·대화 → ⑤ 내비·주차 → ⑥ 통합.<br/>'
    '<b>필수 검증</b>  납기 4주/6주를 출처와 비교, 자료 없으면 미확인 응답. A/B 차량 동일 계정 맥락 복원, 동명이인·타사 기억 격리, '
    '질문 건너뛰기, 계정·기억 삭제, 분석 실패·7초 지연·단절·오디오 선점 검증.',M,y+5,size=8.2)
y=p('<b>연동 조건</b>  Android API 28+ / Gradle 8+ / Java·Kotlin, Emulator 2.1.0(API 34). '
    'SDK 권한·Gleo Schema 승인·주행 중 Business 기능 허용 범위는 실제 프로젝트에서 확인한다. '
    'Expo의 Pleos 실행 호환성은 실증 필요. 모의 어댑터로 앱·서버 개발 병행. 단일 소스에서 재생성 가능한 config plugin으로 네이티브 설정 관리. '
    '산출물은 휴대폰·Pleos 빌드, 소스, 시연 영상과 공모전 제출 자료. 마켓 등록·정책 사이트·상용 출시 작업은 범위 밖이다.',M,y+5,size=8)

y=section('공식 근거',y+10)
refs=[('공모전 개발 환경','https://appdevchallenge.auto-hmg.io/guide/development'),
      ('Gleo Callback과 7초 제한','https://document.pleos.ai/docs/pleos-only/app-integration-guide/guide/action_callback'),
      ('Gleo Schema 등록','https://document.pleos.ai/docs/pleos-only/app-integration-guide/guide/deliver-schema'),
      ('NaviHelper 목적지 API','https://document.pleos.ai/docs/pleos-only/connect-sdk-pleos/NaviHelper/destinations'),
      ('주행 제한 정책','https://document.pleos.ai/en/docs/pleos-only/vehicle-app-planning-guide/driving-restiction-policy'),
      ('Expo 빌드 구분','https://docs.expo.dev/build-reference/variants/')]
links='  |  '.join(f'<link href="{u}" color="#205B83">{escape(t)}</link>' for t,u in refs)
y=p(links,M,y,size=7.2)
assert y < H-42, f'Page 2 overflow: {y}'
C.showPage();C.save()
r=PdfReader(str(OUT)); assert len(r.pages)==2
for i,page in enumerate(r.pages):
    text=page.extract_text()
    assert len(text)>500
    (ROOT/f'tmp/pdfs/page_{i+1}.txt').write_text(text,encoding='utf-8')
print(f'{OUT}\nPages: {len(r.pages)}; page 2 content bottom: {y:.1f}')
