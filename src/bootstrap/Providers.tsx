import {GleoBridge} from '../features/gleo/GleoBridge';
import { CalendarProvider } from '../features/calendar/context';
import { PropsWithChildren, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../auth/context';
import * as SystemUI from 'expo-system-ui';
import { MeetingProvider } from '../features/meetings/context';
import { theme } from '../theme/tokens';

export function Providers({ children }: PropsWithChildren) {
  useEffect(() => { void SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {}); }, []);
  return <SafeAreaProvider><AuthProvider><AccountWorkspace><GleoBridge />{children}</AccountWorkspace></AuthProvider></SafeAreaProvider>;
}

function AccountWorkspace({ children }: PropsWithChildren) {
  const { session } = useAuth();
  return <MeetingProvider key={session?.userId ?? 'guest'}><CalendarProvider>{children}</CalendarProvider></MeetingProvider>;
}
