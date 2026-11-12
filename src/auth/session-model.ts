export type Session = { userId: string; sessionId: string; target: 'mobile' | 'pleos'; accessToken: string; refreshToken: string; expiresAt: string; refreshExpiresAt: string };
export function parseSession(value: unknown): Session {
  if (!value || typeof value !== 'object') throw new Error('Invalid service session');
  const session = value as Record<string, unknown>;
  for (const key of ['userId', 'sessionId', 'accessToken', 'refreshToken', 'expiresAt', 'refreshExpiresAt']) if (typeof session[key] !== 'string' || !session[key]) throw new Error('Invalid service session');
  if (!['mobile', 'pleos'].includes(String(session.target)) || !/^[A-Za-z0-9_-]{32,128}$/.test(String(session.accessToken)) || !/^[A-Za-z0-9_-]{32,128}$/.test(String(session.refreshToken)) || !Number.isFinite(Date.parse(String(session.expiresAt))) || !Number.isFinite(Date.parse(String(session.refreshExpiresAt)))) throw new Error('Invalid service session');
  return session as Session;
}
