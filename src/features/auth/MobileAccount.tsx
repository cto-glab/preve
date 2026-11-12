import { Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../auth/context';
import { Action } from '../../components/Action';
import { styles } from '../../components/contentStyles';
export function MobileAccount() {
 const auth=useAuth();
 return auth.session ? <Text style={styles.subtitle}>Google 계정으로 로그인됨</Text> : <Action label="로그인 화면으로 이동" onPress={()=>router.push('/login')} />;
}
