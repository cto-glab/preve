import { ApiError } from '../../api/client';
export function verifyHealth(value: unknown): void {
  if (typeof value !== 'object' || value === null || !('status' in value) || value.status !== 'ok' || !('service' in value) || value.service !== 'automobile-api') {
    throw new ApiError('invalid-response');
  }
}
export function connectionMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'not-configured') return '서버 주소가 아직 설정되지 않았어요.';
    if (error.code === 'timeout') return '응답이 늦어지고 있어요. 잠시 후 다시 확인해 주세요.';
    if (error.code === 'invalid-response') return '서버 응답을 확인하지 못했어요.';
    if (error.code === 'http') return '서버가 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.';
  }
  return '서버에 연결하지 못했어요. 네트워크를 확인해 주세요.';
}
