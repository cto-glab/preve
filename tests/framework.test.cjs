const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const { resolveTarget } = require('../config/targets.cjs');

function loadTypeScript(file) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, require, fetch, Headers, URL, AbortController, setTimeout, clearTimeout });
  return exports;
}
test('targets are isolated and unknown targets fail closed', () => {
  assert.notEqual(resolveTarget('mobile').package, resolveTarget('pleos').package);
  assert.throws(() => resolveTarget('web'));
  const config = require('../app.config.js');
  const original = process.env.APP_TARGET;
  try {
    process.env.APP_TARGET = 'mobile'; const phone = config().expo;
    process.env.APP_TARGET = 'pleos'; const car = config().expo;
    assert(!phone.plugins.includes('./plugins/with-pleos'));
    assert(car.plugins.includes('./plugins/with-pleos'));
    assert.equal(car.orientation, 'default');
    assert(!JSON.stringify(phone).includes('ac197be4'));
    assert(phone.android.blockedPermissions.includes('android.permission.READ_SMS'));
  } finally { if (original === undefined) delete process.env.APP_TARGET; else process.env.APP_TARGET = original; }
});
test('layout prioritizes low height even in a wide window', () => {
  const { getLayoutMode } = loadTypeScript('src/platform/layout.ts');
  assert.equal(getLayoutMode(960, 360), 'short');
  assert.equal(getLayoutMode(420, 720), 'narrow');
  assert.equal(getLayoutMode(960, 600), 'wide');
});
test('API does not contact an unconfigured server or allow origin escape', async () => {
  const { createApiClient } = loadTypeScript('src/api/client.ts');
  let calls = 0;
  const fetcher = async () => { calls++; return new Response('{}'); };
  await assert.rejects(createApiClient({ baseUrl: null, fetcher }).request('/v1/test'), { code: 'not-configured' });
  await assert.rejects(createApiClient({ baseUrl: 'https://api.example.com', fetcher }).request('//other.example.com'));
  assert.equal(calls, 0);
});
test('API injects bearer token, preserves HTTP failure, and times out', async () => {
  const { createApiClient } = loadTypeScript('src/api/client.ts');
  const api = createApiClient({ baseUrl: 'https://api.example.com/', getAccessToken: async () => 'test-token',
    fetcher: async (url, init) => {
      assert.equal(url, 'https://api.example.com/v1/test');
      assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
      return new Response('{}', { status: 401 });
    },
  });
  await assert.rejects(api.request('/v1/test'), { code: 'http', status: 401 });
  const slow = createApiClient({ baseUrl: 'https://api.example.com', timeoutMs: 10,
    fetcher: (_, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')))),
  });
  await assert.rejects(slow.request('/v1/test'), { code: 'timeout' });
});

test('meeting demo is opt-in and rejects missing or unrelated meeting IDs', () => {
  const { findMeeting, demoMeetings } = loadTypeScript('src/features/meetings/demo.ts');
  assert.equal(findMeeting('demo-proposal', false), undefined);
  assert.equal(findMeeting('missing', true), undefined);
  assert.equal(findMeeting('demo-proposal', true).evidence.length, 2);
  assert.equal(findMeeting('demo-followup', true).evidence.length, 0);
  assert.equal(new Set(demoMeetings.map(item => item.id)).size, demoMeetings.length);
});

test('notes validate bounds and isolate meeting ownership; tasks reset and clear', () => {
  const { normalizeNote, notesReducer } = loadTypeScript('src/features/records/model.ts');
  assert.throws(() => normalizeNote({ text: '  ', followUp: '' }));
  assert.throws(() => normalizeNote({ text: 'x'.repeat(2001), followUp: '' }));
  const note = { id: 'one', meetingId: 'a', text: ' agreed ', followUp: ' send ', done: false, updatedAt: 'now' };
  let notes = notesReducer([], { type: 'save', note });
  assert.equal(notes[0].text, 'agreed');
  notes = notesReducer(notes, { type: 'toggle', id: 'one' }); assert.equal(notes[0].done, true);
  assert.throws(() => notesReducer(notes, { type: 'save', note: { ...note, meetingId: 'b' } }));
  notes = notesReducer(notes, { type: 'save', note: { ...note, followUp: '', done: true } });
  assert.equal(notes[0].done, false);
  assert.equal(notesReducer(notes, { type: 'delete', id: 'one' }).length, 0);
  assert.equal(notesReducer(notes, { type: 'clear' }).length, 0);
});

test('API retries unauthorized access only once with a renewed service token', async () => {
 const { createApiClient } = loadTypeScript('src/api/client.ts'); let calls=0, refreshes=0;
 const client=createApiClient({baseUrl:'https://api.example.com',getAccessToken:async()=> 'old',onUnauthorized:async old=>{assert.equal(old,'old');refreshes++;return 'new';},fetcher:async(url,init)=>{calls++;assert.equal(init.headers.get('Authorization'),'Bearer '+(calls===1?'old':'new'));return new Response('{}',{status:401});}});
 await assert.rejects(client.request('/private'),{code:'http',status:401});assert.equal(calls,2);assert.equal(refreshes,1);
});

test('Pleos Gradle settings exclude the local mobile Google auth module idempotently', () => {
 const source = fs.readFileSync('plugins/with-pleos.js','utf8');
 const module = {exports:{}};
 const config = {modResults:{contents:'expoAutolinking.useExpoModules()'}};
 const mocks = { withDangerousMod:value=>value, withAndroidManifest: value=>value, withGradleProperties:value=>value, withSettingsGradle:(value,transform)=>transform(value) };
 vm.runInNewContext(source,{module,require:()=>mocks,Error});
 module.exports(config); const once=config.modResults.contents;
 assert(once.includes("expoAutolinking.exclude = (expoAutolinking.exclude ?: []) + ['preve-google-auth', 'expo-camera']"));
 module.exports(config); assert.equal(config.modResults.contents,once);
});
