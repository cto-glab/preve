import {api} from '../../api';
import {ApiError} from '../../api/client';
export type ContactInput={companyName:string;personName:string;position:string;contactInfo:string;preferences:string};
export type Contact=ContactInput&{id:string};
export const emptyContact:ContactInput={companyName:'',personName:'',position:'',contactInfo:'',preferences:''};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function contactInput(value:ContactInput):ContactInput{const result={...emptyContact};for(const [key,max] of Object.entries({companyName:160,personName:100,position:100,contactInfo:240,preferences:1000})){const name=key as keyof ContactInput,raw=value[name];if(typeof raw!=='string'||raw.length>max||/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(raw))throw new Error('입력한 내용의 길이와 형식을 확인해 주세요.');result[name]=raw.trim();}if(!result.companyName)throw new Error('거래처명을 입력해 주세요.');return result;}
export function parseContact(value:unknown):Contact{try{const item=value as Contact;if(!item||!uuid.test(item.id))throw new Error();return {id:item.id,...contactInput(item)};}catch{throw new ApiError('invalid-response');}}
const id=(value:string)=>{if(!uuid.test(value))throw new Error('Invalid contact ID');return value;};
const meetingId=(value:string)=>{if(!/^[A-Za-z0-9_-]{1,64}$/.test(value))throw new Error('Invalid meeting ID');return value;};
export function createContactsApi(client:Pick<typeof api,'request'>){const body=(value:ContactInput)=>({headers:{'Content-Type':'application/json'},body:JSON.stringify(contactInput(value))});return {
 async list(){const result=await client.request<{contacts:unknown[]}>('/v1/contacts');if(!result||!Array.isArray(result.contacts)||result.contacts.length>500)throw new ApiError('invalid-response');return result.contacts.map(parseContact);},
 async save(input:ContactInput,contactId?:string){return parseContact(await client.request('/v1/contacts'+(contactId?'/'+id(contactId):''),{method:contactId?'PUT':'POST',...body(input)}));},
 async remove(contactId:string){await client.request('/v1/contacts/'+id(contactId),{method:'DELETE'});},
 async linked(meeting:string){const result=await client.request<{contact:unknown}>(`/v1/meetings/${meetingId(meeting)}/contact`);if(!result||!('contact' in result))throw new ApiError('invalid-response');return result.contact===null?null:parseContact(result.contact);},
 async link(meeting:string,contactId:string|null){const result=await client.request<{contact:unknown}>(`/v1/meetings/${meetingId(meeting)}/contact`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({contactId:contactId===null?null:id(contactId)})});if(!result||!('contact' in result))throw new ApiError('invalid-response');return result.contact===null?null:parseContact(result.contact);}
 };}
export const contactsApi=createContactsApi(api);
export function contactMessage(error:unknown){return error instanceof ApiError&&[404,503].includes(error.status||0)?'거래처 서버 업데이트가 필요합니다. 배포 후 다시 시도해 주세요.':error instanceof ApiError?'거래처를 불러오거나 저장하지 못했습니다. 서버 연결을 확인해 주세요.':error instanceof Error?error.message:'입력 내용을 확인해 주세요.';}
