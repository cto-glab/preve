import { Pressable, StyleSheet, Text } from 'react-native';
import { environment } from '../config/environment';
import { theme } from '../theme/tokens';
export function Action({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
 return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, (pressed || disabled) && { opacity: 0.7 }]}><Text style={[styles.label, secondary && { color: theme.colors.primary }]}>{label}</Text></Pressable>;
}
const vehicle = environment.target === 'pleos';
const styles = StyleSheet.create({ button: { minHeight: vehicle ? 88 : 48, padding: 16, borderRadius: 12, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }, secondary: { backgroundColor: theme.colors.primarySoft }, label: { color: theme.colors.onPrimary, fontSize: vehicle ? 28 : 15, fontWeight: '600' } });
