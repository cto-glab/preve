const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function load(file,imports={}){const exports={};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(code,{exports,require:name=>imports[name],Error});return exports;}
const {ApiError}=load('src/api/client.ts');const {calendarErrorMessage}=load('src/features/calendar/errors.ts',{'../../api/client':{ApiError}});
test('calendar failures distinguish device authorization, server policy and database migration',()=>{
 assert(calendarErrorMessage({code:'CALENDAR_GOOGLE_10'},'permission').includes('[Google 10]'));
 assert(calendarErrorMessage({code:'CALENDAR_CANCELLED'},'permission').includes('취소'));
 assert(calendarErrorMessage(new ApiError('http',403,'CALENDAR_PERMISSION_REQUIRED'),'server').includes('403 · CALENDAR_PERMISSION_REQUIRED'));
 assert(calendarErrorMessage(new ApiError('http',503,'CALENDAR_MIGRATION_REQUIRED'),'server').includes('db:migrate'));
 assert(calendarErrorMessage(new ApiError('http',403,'CALENDAR_CLIENT_MISMATCH'),'server').includes('Android Client ID'));
 assert(calendarErrorMessage(new ApiError('network'),'server').includes('네트워크'));
 assert(!calendarErrorMessage({message:'secret-token'},'permission').includes('secret-token'));
});
