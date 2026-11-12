import { createApiClient } from '../api/client';
import { environment } from '../config/environment';
import { SessionManager } from './manager';
import { clearSession, readSession, writeSession } from './session';
import { parseSession } from './session-model';
export const authApi = createApiClient({ baseUrl: environment.apiBaseUrl, timeoutMs: 15000 });
export const sessions = new SessionManager({ read: readSession, write: writeSession, clear: clearSession }, {
  refresh: async refreshToken => parseSession(await authApi.request('/v1/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) })),
  logout: async accessToken => { await authApi.request('/v1/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }); },
});
