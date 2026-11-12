const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function harness(saved=null){
 const state=[],effects=[],deps=[],storage=[];let cursor=0,calls=0,lists=0,fail=false,pending=null;const cleanups=[];
 const react={...require('react'),createContext:()=>({Provider:'Provider'}),useRef:initial=>{const i=cursor++;return state[i]??(state[i]={current:initial});},useState:initial=>{const i=cursor++;if(!(i in state))state[i]=initial;return[state[i],value=>state[i]=typeof value==='function'?value(state[i]):value];},useCallback:fn=>fn,useEffect:(fn,next)=>{const i=cursor++;if(!deps[i]||next.some((v,j)=>v!==deps[i][j])){deps[i]=next;effects.push(fn);}}};
 const exports={};const source=ts.transpileModule(fs.readFileSync('src/features/calendar/context.tsx','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(source,{exports,require:name=>name==='react'?react:name==='react/jsx-runtime'?require(name):name==='expo-secure-store'?{getItemAsync:async()=>saved,setItemAsync:async(key,value)=>{storage.push({key,value});saved=value;}}:name==='../../auth/context'?{useAuth:()=>({session:{userId:'owner'}})}:name==='../meetings/context'?{useMeetings:()=>({liveMeetings:[],refreshMeetings:async()=>{lists++;}})}:name==='../../config/environment'?{environment:{target:'mobile'}}:name==='./errors'?{calendarErrorMessage:()=> 'error'}:name==='./remote'?{syncGoogleCalendar:async()=>{calls++;if(pending)await pending;if(fail)throw Error('cancel');return{imported:0,hasMore:false};}}:null,Error});
 const render=()=>{cursor=0;const value=exports.CalendarProvider({children:null}).props.value;while(effects.length){const cleanup=effects.shift()();if(typeof cleanup==='function')cleanups.push(cleanup);}return value;};
 return {render,storage,calls:()=>calls,lists:()=>lists,setFail:value=>fail=value,setPending:value=>pending=value,unmount:()=>cleanups.forEach(fn=>fn())};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('first login shows onboarding; even zero imported events persist a successful connection',async()=>{
 const h=harness();h.render();await tick();assert.equal(h.render().needsOnboarding,true);assert.equal(await h.render().connect(),true);assert.equal(h.render().connected,true);assert.equal(h.render().needsOnboarding,false);assert.equal(JSON.parse(h.storage[0].value).connected,true);await h.render().refresh();assert.equal(h.calls(),2);assert.equal(h.lists(),2);
});
test('restored connected account refreshes Google directly; unconnected skip only refreshes the service',async()=>{
 const h=harness(JSON.stringify({connected:true,skipped:false}));h.render();await tick();assert.equal(h.render().needsOnboarding,false);await h.render().refresh();assert.equal(h.calls(),1);
 const guest=harness();guest.render();await tick();await guest.render().skip();assert.equal(guest.render().needsOnboarding,false);await guest.render().refresh();assert.equal(guest.calls(),0);assert.equal(guest.lists(),1);
});
test('failed or concurrent imports never falsely mark an account connected',async()=>{
 const h=harness();h.render();await tick();h.setFail(true);assert.equal(await h.render().connect(),false);assert.equal(h.render().connected,false);assert.equal(h.storage.length,0);
 h.setFail(false);let release;h.setPending(new Promise(r=>release=r));const first=h.render().connect();assert.equal(await h.render().connect(),false);release();await first;assert.equal(h.calls(),2);
});
test('an import finishing after account unmount cannot save connection flags',async()=>{
 const h=harness();h.render();await tick();let release;h.setPending(new Promise(r=>release=r));const pending=h.render().connect();h.unmount();release();assert.equal(await pending,false);assert.equal(h.storage.length,0);
});
