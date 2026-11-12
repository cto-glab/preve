const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function harness(demo, id = 'demo-proposal', options = {}) {
  const effects=[];const appEvents=[];const signIns = []; const attached = []; const removedDocuments = []; const requests = []; const navigation = []; const changes = []; const saved = []; const deleted = []; const toggled = []; const alerts = [];
  const state = []; let cursor = 0;
  function load(file) {
    const exports = {};
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
    const customRequire = name => {
      if (name.endsWith('.png')||name.endsWith('.ttf')) return 1;
      if(name==='expo-camera')return {CameraView:'CameraView',useCameraPermissions:()=>[{granted:!!options.cameraGranted,canAskAgain:options.cameraCanAsk!==false},async()=>{requests.push('camera-permission');}]};
      if(name==='@react-navigation/native')return {useIsFocused:()=>true};
      if(name.startsWith('@tabler/icons-react-native/'))return {__esModule:true,default:'Svg'};
      if(name==='react-native-svg')return {__esModule:true,default:'Svg',G:'G',Path:'Path',Rect:'Rect',Circle:'Circle'};
      if(name==='react-native-qrcode-svg')return {__esModule:true,default:'QRCode'};
      if (name==='expo-font')return {useFonts:()=>[true]};
      if (name === 'expo') return { requireOptionalNativeModule:()=>null };
      if (name === 'react') return { ...require('react'), useEffect: callback=>effects.push(callback), useRef: initial => { const index=cursor++; if(!(index in state))state[index]={current:initial}; return state[index]; }, useCallback: value => value, useMemo: value => value(), useState: initial => { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; } };
      if (name === 'react-native') return { Animated:{Value:class {interpolate(){return '0deg';}},View:'AnimatedView',timing:()=>({}),loop:()=>({start(){},stop(){}})},Easing:{linear:x=>x}, AppState: {get currentState(){return options.appState||'active';},addEventListener:(_,callback)=>{appEvents.push(callback);return {remove:()=>{}};}}, useWindowDimensions: () => options.size || { width: 960, height: 600 }, Image: 'Image', ActivityIndicator: 'ActivityIndicator', TextInput: 'TextInput', Alert: { alert: (...args) => alerts.push(args) }, Text: 'Text', View: 'View', ScrollView: 'ScrollView', Pressable: 'Pressable', StyleSheet: { create: value => value } };
      if (name === 'react-native-safe-area-context') return { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
      if (name.endsWith('/calendar/context') || (name==='./context'&&file.includes('calendar')))return {useCalendar:()=>({ready:true,connected:!!options.calendarConnected,needsOnboarding:!!options.calendarOnboarding,busy:false,message:'',connect:async()=>{requests.push('calendar-connect');options.calendarConnected=true;options.calendarOnboarding=false;return true;},refresh:async()=>{requests.push('calendar-refresh');},skip:async()=>{options.calendarOnboarding=false;}})};
      if (name.endsWith('/auth/context')) return { useAuth: () => ({ ready: true, session: options.session || null, error: null, signIn: async session => signIns.push(session) }) };
      if (name.endsWith('/auth/google')) return { canGoogleSignIn: () => !!options.googleConfigured, clearGoogleCredentialState:async()=>{}, beginGoogleLogin:async()=>{if(options.googleError)throw options.googleError; return {challengeId:'pending',idToken:'token',expiresAt:'2099-01-01T00:00:00Z'};},finishGoogleLogin:async()=>{if(options.googleError)throw options.googleError;return options.googleSession||{userId:'test-user'};}, googleLogin: async () => { if (options.googleError) throw options.googleError; return options.googleSession || { userId: 'test-user' }; }, googleLoginMessage: () => '로그인을 취소했어요.' };
      if(name==='./PairingScanner')return {PairingScanner:'PairingScanner'};
      if (name.endsWith('/pairing/api')||(name==='./api'&&file.includes('pairing')))return {resolvePairing:async code=>{requests.push(['resolve',code]);return {pairId:'12345678-1234-1234-1234-123456789abc',userCode:'012-345',deviceName:'차량 테스트',expiresAt:'2099-01-01T00:00:00.000Z'};},decidePairing:async(id,approve)=>{requests.push(['decide',id,approve]);},pairingMessage:()=> '연결 오류'};
      if(name==='./api'&&file.includes('contacts')){const actual=load(path.resolve('src/features/contacts/api.ts'));return {...actual,contactsApi:{list:async()=>options.contacts||[],save:async(input,id)=>{requests.push(['contact-save',input,id]);const item={...input,id:id||'12345678-1234-1234-1234-123456789abc'};options.contacts=[item];return item;},remove:async id=>{requests.push(['contact-delete',id]);},linked:async()=>options.linkedContact||null,link:async(meeting,id)=>{requests.push(['contact-link',meeting,id]);return id?(options.contacts||[]).find(item=>item.id===id):null;}}};}
      if (name.endsWith('/api') && !name.endsWith('/documents/api') && !(name === './api' && file.endsWith('RemoteDocuments.tsx'))) return { api: { request: async path => { requests.push(path); if (options.healthError) throw options.healthError; return options.health || { status: 'ok', service: 'automobile-api' }; } } };
      if (name.endsWith('/documents/api') || (name === './api' && file.endsWith('RemoteDocuments.tsx'))) return {documentsApi:{upload:async(...args)=>{requests.push(args);return {documentId:'server-doc',status:'queued'};},list:async meeting=>{requests.push(['list',meeting]);return options.remoteDocuments||[];},retry:async()=>{}}};
      if (name.endsWith('/documents/files')) return { pickLocalPdf: async () => { if (options.fileError) throw options.fileError; return options.file || null; }, deleteLocalPdf: async uri => removedDocuments.push(uri) };
      if (name === 'expo-router') return {useFocusEffect:callback=>effects.push(callback), router: { push: value => navigation.push(value), replace: value => navigation.push(value) }, useLocalSearchParams: () => ({ id, meetingId: id, noteId: options.noteId }) };
      if (name.endsWith('/meetings/context') || (name === './context' && (file.endsWith('VehicleHome.tsx')||file.endsWith('LiveMeetings.tsx')||file.endsWith('VehicleLiveHome.tsx')||file.endsWith('VehicleCalendar.tsx')))) return { useMeetings: () => ({ demo, getMeeting: meetingId => options.liveMeeting || load(path.resolve('src/features/meetings/demo.ts')).findMeeting(meetingId,demo), liveMeetings:options.liveMeetings||[], loadingMeetings:!!options.loadingMeetings, meetingError:null, refreshMeetings:async()=>{requests.push('vehicle-refresh');}, rememberMeeting:()=>{}, markDocumentUploaded:(...args)=>attached.push(args), documents: options.documents || [], addDocument: (meetingId, file) => attached.push({ meetingId, ...file }), removeDocument: async id => removedDocuments.push(id), notes: options.notes || [], setDemo: value => changes.push(value), saveNote: (...args) => saved.push(args), deleteNote: value => deleted.push(value), toggleTask: value => toggled.push(value) }) };
      if (name.endsWith('/meetings/remote')) return {manualMeetingInput:()=>{throw new Error('일정명과 날짜·시간을 확인해 주세요.');},createLiveMeeting:async()=>({})};
      if (name.endsWith('/config/environment')) return { environment: { target: options.target || 'mobile' } };
      if (!name.startsWith('.')) return require(name);
      const base = path.resolve(path.dirname(file), name);
      if (base.endsWith('.json')) return JSON.parse(fs.readFileSync(base, 'utf8'));
      return load(['.tsx', '.ts'].map(ext => base + ext).find(candidate => fs.existsSync(candidate)));
    };
    vm.runInNewContext(source, { exports, require: customRequire, Error, setTimeout, clearTimeout }); return exports;
  }
  function expand(node) {
    if (node == null || typeof node === 'boolean') return [];
    if (Array.isArray(node)) return node.flatMap(expand);
    if (typeof node !== 'object') return [node];
    if (typeof node.type === 'function') return expand(node.type(node.props));
    return [node, ...expand(node.props.children)];
  }
  return { render: (file, name) => { cursor = 0; const mod = load(path.resolve(file)); return expand(mod[name || 'default']()); }, effects, appEvents, signIns, attached, removedDocuments, requests, navigation, changes, saved, deleted, toggled, alerts };
}
test('schedule smoke: empty state opts into demo; demo opens selected meeting and can exit', () => {
  const empty = harness(false); const emptyNodes = empty.render('src/features/workspace/WorkspaceScreen.tsx', 'WorkspaceScreen');
  assert(!emptyNodes.includes('서비스 도입 제안 미팅'));
  emptyNodes.find(node => node.type === 'Pressable' && JSON.stringify(node.props.children).includes('샘플 일정 체험하기')).props.onPress(); assert.equal(empty.changes[0], true);
  const demo = harness(true); const nodes = demo.render('src/features/workspace/WorkspaceScreen.tsx', 'WorkspaceScreen');
  const buttons = nodes.filter(node => node.type === 'Pressable');
  buttons[1].props.onPress(); assert.equal(demo.navigation[0].params.id, 'demo-proposal');
  buttons[0].props.onPress(); assert.equal(demo.changes[0], false);
});
test('detail smoke: evidence visible only in demo and invalid IDs recover', () => {
  const nodes = harness(true).render('src/app/meeting/[id].tsx');
  assert(nodes.includes('샘플 요청서 · 2쪽: 납기 4주'));
  for (const app of [harness(false), harness(true, 'unknown')]) {
    const result = app.render('src/app/meeting/[id].tsx');
    assert(result.includes('일정을 확인할 수 없습니다. 일정에서 다시 선택해 주세요.'));
    result.find(node => node.type === 'Pressable').props.onPress(); assert.equal(app.navigation[0], '/');
  }
});
test('contacts and records smoke: demo isolation and honest empty state', () => {
  assert(!harness(false).render('src/app/(tabs)/contacts.tsx').includes('샘플테크'));
  assert(harness(true).render('src/app/(tabs)/contacts.tsx').includes('샘플테크'));
  assert(harness(false).render('src/app/(tabs)/records.tsx').includes('아직 저장된 기록이 없어요'));
});

test('note editor smoke: validate, preview, explicitly save; vehicle cannot type', () => {
  const app = harness(true, 'demo-proposal', { target: 'mobile' });
  const render = () => app.render('src/app/meeting/note.tsx');
  const press = (nodes, label) => nodes.find(node => node.type === 'Pressable' && JSON.stringify(node.props.children).includes(label)).props.onPress();
  press(render(), '저장할 내용 확인');
  assert(render().includes('메모 또는 후속 할 일을 입력해 주세요.'));
  const inputs = render().filter(node => node.type === 'TextInput');
  inputs[0].props.onChangeText('납기 기준을 확인함'); inputs[1].props.onChangeText('제안서 수정');
  press(render(), '저장할 내용 확인');
  assert.equal(app.saved.length, 0);
  assert(render().includes('저장 전 확인'));
  press(render(), '확인하고 저장');
  assert.equal(app.saved[0][1].text, '납기 기준을 확인함');
  assert.equal(app.navigation[0], '/records');
  assert(!harness(true, 'demo-proposal', { target: 'pleos' }).render('src/app/meeting/note.tsx').some(node => node.type === 'TextInput'));
});
test('records smoke: task toggle, edit navigation, deletion requires confirmation', () => {
  const note = { id: 'note1', meetingId: 'demo-proposal', text: '합의 내용', followUp: '자료 보내기', done: false, updatedAt: '2026-10-27T00:00:00Z' };
  const app = harness(true, 'demo-proposal', { target: 'mobile', notes: [note] });
  const nodes = app.render('src/app/(tabs)/records.tsx');
  const buttons = nodes.filter(node => node.type === 'Pressable');
  buttons[0].props.onPress(); assert.equal(app.toggled[0], 'note1');
  buttons[1].props.onPress(); assert.equal(app.navigation[0].params.noteId, 'note1');
  buttons[2].props.onPress(); assert.equal(app.deleted.length, 0);
  app.alerts[0][2].find(button => button.text === '삭제').onPress();
  assert.equal(app.deleted[0], 'note1');
});

test('vehicle smoke: narrow hides sources; short pages preserve progress across resize and exit', () => {
  const options = { target: 'pleos', size: { width: 420, height: 720 } };
  const app = harness(true, 'demo-proposal', options);
  const render = () => app.render('src/app/meeting/[id].tsx');
  assert(!render().includes('자료 확인'));
  options.size = { width: 640, height: 360 };
  let nodes = render();
  assert(nodes.includes('요청서의 납기는 4주입니다.'));
  const press = label => nodes.find(node => node.type === 'Pressable' && JSON.stringify(node.props.children).includes(label)).props.onPress();
  press('다음'); nodes = render(); assert(nodes.includes('제안서는 6주입니다. 납기 기준을 확인하세요.'));
  options.size = { width: 960, height: 600 }; assert(render().includes('자료 확인'));
  options.size = { width: 420, height: 360 }; nodes = render(); assert(nodes.includes('제안서는 6주입니다. 납기 기준을 확인하세요.'));
  press('장소 확인'); nodes = render(); assert(nodes.includes('가상 장소입니다. 실제 길안내는 제공하지 않습니다.'));
  press('종료'); assert.equal(app.navigation[0], '/');
});

test('settings smoke: health validation, retry and data deletion confirmation', async () => {
  const options = { health: { status: 'ok', service: 'wrong-service' } };
  const app = harness(true, 'demo-proposal', options);
  const render = () => app.render('src/features/settings/SettingsScreen.tsx', 'SettingsScreen');
  const find = (nodes, label) => nodes.find(node => node.type === 'Pressable' && JSON.stringify(node.props.children).includes(label));
  await find(render(), '서버 응답 확인').props.onPress();
  assert.equal(app.requests[0], '/health');
  assert(render().includes('서버 응답을 확인하지 못했어요.'));
  options.health = { status: 'ok', service: 'automobile-api' };
  await find(render(), '서버 응답 확인').props.onPress();
  assert(render().includes('서버가 응답하고 있어요. 계정·일정 연결은 별도로 확인해야 합니다.'));
  find(render(), '데이터 처리 안내').props.onPress(); assert.equal(app.navigation[0], '/settings/privacy');
  find(render(), '체험 종료 및 기록 삭제').props.onPress(); assert.equal(app.changes.length, 0);
  app.alerts[0][2].find(button => button.text === '종료').onPress(); assert.equal(app.changes[0], false);
  options.healthError = new Error('offline');
  await find(render(), '서버 응답 확인').props.onPress();
  assert(render().includes('서버에 연결하지 못했어요. 네트워크를 확인해 주세요.'));
  assert(harness(false).render('src/app/settings/privacy.tsx').includes('체험 데이터'));
});

test('Pleos home is a vehicle surface, with no mobile calendar or management screens', () => {
  const options = { target: 'pleos' };
  const connection = harness(false, 'demo-proposal', options).render('src/features/workspace/WorkspaceScreen.tsx', 'WorkspaceScreen');
  assert(connection.includes('휴대폰과 연결해 미팅을 준비하세요'));
  assert(!connection.includes('캘린더를 연결해 주세요'));
  const app = harness(true, 'demo-proposal', options);
  let nodes = app.render('src/features/workspace/WorkspaceScreen.tsx', 'WorkspaceScreen');
  assert(nodes.includes('서비스 도입 제안 미팅'));
  assert(!nodes.includes('프로젝트 진행 점검'));
  nodes.find(node => node.type === 'Pressable' && JSON.stringify(node.props.children).includes('다음 일정')).props.onPress();
  nodes = app.render('src/features/workspace/WorkspaceScreen.tsx', 'WorkspaceScreen');
  assert(nodes.includes('프로젝트 진행 점검'));
  for (const file of ['src/app/(tabs)/contacts.tsx', 'src/app/(tabs)/records.tsx']) {
    const result = harness(false, 'demo-proposal', options).render(file);
    assert(result.includes('휴대폰과 연결해 미팅을 준비하세요'));
  }
  const settings = harness(false, 'demo-proposal', options).render('src/features/settings/SettingsScreen.tsx', 'SettingsScreen');
  assert(settings.includes('휴대폰으로 차량 연결'));
  assert(!settings.includes('Google Calendar'));
});

test('documents smoke: pick cancellation, successful attachment and explicit removal', async () => {
  const options = {};
  const app = harness(true, 'demo-proposal', options);
  const render = () => app.render('src/app/meeting/documents.tsx');
  const press = (nodes, label) => nodes.find(node => node.type === 'Pressable' && JSON.stringify(node.props.children).includes(label)).props.onPress();
  await press(render(), 'PDF 첨부'); assert.equal(app.attached.length, 0);
  options.fileError = new Error('PDF 형식을 확인하지 못했습니다.');
  await press(render(), 'PDF 첨부'); assert(render().includes('PDF 형식을 확인하지 못했습니다.'));
  delete options.fileError;
  options.file = { uri: 'file:///cache/preve-documents/one.pdf', name: 'request.pdf', size: 1000 };
  await press(render(), 'PDF 첨부'); assert.equal(app.attached[0].meetingId, 'demo-proposal');
  options.documents = [{ ...options.file, id: 'doc1', meetingId: 'demo-proposal', status: 'attached' }];
  assert(render().includes('첨부됨 · 서버 분석 연결 대기'));
  press(render(), '첨부 삭제'); assert.equal(app.removedDocuments.length, 0);
  app.alerts[0][2].find(button => button.text === '삭제').onPress();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(app.removedDocuments[0], 'doc1');
  assert(!harness(true, 'demo-proposal', { target: 'pleos' }).render('src/app/meeting/documents.tsx').includes('PDF 첨부'));
});
test('unprocessed attachments never inherit the sample analysis', () => {
  const app = harness(true, 'demo-proposal', { documents: [{ id: 'doc1', meetingId: 'demo-proposal', name: 'actual.pdf', size: 1 }] });
  const nodes = app.render('src/app/meeting/[id].tsx');
  assert(!nodes.includes('샘플 요청서 · 2쪽: 납기 4주'));
  assert(nodes.includes('첨부된 파일은 아직 분석되지 않았습니다. 분석 완료 후 브리핑을 확인할 수 있어요.'));
});

test('Google login opens without a checkbox and creates session only after agreement', async () => {
 const options={googleConfigured:true};const app=harness(false,'demo-proposal',options);
 const render=()=>app.render('src/features/auth/LoginScreen.tsx','LoginScreen');
 const google=()=>render().find(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='Google로 계속하기');
 assert.equal(google().props.disabled,false);assert(!render().some(n=>n.props?.accessibilityRole==='checkbox'));
 await google().props.onPress();await new Promise(r=>setImmediate(r));assert.equal(app.signIns.length,0);assert(render().includes('프리브 이용 동의'));
 const accept=()=>render().find(n=>n.type==='Pressable'&&JSON.stringify(n.props.children).includes('필수 항목에 동의하고 시작하기'));
 await accept().props.onPress();await new Promise(r=>setImmediate(r));assert.equal(app.signIns.length,1);
 options.googleError=new Error('cancelled');await google().props.onPress();await new Promise(r=>setImmediate(r));assert(render().includes('로그인을 취소했어요.'));
});
test('declining terms never creates a service session', async()=>{
 const app=harness(false,'demo-proposal',{googleConfigured:true});const render=()=>app.render('src/features/auth/LoginScreen.tsx','LoginScreen');
 render().find(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='Google로 계속하기').props.onPress();await new Promise(r=>setImmediate(r));
 render().find(n=>n.type==='Pressable'&&JSON.stringify(n.props.children).includes('동의하지 않고 돌아가기')).props.onPress();await new Promise(r=>setImmediate(r));
 assert.equal(app.signIns.length,0);assert(!render().includes('프리브 이용 동의'));
});

test('real meeting documents require AI consent before upload; demo stays local', async()=>{
 const file={id:'document-request-001',name:'real.pdf',uri:'file:///cache/real.pdf',size:1000,meetingId:'live'};
 // This component accepts props; exercise it through the route with a selected local file.
 const route=harness(false,'live',{session:{userId:'user'},liveMeeting:{id:'live',title:'실제 일정'},documents:[file]});
 const nodes=()=>route.render('src/app/meeting/documents.tsx');
 const button=()=>nodes().find(node=>node.type==='Pressable'&&JSON.stringify(node.props.children).includes('서버에 보내 분석하기'));
 assert.equal(button().props.disabled,true);await button().props.onPress();assert.equal(route.requests.length,0);
 nodes().find(node=>node.type==='Pressable'&&node.props.accessibilityRole==='checkbox').props.onPress();
 await button().props.onPress();assert.equal(route.requests[0][0],'live');assert.equal(route.attached[0][1],'server-doc');
 assert(!harness(true).render('src/app/meeting/documents.tsx').includes('서버에 보내 분석하기'));
});

test('analysis screen pauses in background, renders page evidence and stops after blur',async()=>{
 const options={session:{userId:'user'},liveMeeting:{id:'live',title:'실제 일정'},appState:'background',remoteDocuments:[{documentId:'remote',fileName:'ready.pdf',pageCount:2,status:'ready',analysis:{summary:'납기 차이를 확인하세요',facts:[{text:'요청 납기 4주',quote:'4 weeks',page:1}],openQuestions:['최종 납기는?'],warnings:[]}}]};
 const app=harness(false,'live',options);app.render('src/app/meeting/documents.tsx');const cleanup=app.effects[0]();
 await new Promise(resolve=>setImmediate(resolve));assert.equal(app.requests.length,0);
 options.appState='active';app.appEvents[0]('active');await new Promise(resolve=>setImmediate(resolve));
 const nodes=app.render('src/app/meeting/documents.tsx');assert(nodes.includes('납기 차이를 확인하세요'));assert(nodes.includes('4 weeks'));assert(nodes.includes('AI 추출 · 원문 확인 필요'));
 cleanup();const calls=app.requests.length;app.appEvents[0]('active');await new Promise(resolve=>setImmediate(resolve));assert.equal(app.requests.length,calls);
});

test('login account is guided into calendar import before the schedule',async()=>{
 const options={session:{userId:'user'},calendarOnboarding:true};const app=harness(false,'demo-proposal',options);const render=()=>app.render('src/features/workspace/WorkspaceScreen.tsx','WorkspaceScreen');
 assert(render().includes('Google 일정 불러오기'));assert(!render().some(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='새로고침'));
 const importButton=render().find(n=>n.type==='Pressable'&&JSON.stringify(n.props.children).includes('동의하고 Google 일정 불러오기'));await importButton.props.onPress();await new Promise(r=>setImmediate(r));assert.deepEqual(app.requests,['calendar-connect']);assert(render().includes('새로고침'));
});
test('connected Calendar uses the single schedule refresh control without another consent prompt',async()=>{
 const app=harness(false,'demo-proposal',{session:{userId:'user'},calendarConnected:true});const nodes=app.render('src/features/meetings/LiveMeetings.tsx','LiveMeetings');assert(!nodes.includes('동의하고 Google 일정 불러오기'));assert(!nodes.includes('Google 캘린더 연결·새로고침'));
 await nodes.find(n=>n.type==='Pressable'&&JSON.stringify(n.props.children).includes('새로고침')).props.onPress();assert.deepEqual(app.requests,['calendar-refresh']);
});

test('mobile pairing previews the vehicle code and never approves just from lookup',async()=>{
 const app=harness(false,'demo-proposal',{session:{userId:'user'}});const render=()=>app.render('src/features/pairing/MobilePairing.tsx','MobilePairing');
 render().find(n=>n.type==='TextInput').props.onChangeText('012-345');
 await render().find(n=>n.type==='Pressable'&&JSON.stringify(n.props.children).includes('차량 코드 확인')).props.onPress();await new Promise(r=>setImmediate(r));
 assert.equal(app.requests.length,1);assert.equal(app.requests[0][0],'resolve');assert(render().includes('012-345'));
 await render().find(n=>n.type==='Pressable'&&JSON.stringify(n.props.children).includes('코드 확인 후 차량 연결 승인')).props.onPress();await new Promise(r=>setImmediate(r));assert.equal(app.requests[1][2],true);
});
test('live vehicle shows owned meetings without mobile calendar controls',()=>{
 const app=harness(false,'real',{target:'pleos',session:{userId:'user',target:'pleos'},liveMeetings:[{id:'real',title:'실제 차량 일정',time:'오늘',location:'서울'}]});
 const nodes=app.render('src/features/meetings/VehicleHome.tsx','VehicleHome');assert(nodes.includes('실제 차량 일정'));assert(nodes.includes('휴대폰 계정과 연결됨'));assert(!nodes.includes('Google 캘린더 연결·새로고침'));assert(!nodes.includes('체험 모드 · 가상 일정'));
});

test('live vehicle briefing reads owned analysis without demo text or upload controls',async()=>{
 const options={target:'pleos',session:{userId:'user',target:'pleos'},liveMeeting:{id:'live',title:'실제 미팅',time:'오늘',location:'서울'},remoteDocuments:[{documentId:'doc',fileName:'실제자료.pdf',status:'ready',analysis:{summary:'실제 자료에서 확인한 납기',facts:[{text:'납기 4주',page:1,quote:'4 weeks'}],openQuestions:[]}}]};
 const app=harness(false,'live',options);const render=()=>app.render('src/app/meeting/[id].tsx');render();app.effects[0]();await new Promise(r=>setImmediate(r));const nodes=render();assert(nodes.includes('실제 자료에서 확인한 납기'));assert(!nodes.includes('샘플 자료 기반 · 실제 AI 분석 결과가 아닙니다'));assert(!nodes.includes('서버에 보내 분석하기'));assert.equal(app.requests[0][0],'list');
});

 test('QR lookup still requires explicit vehicle approval',async()=>{
 const app=harness(false,'',{session:{userId:'test'}});const render=()=>app.render('src/features/pairing/MobilePairing.tsx','MobilePairing');
 render().find(n=>n.type==='Pressable'&&JSON.stringify(n.props.children).includes('차량 QR 스캔')).props.onPress();
 await render().find(n=>n.type==='PairingScanner').props.onCode('012345');await new Promise(r=>setImmediate(r));
 assert.equal(app.requests[0][0],'resolve');assert.equal(app.requests[0][1],'012345');assert(!app.requests.some(r=>r[0]==='decide'));assert(render().includes('012-345'));
 });

test('vehicle screens fill their pane while mobile keeps its reading width',()=>{
 const vehicle=harness(false,'',{target:'pleos',session:{}}).render('src/features/meetings/VehicleLiveHome.tsx','VehicleLiveHome');
 const scroll=vehicle.find(n=>n.type==='ScrollView');assert.equal(scroll.props.contentContainerStyle.flexGrow,1);assert.equal(scroll.props.children.props.style.maxWidth,undefined);
 const button=vehicle.find(n=>n.type==='Pressable');assert(button.props.style({pressed:false}).minHeight>=80);assert.equal(button.props.style({pressed:false}).aspectRatio,1);
});

test('vehicle calendar requires pairing and selecting a day only shows its meetings',()=>{
 const now=new Date();const key=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-15';const app=harness(false,'',{target:'pleos',session:{},liveMeetings:[{id:'calendar-test',title:'달력 테스트',startsAt:key+'T01:00:00Z',source:'manual',time:'10:00',location:'테스트'}]});
 const render=()=>app.render('src/features/meetings/VehicleCalendar.tsx','VehicleCalendar');let nodes=render();const day=nodes.find(n=>n.type==='Pressable'&&n.props.accessibilityLabel===key+' 일정 1개');assert(day);day.props.onPress();nodes=render();assert(nodes.includes('달력 테스트'));assert(nodes.some(n=>n.type==='Pressable'&&JSON.stringify(n.props.children).includes('이 일정 준비하기')));
 const unauth=harness(false,'',{target:'pleos'}).render('src/features/meetings/VehicleCalendar.tsx','VehicleCalendar');assert(unauth.includes('휴대폰 계정을 연결하면 일정을 볼 수 있어요.'));assert(!unauth.includes('달력 테스트'));
});

test('square vehicle actions reflow to two, three and four columns using actual pane width',()=>{
 const app=harness(false,'',{target:'pleos',session:{}});const render=()=>app.render('src/features/meetings/VehicleLiveHome.tsx','VehicleLiveHome');
 for(const [width,columns] of [[600,2],[900,3],[1300,4]]){render().find(n=>n.type==='View'&&n.props.onLayout).props.onLayout({nativeEvent:{layout:{width}}});const button=render().find(n=>n.type==='Pressable');const style=button.props.style({pressed:false});assert(Math.abs(style.width*columns+16*(columns-1)-width)<0.01);assert.equal(style.aspectRatio,1);}
});

test('vehicle tile icons and one or two-line labels share fixed centered slots',()=>{
 for(const width of [420,960,1700]){
 const nodes=harness(false,'',{target:'pleos',size:{width,height:720},session:{},liveMeetings:[{id:'tile-test',title:'테스트',time:'10:00',location:'테스트'}]}).render('src/features/meetings/VehicleLiveHome.tsx','VehicleLiveHome');const tiles=nodes.filter(n=>n.type==='Pressable');assert.equal(nodes.filter(n=>n.type==='Svg').length,tiles.length);const sizes=[];
 for(const tile of tiles){const frame=tile.props.children;assert.equal(frame.props.style.alignItems,'center');const [icon,label]=frame.props.children;sizes.push([icon.props.style.width,icon.props.style.height,label.props.style.height]);assert.equal(icon.props.style.width,icon.props.style.height);assert.equal(label.props.style.justifyContent,'center');assert.equal(label.props.children.props.numberOfLines,2);assert.equal(label.props.children.props.style.includeFontPadding,false);assert.equal(label.props.children.props.style.textAlign,'center');}
 assert(sizes.every(size=>JSON.stringify(size)===JSON.stringify(sizes[0])));
 }
});

test('vehicle previous and next meeting navigation are symmetric and disabled for a single meeting',()=>{
 const meetings=[{id:'a',title:'일정 A',time:'10:00',location:''},{id:'b',title:'일정 B',time:'11:00',location:''}];const app=harness(false,'',{target:'pleos',session:{},liveMeetings:meetings});const render=()=>app.render('src/features/meetings/VehicleLiveHome.tsx','VehicleLiveHome');const press=label=>render().find(n=>n.type==='Pressable'&&n.props.accessibilityLabel===label).props.onPress();assert(render().includes('일정 A'));press('이전 일정');assert(render().includes('일정 B'));press('다음 일정');assert(render().includes('일정 A'));
 const single=harness(false,'',{target:'pleos',session:{},liveMeetings:[meetings[0]]}).render('src/features/meetings/VehicleLiveHome.tsx','VehicleLiveHome');for(const label of ['이전 일정','다음 일정'])assert(single.find(n=>n.type==='Pressable'&&n.props.accessibilityLabel===label).props.disabled);
});
test('vehicle refresh exposes a spinner in both the status and the disabled refresh card',async()=>{
 const options={target:'pleos',session:{},loadingMeetings:false};const app=harness(false,'',options);const render=()=>app.render('src/features/meetings/VehicleLiveHome.tsx','VehicleLiveHome');await render().find(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='일정 새로고침').props.onPress();assert.deepEqual(app.requests,['vehicle-refresh']);options.loadingMeetings=true;const nodes=harness(false,'',options).render('src/features/meetings/VehicleLiveHome.tsx','VehicleLiveHome');assert(nodes.filter(n=>n.props?.accessibilityRole==='progressbar').length>=2);const refresh=nodes.find(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='일정 새로고침');assert(refresh.props.disabled);assert(refresh.props.accessibilityState.busy);
});
test('calendar has no scroll container, pinned controls, icon month navigation and day agenda pagination',()=>{
 const date=new Date();const day=date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-15';const meetings=['첫 일정','둘째 일정'].map((title,i)=>({id:'day-'+i,title,startsAt:day+'T01:00:00Z',source:'manual',time:'10:00',location:'장소'}));
 for(const size of [{width:420,height:360},{width:420,height:720},{width:900,height:720},{width:1700,height:1200}]){const app=harness(false,'',{target:'pleos',session:{},size,liveMeetings:meetings});const render=()=>app.render('src/features/meetings/VehicleCalendar.tsx','VehicleCalendar');let nodes=render();assert(!nodes.some(n=>n.type==='ScrollView'));const root=nodes.find(n=>n.type==='SafeAreaView');const footer=nodes.find(n=>n.props?.testID==='vehicle-calendar-footer');assert(root.props.children.includes(footer));assert.equal(footer.props.style.flexShrink,0);for(const label of ['이전 달','다음 달']){const button=nodes.find(n=>n.type==='Pressable'&&n.props.accessibilityLabel===label);assert(button);assert(!nodes.includes(label));}nodes.find(n=>n.type==='Pressable'&&n.props.accessibilityLabel===day+' 일정 2개').props.onPress();nodes=render();assert(nodes.includes('첫 일정'));assert(!nodes.includes('둘째 일정'));nodes.find(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='다음 일정').props.onPress();assert(render().includes('둘째 일정'));render().find(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='이전 일정').props.onPress();assert(render().includes('첫 일정'));}
});
test('connected vehicle controls share a horizontal square card row',()=>{
 const nodes=harness(false,'',{target:'pleos',session:{}}).render('src/features/meetings/VehicleConnection.tsx','VehicleConnection');const buttons=nodes.filter(n=>n.type==='Pressable');assert.equal(buttons.length,2);assert(buttons.some(n=>n.props.accessibilityLabel==='차량 연결 해제'));assert(buttons.some(n=>n.props.accessibilityLabel==='미팅 화면으로 돌아가기'));const row=nodes.find(n=>n.type==='View'&&n.props.onLayout);assert.equal(row.props.style.flexWrap,'nowrap');for(const button of buttons){const style=button.props.style({pressed:false});assert.equal(style.width,style.height);}
});

test('manual meeting fields have persistent labels and format help',()=>{const nodes=harness(false,'',{session:{}}).render('src/app/meeting/create.tsx');for(const label of ['일정명','날짜','시간','장소'])assert(nodes.includes(label));assert(nodes.some(n=>typeof n==='string'&&n.includes('YYYY-MM-DD')));assert(nodes.some(n=>typeof n==='string'&&n.includes('HH:mm')));});
test('PDF return action is pinned outside scrolling content and encoded failure names are readable',async()=>{const options={session:{},liveMeeting:{id:'live',title:'미팅'},remoteDocuments:[{documentId:'doc',fileName:'%ED%95%9C%EA%B8%80.pdf',pageCount:2,size:1000,status:'failed',error:'AI_INCOMPLETE',analysis:null}]};const app=harness(false,'live',options);const render=()=>app.render('src/app/meeting/documents.tsx');render();app.effects[0]();await new Promise(r=>setImmediate(r));const nodes=render();const footer=nodes.find(n=>n.type==='SafeAreaView'&&n.props.edges?.includes('bottom'));assert(footer);assert(JSON.stringify(footer.props.children).includes('미팅 상세로 돌아가기'));assert(nodes.includes('한글.pdf'));assert(nodes.some(n=>typeof n==='string'&&n.includes('응답이 끝까지 완료되지')));const progress=nodes.find(n=>n.props?.accessibilityRole==='progressbar');assert.equal(progress.props.accessibilityValue.now,2);const name=nodes.find(n=>n.type==='Text'&&n.props.children==='한글.pdf');assert.equal(name.props.style.fontSize,17);});

const contactSession={userId:'owner',target:'mobile'};
const contactFixture={id:'12345678-1234-1234-1234-123456789abc',companyName:'스모크 거래처',personName:'가상 담당자',position:'매니저',contactInfo:'test@example.invalid',preferences:'서면 연락 선호'};
const settle=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};
const clickLabel=(nodes,label)=>{const button=nodes.find(node=>node.type==='Pressable'&&JSON.stringify(node.props.children).includes(label));assert(button,'missing button: '+label);button.props.onPress();};
test('real contacts: visible labels, required company, save/search/edit and confirmed delete',async()=>{
 const app=harness(false,undefined,{session:contactSession,contacts:[]});const render=()=>app.render('src/app/(tabs)/contacts.tsx');render();app.effects[0]();await settle();
 clickLabel(render(),'거래처 등록');let nodes=render();assert(nodes.includes('거래처명 (필수)'));assert(nodes.includes('담당자명 (선택)'));clickLabel(nodes,'저장');await settle();assert(render().includes('거래처명을 입력해 주세요.'));assert.equal(app.requests.length,0);
 let inputs=render().filter(n=>n.type==='TextInput');inputs.find(n=>n.props.accessibilityLabel==='거래처명 (필수)').props.onChangeText('스모크 거래처');inputs.find(n=>n.props.accessibilityLabel==='담당자명 (선택)').props.onChangeText('가상 담당자');clickLabel(render(),'저장');await settle();assert.equal(app.requests[0][0],'contact-save');assert(render().includes('스모크 거래처'));
 render().find(n=>n.type==='TextInput').props.onChangeText('없는 업체');assert(render().includes('검색 결과가 없습니다.'));render().find(n=>n.type==='TextInput').props.onChangeText('');clickLabel(render(),'수정');assert(render().includes('거래처 수정'));clickLabel(render(),'취소');clickLabel(render(),'삭제');assert.equal(app.requests.filter(r=>r[0]==='contact-delete').length,0);app.alerts[0][2].find(b=>b.text==='삭제').onPress();await settle();assert.equal(app.requests.filter(r=>r[0]==='contact-delete').length,1);
});
test('meeting contact: load selection, link and unlink without changing demo or vehicle routes',async()=>{
 const app=harness(false,undefined,{session:contactSession,contacts:[contactFixture],liveMeeting:{id:'meeting',title:'Actual',company:'',location:'',time:'',contact:''}});const render=()=>app.render('src/app/meeting/[id].tsx');render();app.effects[0]();await settle();clickLabel(render(),'거래처 연결');await settle();clickLabel(render(),'스모크 거래처');await settle();assert(render().includes('확인한 선호: 서면 연락 선호'));assert(app.requests.some(r=>r[0]==='contact-link'&&r[2]===contactFixture.id));clickLabel(render(),'거래처 연결 해제');await settle();assert(app.requests.some(r=>r[0]==='contact-link'&&r[2]===null));
});

test('connected vehicle home opens the dedicated voice screen',()=>{const app=harness(false,'',{target:'pleos',session:{}});const nodes=app.render('src/features/meetings/VehicleLiveHome.tsx','VehicleLiveHome');nodes.find(n=>n.type==='Pressable'&&n.props.accessibilityLabel==='프리브와 대화').props.onPress();assert(app.navigation.includes('/vehicle/voice'));});

test('vehicle home defaults to today or upcoming rather than past meetings',()=>{const nodes=harness(false,'',{target:'pleos',session:{},liveMeetings:[{id:'past',title:'과거 제외',startsAt:'2000-01-01T00:00:00Z',time:'과거',location:''},{id:'future',title:'다가올 미팅',startsAt:'2099-01-01T00:00:00Z',time:'예정',location:''}]}).render('src/features/meetings/VehicleLiveHome.tsx','VehicleLiveHome');assert(nodes.includes('다가올 미팅'));assert(!nodes.includes('과거 제외'));});
