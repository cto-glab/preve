import { StyleSheet } from 'react-native';
import { environment } from '../config/environment';
import { theme } from '../theme/tokens';
const vehicle = environment.target === 'pleos';
export const styles = StyleSheet.create({ card: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, gap: 16 }, badge: { color: theme.colors.primary, fontSize: vehicle ? 26 : 16, fontWeight: '600' }, heading: { color: theme.colors.textPrimary, fontSize: vehicle ? 36 : 22, lineHeight: vehicle ? 48 : 32, fontWeight: '600' }, subtitle: { color: theme.colors.textSecondary, fontSize: vehicle ? 26 : 16, lineHeight: vehicle ? 38 : 26 } });
