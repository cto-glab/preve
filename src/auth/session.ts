import * as SecureStore from 'expo-secure-store';
import { parseSession, Session } from './session-model';
export type { Session } from './session-model';
const KEY = 'automobile.session';
export async function readSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try { return parseSession(JSON.parse(raw)); }
  catch { await SecureStore.deleteItemAsync(KEY); return null; }
}
export function writeSession(session: Session) { return SecureStore.setItemAsync(KEY, JSON.stringify(parseSession(session))); }
export function clearSession() { return SecureStore.deleteItemAsync(KEY); }
