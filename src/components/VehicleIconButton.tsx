import {Pressable} from 'react-native';
import {theme} from '../theme/tokens';
import {VehicleIcon,VehicleIconName} from './VehicleIcon';
export function VehicleIconButton({label,icon,onPress,size=48,disabled=false}:{label:string;icon:VehicleIconName;onPress:()=>void;size?:number;disabled?:boolean}){return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>({width:size,height:size,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:theme.colors.primarySoft,opacity:disabled||pressed?0.45:1})}><VehicleIcon name={icon} size={Math.min(32,size*0.6)} color={theme.colors.primary}/></Pressable>;}
