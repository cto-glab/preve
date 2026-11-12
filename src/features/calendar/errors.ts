import { ApiError } from '../../api/client';
export function calendarErrorMessage(error: unknown, stage: 'permission'|'server'|'response') {
 if(error instanceof ApiError){
  const messages:Record<string,string>={CALENDAR_ACCOUNT_MISMATCH:'로그인한 Google 계정과 같은 계정을 선택해 주세요.',CALENDAR_CLIENT_MISMATCH:'서버의 Google Android Client ID 설정을 확인해 주세요.',CALENDAR_TOKEN_EXPIRED:'Google 권한이 만료됐어요. 캘린더를 다시 연결해 주세요.',CALENDAR_PERMISSION_REQUIRED:'Google 일정 읽기 권한을 허용해 주세요. 서버의 OAuth 설정도 확인이 필요합니다.',CALENDAR_IDENTITY_REQUIRED:'Google 계정을 확인하지 못했어요. 다시 로그인한 뒤 연결해 주세요.',CALENDAR_API_DISABLED:'Google Calendar API가 아직 활성화되지 않았습니다.',CALENDAR_MIGRATION_REQUIRED:'서버 DB 업데이트가 필요합니다. db:migrate를 실행해 주세요.',CALENDAR_DATABASE_UNAVAILABLE:'서버에서 일정을 저장하지 못했어요. DB 연결을 확인해 주세요.',CALENDAR_UNAVAILABLE:'Google 캘린더 서버 요청을 완료하지 못했어요.',RATE_LIMITED:'요청이 많아요. 1분 뒤 다시 연결해 주세요.'};
  const code=error.serverCode&&/^[A-Z0-9_]{1,80}$/.test(error.serverCode)?error.serverCode:undefined;
  const detail='[서버'+(error.status?' '+error.status:'')+(code?' · '+code:'')+']';
  const text=(code&&messages[code])||(error.status===404?'캘린더 연결 서버 업데이트가 필요합니다.':error.status===401?'로그인이 만료됐어요. 다시 로그인해 주세요.':error.code==='network'?'서버에 연결하지 못했어요. 네트워크를 확인해 주세요.':error.code==='timeout'?'일정 가져오기가 지연되고 있어요. 다시 시도해 주세요.':'캘린더 연결 요청을 처리하지 못했어요.');
  return text+' '+detail;
 }
 const code=typeof error==='object'&&error!==null&&'code'in error?String(error.code):'';
 if(code.includes('CALENDAR_CANCELLED'))return 'Google 캘린더 권한 승인을 취소했어요.';
 const numeric=/CALENDAR_GOOGLE_(\d{1,6})/.exec(code);
 if(numeric)return 'Google 권한 요청을 완료하지 못했어요. [Google '+numeric[1]+']';
 if(code.includes('CALENDAR_PERMISSION_REQUIRED'))return 'Google 일정 읽기 권한이 승인되지 않았어요. 권한 화면에서 일정 보기를 허용해 주세요. [기기 권한]';
 return stage==='permission'?'Google 권한 확인 중 오류가 발생했어요. [기기 권한]':'캘린더 응답을 확인하지 못했어요. [응답 확인]';
}
