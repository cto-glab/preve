import { ApiError } from '../api/client';
import { parseSession, Session } from './session-model';
type Store = { read: () => Promise<Session | null>; write: (session: Session) => Promise<void>; clear: () => Promise<void> };
type Transport = { refresh: (token: string) => Promise<Session>; logout: (token: string) => Promise<void> };
export class SessionManager {
  private session: Session | null = null;
  private loading: Promise<void> | null = null;
  private refreshing: Promise<Session | null> | null = null;
  private writes = Promise.resolve();
  private version = 0;
  private listeners = new Set<(session: Session | null) => void>();
  constructor(private store: Store, private transport: Transport, private now = Date.now) {}
  get current() { return this.session; }
  subscribe(listener: (session: Session | null) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private emit() { for (const listener of this.listeners) listener(this.session); }
  async load() {
    if (!this.loading) this.loading = this.store.read().then(async session => { if (session && Date.parse(session.refreshExpiresAt) <= this.now()) { await this.store.clear(); session = null; } if (this.version === 0) { this.session = session; this.emit(); } });
    await this.loading;
  }
  private async persist(session: Session | null) {
    const version = ++this.version;
    if (!session) { this.session = null; this.emit(); }
    const write = this.writes.then(async () => { if (version === this.version) await (session ? this.store.write(session) : this.store.clear()); });
    this.writes = write.catch(() => {});
    await write;
    if (version === this.version) { this.session = session; this.emit(); }
  }
  async set(session: Session) { await this.load(); await this.persist(parseSession(session)); }
  async clear() { await this.persist(null); }
  async refresh(failedToken?: string): Promise<Session | null> {
    await this.load();
    if (!this.session) return null;
    if (failedToken && this.session.accessToken !== failedToken) return this.session;
    if (this.refreshing) return this.refreshing;
    const previous = this.session, version = this.version;
    this.refreshing = (async () => {
      if (Date.parse(previous.refreshExpiresAt) <= this.now()) { await this.clear(); return null; }
      let next: Session;
      try { next = parseSession(await this.transport.refresh(previous.refreshToken)); }
      catch (error) { if (error instanceof ApiError && error.status === 401 && version === this.version) await this.clear(); throw error; }
      if (version !== this.version) return this.session;
      if (next.userId !== previous.userId || next.sessionId !== previous.sessionId || next.target !== previous.target) { await this.clear(); throw new Error('Session identity changed during refresh'); }
      try { await this.persist(next); } catch (error) { await this.clear().catch(() => {}); throw error; }
      return this.session;
    })().finally(() => { this.refreshing = null; });
    return this.refreshing;
  }
  async accessToken(): Promise<string | null> {
    await this.load();
    if (!this.session) return null;
    if (Date.parse(this.session.expiresAt) > this.now() + 30000) return this.session.accessToken;
    return (await this.refresh())?.accessToken ?? null;
  }
  async logout() {
    await this.load(); const sessionId = this.session?.sessionId;
    const access = await this.accessToken();
    if (access) await this.transport.logout(access);
    if (this.session?.sessionId === sessionId) await this.clear();
  }
}
