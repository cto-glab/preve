import {environment} from '../config/environment';
import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { Session } from './session-model';
import { sessions } from './runtime';
import { clearGoogleCredentialState } from './google';
type AuthState = { ready: boolean; session: Session | null; error: string | null; signIn: (session: Session) => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const unsubscribe = sessions.subscribe(value => { if (active) setSession(value); });
    void sessions.load().then(() => { if (active) setSession(sessions.current); }).catch(() => { if (active) setError('저장된 계정을 확인하지 못했습니다.'); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; unsubscribe(); };
  }, []);
  return <AuthContext.Provider value={{ ready, session, error,
    signIn: async next => { if(next.target!==environment.target)throw new Error('Session target mismatch'); await sessions.set(next); setError(null); },
    signOut: async () => { await sessions.logout(); await clearGoogleCredentialState().catch(() => {}); setError(null); },
  }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider missing'); return value; }
