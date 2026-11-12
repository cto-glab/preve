import { PropsWithChildren,ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { environment } from '../config/environment';
import { theme } from '../theme/tokens';

export function Screen({ title, children, footer }: PropsWithChildren<{ title: string;footer?:ReactNode }>) {
  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <ScrollView style={{flex:1}} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={styles.inner}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{children}</View>
    </ScrollView>{!!footer&&<SafeAreaView edges={['bottom']} style={{padding:16,gap:8,borderTopWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.background}}>{footer}</SafeAreaView>}
  </SafeAreaView>;
}
const vehicle = environment.target === 'pleos';
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: vehicle ? 36 : 24, flexGrow: 1 },
  inner: { width: '100%', maxWidth: vehicle ? undefined : 960, alignSelf: 'center', gap: vehicle ? 28 : 20 },
  title: { color: theme.colors.textPrimary, fontSize: vehicle ? 40 : 28, lineHeight: vehicle ? 52 : 38, fontWeight: '600' },
});
