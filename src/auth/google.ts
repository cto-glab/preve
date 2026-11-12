import { requireOptionalNativeModule } from 'expo';
import { environment } from '../config/environment';
import { authApi } from './runtime';
import { parseSession } from './session-model';
export const AUTH_CONSENT_VERSION = 'auth-2026-10-28';
type NativeGoogle = { signIn: (clientId: string, nonce: string) => Promise<{ idToken: string }>; clearCredentialState: () => Promise<void> };
export function canGoogleSignIn() { return environment.target === 'mobile' && !!environment.googleWebClientId && !!environment.apiBaseUrl; }
export type PendingGoogleLogin = { challengeId: string; idToken: string; expiresAt: string };
export async function beginGoogleLogin(): Promise<PendingGoogleLogin> {
  if (!canGoogleSignIn()) throw new Error('Google 로그인 연결을 준비하고 있어요.');
  const native = requireOptionalNativeModule<NativeGoogle>('PreveGoogleAuth');
  if (!native) throw new Error('로그인 모듈이 포함된 휴대폰 앱을 설치해 주세요.');
  const challenge = await authApi.request<{ challengeId: string; nonce: string; expiresAt: string }>('/v1/auth/google/challenge', { method: 'POST' });
  if (!challenge || typeof challenge.challengeId !== 'string' || typeof challenge.nonce !== 'string' || challenge.nonce.length < 32 || !Number.isFinite(Date.parse(challenge.expiresAt)) || Date.parse(challenge.expiresAt) <= Date.now()) throw new Error('로그인 요청을 확인하지 못했습니다. 다시 시도해 주세요.');
  const credential = await native.signIn(environment.googleWebClientId!, challenge.nonce);
  if (typeof credential.idToken !== 'string' || !credential.idToken) throw new Error('Google 응답을 확인하지 못했습니다.');
  return { challengeId: challenge.challengeId, idToken: credential.idToken, expiresAt: challenge.expiresAt };
}
export async function finishGoogleLogin(pending: PendingGoogleLogin) {
  if (Date.parse(pending.expiresAt) <= Date.now()) throw new Error('로그인 시간이 지났습니다. 다시 시작해 주세요.');
  return parseSession(await authApi.request('/v1/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId: pending.challengeId, idToken: pending.idToken, deviceName: 'Android 휴대폰', consentVersion: AUTH_CONSENT_VERSION }) }));
}
export async function clearGoogleCredentialState() { if (environment.target === 'mobile') await requireOptionalNativeModule<NativeGoogle>('PreveGoogleAuth')?.clearCredentialState(); }
export function googleLoginMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && String(error.code).includes('CANCELLED')) return '로그인을 취소했어요.';
  return '로그인하지 못했어요. 연결 상태와 계정을 확인하고 다시 시도해 주세요.';
}
