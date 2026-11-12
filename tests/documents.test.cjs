const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, esModuleInterop: true, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(source, { exports, require: name => name === './model' ? load('src/features/documents/model.ts') : name==='./file-name'?load('src/features/documents/file-name.ts'):mocks[name], Error });
  return exports;
}
function files(options = {}) {
  const copied = [], deleted = [];
  const value = load('src/features/documents/files.ts', {
    'expo-document-picker': { getDocumentAsync: async () => options.cancel ? { canceled: true } : { canceled: false, assets: [{ uri: 'file:///cache/picker.pdf', name: 'request.pdf', size: 10 }] } },
    'expo-file-system/legacy': { cacheDirectory: 'file:///cache/', EncodingType: { Base64: 'base64' },
      getInfoAsync: async () => ({ exists: true, isDirectory: false, size: options.size || 1000 }),
      readAsStringAsync: async () => options.signature || 'JVBERi0=', makeDirectoryAsync: async () => {},
      copyAsync: async input => copied.push(input), deleteAsync: async uri => deleted.push(uri),
    },
  });
  return { ...value, copied, deleted };
}
test('file picker cancels cleanly and rejects forged or oversized PDF before copying', async () => {
  const cancelled = files({ cancel: true }); assert.equal(await cancelled.pickLocalPdf(), null); assert.equal(cancelled.copied.length, 0);
  const fake = files({ signature: 'not-pdf' }); await assert.rejects(fake.pickLocalPdf()); assert.equal(fake.copied.length, 0);
  const large = files({ size: 21 * 1024 * 1024 }); await assert.rejects(large.pickLocalPdf()); assert.equal(large.copied.length, 0);
});
test('file operations own a private cache copy and refuse deleting original files', async () => {
  const app = files(); const picked = await app.pickLocalPdf();
  assert(picked.uri.startsWith('file:///cache/preve-documents/'));
  assert.equal(picked.size, 1000); assert.equal(app.copied.length, 1);
  assert.equal(app.deleted[0], 'file:///cache/preve-documents/');
  app.deleted.length = 0;
  await app.deleteLocalPdf(picked.uri); assert.equal(app.deleted[0], picked.uri);
  await assert.rejects(app.deleteLocalPdf('file:///Downloads/original.pdf')); assert.equal(app.deleted.length, 1);
});

test('PDF picker model decodes Korean URI names without treating literal percent as an escape',()=>{const {validateLocalPdf}=load('src/features/documents/model.ts');assert.equal(validateLocalPdf({uri:'file:///a.pdf',name:'%ED%95%9C%EA%B8%80%20%EC%9E%90%EB%A3%8C%2Epdf',size:100}).name,'한글 자료.pdf');assert.equal(validateLocalPdf({uri:'file:///a.pdf',name:'50%할인.pdf',size:100}).name,'50%할인.pdf');});
