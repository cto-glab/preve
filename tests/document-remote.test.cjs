const { test } = require('node:test'); const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const cache = new Map();
function load(file) { file=path.resolve(file);if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(source,{exports,require:name=>load(path.resolve(path.dirname(file),name)+'.ts'),Error,Date,fetch,Headers,URL,AbortController,setTimeout,clearTimeout,FormData});return exports; }
const {createDocumentApi,parseRemoteDocument}=load('src/features/documents/remote.ts');
const id='11111111-1111-4111-8111-111111111111';
const document=()=>({documentId:id,meetingId:'meeting',fileName:'request.pdf',size:1000,pageCount:2,status:'ready',error:null,analysis:{source:'openai',model:'test',pageCount:2,summary:'납기 확인',facts:[{kind:'delivery',text:'4주',page:1,quote:'4 weeks'}],openQuestions:[],warnings:[],evidenceVerification:'ai-extracted',analyzedAt:'2026-10-28T00:00:00Z'}});
test('document transport requires consent and sends stable key without forcing a multipart boundary',async()=>{
 const calls=[];const parts=[];const api=createDocumentApi({request:async(...args)=>{calls.push(args);return {documentId:id,status:'queued'};}},()=>({append:(...args)=>parts.push(args)}));
 const file={uri:'file:///cache/request.pdf',name:'request.pdf',size:1000};
 await assert.rejects(api.upload('meeting',file,'request-key-000001',false));assert.equal(calls.length,0);
 await api.upload('meeting',file,'request-key-000001',true);assert.equal(calls[0][2].timeoutMs,60000);assert.equal(calls[0][1].headers['X-AI-Consent'],'document-analysis-2026-10-28');assert.equal(calls[0][1].headers['Content-Type'],undefined);assert.equal(parts[0][1].uri,file.uri);
 await assert.rejects(api.retry(id,false));assert.equal(calls.length,1);
});
test('document parsing preserves evidence and rejects fake-ready or out-of-page facts',()=>{
 assert.equal(parseRemoteDocument(document()).analysis.facts[0].page,1);
 assert.throws(()=>parseRemoteDocument({...document(),analysis:null}),{code:'invalid-response'});
 const broken=document();broken.analysis.facts[0].page=3;assert.throws(()=>parseRemoteDocument(broken),{code:'invalid-response'});
 const queued={...document(),status:'queued',analysis:null};assert.equal(parseRemoteDocument(queued).analysis,null);
});
