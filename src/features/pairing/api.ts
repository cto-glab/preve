import {api} from '../../api';
import {authApi} from '../../auth/runtime';
import {parseSession} from '../../auth/session-model';
import {ApiError} from '../../api/client';
export type PairingPreview={pairId:string;userCode:string;deviceName:string;expiresAt:string};
export type VehiclePairing=PairingPreview&{deviceSecret:string;intervalSeconds:number};
export function parsePairing(value:unknown):PairingPreview{const v=value as PairingPreview|null;if(!v||typeof v.pairId!=='string'||!/^[0-9a-f-]{36}$/.test(v.pairId)||typeof v.userCode!=='string'||!/^\d{3}-\d{3}$/.test(v.userCode)||typeof v.deviceName!=='string'||!v.deviceName||!Number.isFinite(Date.parse(v.expiresAt)))throw new ApiError('invalid-response');return {pairId:v.pairId,userCode:v.userCode,deviceName:v.deviceName,expiresAt:v.expiresAt};}
const post=(body:unknown)=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
export async function createPairing():Promise<VehiclePairing>{const v=await authApi.request<VehiclePairing>('/v1/auth/pairings',post({deviceName:'Preve 차량'}));const preview=parsePairing(v);if(!/^[A-Za-z0-9_-]{43}$/.test(v.deviceSecret)||!Number.isFinite(v.intervalSeconds)||v.intervalSeconds<3)throw new ApiError('invalid-response');return {...preview,deviceSecret:v.deviceSecret,intervalSeconds:v.intervalSeconds};}
export async function resolvePairing(userCode:string){return parsePairing(await api.request('/v1/auth/pairings/resolve',post({userCode})));}
export async function decidePairing(pairId:string,approve:boolean){await api.request('/v1/auth/pairings/'+pairId+(approve?'/approve':'/deny'),post({}));}
export async function pollPairing(request:VehiclePairing){const v=await authApi.request<{state:string;session?:unknown}>('/v1/auth/pairings/token',post({pairId:request.pairId,deviceSecret:request.deviceSecret}));if(v.state==='pending')return null;if(v.state!=='connected')throw new ApiError('invalid-response');const session=parseSession(v.session);if(session.target!=='pleos')throw new ApiError('invalid-response');return session;}
export async function cancelPairing(request:VehiclePairing){await authApi.request('/v1/auth/pairings/cancel',post({pairId:request.pairId,deviceSecret:request.deviceSecret}));}
export function pairingMessage(error:unknown){const code=error instanceof ApiError?error.serverCode:undefined;return code==='PAIRING_EXPIRED'?'연결 코드가 만료됐어요. 차량에서 다시 시작해 주세요.':code==='PAIRING_CLOSED'||code==='PAIRING_NOT_PENDING'?'종료된 연결 요청입니다. 차량에서 새 코드를 발급해 주세요.':code==='RATE_LIMITED'?'요청이 많아요. 잠시 후 다시 시도해 주세요.':code==='PAIRING_NOT_FOUND'||code==='INVALID_PAIRING_CODE'?'연결 코드를 확인해 주세요.':error instanceof ApiError&&error.status===404?'서버 차량 연결 업데이트가 필요합니다.':'차량 연결을 처리하지 못했어요. 네트워크와 서버를 확인해 주세요.';}
