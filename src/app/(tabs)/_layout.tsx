import { Stack, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { environment } from '../../config/environment';
import { theme } from '../../theme/tokens';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const vehicle = environment.target === 'pleos';
  if (vehicle) return <Stack screenOptions={{ headerShown: false }} />;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: theme.colors.textSecondary,
    tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border,
      height: 64 + insets.bottom, paddingBottom: Math.max(8, insets.bottom), paddingTop: 8 },
    tabBarLabelStyle: { fontSize: 12 },
  }}>
    <Tabs.Screen name="index" options={{ title: '일정', tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" color={color} size={24} /> }} />
    <Tabs.Screen name="contacts" options={{ title: '거래처', tabBarIcon: ({ color }) => <Ionicons name="people-outline" color={color} size={24} /> }} />
    <Tabs.Screen name="records" options={{ title: '기록', tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" color={color} size={24} /> }} />
    <Tabs.Screen name="settings" options={{ title: '설정', tabBarIcon: ({ color }) => <Ionicons name="settings-outline" color={color} size={24} /> }} />
  </Tabs>;
}
