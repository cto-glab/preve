import { requireOptionalNativeModule } from 'expo';
import { api } from '../../api';
export async function syncGoogleCalendar() {
 const native=requireOptionalNativeModule<{authorizeCalendar:()=>Promise<{accessToken:string}>}>('PreveGoogleAuth');
 if(!native)throw {code:'CALENDAR_MODULE_UNAVAILABLE'};
 const credential=await native.authorizeCalendar();
 if(typeof credential?.accessToken!=='string'||!credential.accessToken)throw {code:'CALENDAR_PERMISSION_REQUIRED'};
 const result=await api.request<{imported:number;hasMore:boolean}>('/v1/calendar/google/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessToken:credential.accessToken})},{timeoutMs:60000});
 if(!Number.isInteger(result?.imported)||result.imported<0||result.imported>100||typeof result.hasMore!=='boolean')throw {code:'CALENDAR_INVALID_RESPONSE'};
 return result;
}
