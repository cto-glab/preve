export class ApiError extends Error {
  constructor(public readonly code: 'not-configured' | 'http' | 'timeout' | 'network' | 'invalid-response', public readonly status?: number, public readonly serverCode?: string) {
    super(code);
    this.name = 'ApiError';
  }
}
type Options = {
  baseUrl: string | null;
  getAccessToken?: () => Promise<string | null>;
  onUnauthorized?: (failedToken: string) => Promise<string | null>;
  fetcher?: typeof fetch;
  timeoutMs?: number;
};
export function createApiClient({ baseUrl, getAccessToken, onUnauthorized, fetcher = fetch, timeoutMs = 5000 }: Options) {
  if (baseUrl) {
    const url = new URL(baseUrl);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error('API base URL must be an HTTP(S) origin/path without credentials, query or hash.');
    }
  }
  return {
    async request<T>(path: string, init: Omit<RequestInit, 'signal'> = {}, options: { timeoutMs?: number } = {}): Promise<T> {
      if (!baseUrl) throw new ApiError('not-configured');
      if (!path.startsWith('/') || path.startsWith('//') || path.includes('://') || path.includes('\\')) {
        throw new Error('API path must be relative to the configured server.');
      }
      const requestTimeout = options.timeoutMs ?? timeoutMs;
      if (!Number.isFinite(requestTimeout) || requestTimeout <= 0 || requestTimeout > 120000) throw new Error('Invalid request timeout');
      const token = await getAccessToken?.();
      const execute = async (accessToken: string | null | undefined): Promise<T> => {
      const headers = new Headers(init.headers);
      headers.set('Accept', 'application/json');
      if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), requestTimeout);
      try {
        const response = await fetcher(`${baseUrl.replace(/\/$/, '')}${path}`, { ...init, headers, signal: controller.signal });
        if (!response.ok) {
          let serverCode: string | undefined;
          try {
            const payload = await response.json() as { error?: { code?: unknown } };
            if (typeof payload?.error?.code === 'string' && /^[A-Z0-9_]{1,80}$/.test(payload.error.code)) serverCode = payload.error.code;
          } catch { /* Never expose provider error bodies. */ }
          throw new ApiError('http', response.status, serverCode);
        }
        if (response.status === 204) return undefined as T;
        try { return await response.json() as T; }
        catch { throw new ApiError('invalid-response', response.status); }
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(controller.signal.aborted ? 'timeout' : 'network');
      } finally { clearTimeout(timeout); }
      };
      try { return await execute(token); }
      catch (error) {
        if (error instanceof ApiError && error.status === 401 && token && onUnauthorized) {
          const renewed = await onUnauthorized(token);
          if (renewed) return execute(renewed);
        }
        throw error;
      }
    },
  };
}
