import { useFonts } from 'expo-font';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
export function GoogleButton({ disabled, busy, onPress }: { disabled?: boolean; busy?: boolean; onPress: () => void }) {
 const [fontLoaded]=useFonts({GoogleSans:require('../../../assets/branding/GoogleSans.ttf')});
 return <Pressable accessibilityRole="button" accessibilityLabel="Google로 계속하기" accessibilityState={{ disabled: !!disabled, busy: !!busy }} disabled={disabled} onPress={onPress} style={({pressed})=>[button.container,{opacity:disabled?0.55:pressed?0.85:1}]}>
  <Image source={require('../../../assets/branding/google-g.png')} style={button.logo} accessibilityIgnoresInvertColors />
  <Text style={[button.label,fontLoaded?{fontFamily:'GoogleSans'}:null]}>Google로 계속하기</Text><View style={button.trailing}>{busy&&<ActivityIndicator size="small" color="#1F1F1F" />}</View>
 </Pressable>;
}
const button=StyleSheet.create({container:{minHeight:48,backgroundColor:'#FFFFFF',borderColor:'#747775',borderWidth:1,borderRadius:24,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:10},logo:{width:18,height:18,resizeMode:'contain'},label:{flex:1,textAlign:'center',fontSize:14,lineHeight:20,fontWeight:'500',color:'#1F1F1F'},trailing:{width:18}});
