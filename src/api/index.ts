import { sessions } from '../auth/runtime';
import { environment } from '../config/environment';
import { createApiClient } from './client';
export const api = createApiClient({ baseUrl: environment.apiBaseUrl, getAccessToken: () => sessions.accessToken(), onUnauthorized: async token => (await sessions.refresh(token))?.accessToken ?? null });
