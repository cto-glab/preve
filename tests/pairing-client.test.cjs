const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function load(){const requests=[];const exports={};class ApiError extends Error{};const preview={pairId:'12345678-1234-1234-1234-123456789abc',userCode:'012-345',deviceName:'Vehicle',expiresAt:'2099-01-01T00:00:00.000Z'};
 const transport={request:async(path,init)=>{requests.push({path,body:init?.body});return path.endsWith('/token')?{state:'connected',session:{target:'mobile'}}:{...preview,deviceSecret:'s'.repeat(43),intervalSeconds:3};}};
 const source=ts.transpileModule(fs.readFileSync('src/features/pairing/api.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(source,{exports,require:name=>name==='../../api'?{api:transport}:name==='../../auth/runtime'?{authApi:transport}:name==='../../auth/session-model'?{parseSession:v=>v}:{ApiError},Error,Date});return {...exports,requests,preview};}
test('pairing DTO strips secrets from mobile preview and rejects malformed requests',()=>{const m=load();assert.equal(m.parsePairing({...m.preview,deviceSecret:'secret'}).deviceSecret,undefined);assert.throws(()=>m.parsePairing({...m.preview,userCode:'wrong'}));assert.throws(()=>m.parsePairing({...m.preview,expiresAt:'bad'}));});
test('vehicle exchange keeps the secret in the POST body and rejects mobile sessions',async()=>{const m=load();const request=await m.createPairing();await assert.rejects(m.pollPairing(request));const call=m.requests[1];assert.equal(call.path,'/v1/auth/pairings/token');assert(!call.path.includes(request.deviceSecret));assert.equal(JSON.parse(call.body).deviceSecret,request.deviceSecret);});

test('QR roundtrip preserves leading zeros and rejects foreign URLs or injected parameters',()=>{
 const exports={};const source=ts.transpileModule(fs.readFileSync('src/features/pairing/qr.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(source,{exports,Error});
 assert.equal(exports.parsePairingQr(exports.pairingQr('012-345')),'012345');
 for(const value of ['https://evil/pair?code=012345','preve-mobile://pair?code=012345&secret=abc','preve-mobile://pair?code=ABCDEF','preve-mobile://pair?code=12345'])assert.equal(exports.parsePairingQr(value),null);
});
