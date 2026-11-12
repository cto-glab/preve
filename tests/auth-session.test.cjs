const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const vm = require('node:vm'); const ts = require('typescript');
const cache = new Map();
function load(file) {
 file = path.resolve(file); if (cache.has(file)) return cache.get(file);
 const exports = {}; cache.set(file, exports);
 const source = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(source,{exports,require:name=>load(path.resolve(path.dirname(file),name)+'.ts'),Error,Date,fetch,Headers,URL,AbortController,setTimeout,clearTimeout});return exports;
}
const { SessionManager } = load('src/auth/manager.ts'); const { ApiError } = load('src/api/client.ts');
const now = Date.now();
const initial = () => ({ userId:'user',sessionId:'session',target:'mobile',accessToken:'a'.repeat(43),refreshToken:'r'.repeat(64),expiresAt:new Date(now-1000).toISOString(),refreshExpiresAt:new Date(now+86400000).toISOString() });
const renewed = () => ({...initial(),accessToken:'b'.repeat(43),refreshToken:'s'.repeat(64),expiresAt:new Date(now+600000).toISOString()});
function store(session) { const writes=[];let clears=0;return {read:async()=>session,write:async value=>writes.push(value),clear:async()=>{clears++;},writes,clears:()=>clears}; }
test('concurrent expired API calls share one refresh and rotate storage once',async()=>{
 const storage=store(initial());let calls=0;
 const manager=new SessionManager(storage,{refresh:async()=>{calls++;return renewed();},logout:async()=>{}},()=>now);
 const tokens=await Promise.all([manager.accessToken(),manager.accessToken(),manager.accessToken()]);
 assert(tokens.every(token=>token==='b'.repeat(43)));assert.equal(calls,1);assert.equal(storage.writes.length,1);
 await manager.refresh('a'.repeat(43));assert.equal(calls,1);
});
test('invalid refresh clears the account while network failures preserve it',async()=>{
 for(const [error,clear] of [[new ApiError('http',401),true],[new ApiError('network'),false]]) {
  const storage=store(initial());const manager=new SessionManager(storage,{refresh:async()=>{throw error;},logout:async()=>{}},()=>now);
  await assert.rejects(manager.accessToken());assert.equal(manager.current===null,clear);assert.equal(storage.clears(),clear?1:0);
 }
});
test('late refresh cannot restore a cleared account; expired stored sessions never appear connected',async()=>{
 const storage=store(initial());let resolveRefresh;
 const manager=new SessionManager(storage,{refresh:()=>new Promise(resolve=>{resolveRefresh=resolve;}),logout:async()=>{}},()=>now);
 const pending=manager.accessToken();await new Promise(resolve=>setImmediate(resolve));await manager.clear();resolveRefresh(renewed());
 assert.equal(await pending,null);assert.equal(manager.current,null);assert.equal(storage.writes.length,0);
 const expired=store({...initial(),refreshExpiresAt:new Date(now-1).toISOString()});
 const fresh=new SessionManager(expired,{refresh:async()=>{throw new Error('must not call');},logout:async()=>{}},()=>now);await fresh.load();assert.equal(fresh.current,null);assert.equal(expired.clears(),1);
});
