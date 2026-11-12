import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { useAuth } from '../auth/context';
import { environment } from '../config/environment';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Providers } from '../bootstrap/Providers';
import { theme } from '../theme/tokens';

// Keep the native brand visible while the saved account session is restored.
void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return <Providers><StatusBar style="dark" /><AccountNavigation /></Providers>;
}

function AccountNavigation() {
 const {ready,session}=useAuth();const vehicle=environment.target==='pleos';
 useEffect(() => {
  if (ready || vehicle) void SplashScreen.hideAsync().catch(() => {});
 }, [ready, vehicle]);
 if(!vehicle&&!ready)return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator /></View>;
 return <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:theme.colors.background}}}>
  <Stack.Protected guard={!vehicle&&!session}><Stack.Screen name="login" /></Stack.Protected>
  <Stack.Protected guard={vehicle||!!session}>
   <Stack.Screen name="(tabs)" /><Stack.Screen name="meeting/[id]" /><Stack.Screen name="meeting/create" /><Stack.Screen name="meeting/documents" /><Stack.Screen name="meeting/note" /><Stack.Screen name="settings/privacy" /><Stack.Screen name="vehicle/connection" />
  </Stack.Protected>
 </Stack>;
}
