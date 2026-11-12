import {useEffect,useRef} from 'react';
import {Animated,Easing,View} from 'react-native';
import {VehicleIcon} from './VehicleIcon';
export function VehicleSpinner({size=32,color}:{size?:number;color:string}){const rotation=useRef(new Animated.Value(0)).current;
 useEffect(()=>{const animation=Animated.loop(Animated.timing(rotation,{toValue:1,duration:900,easing:Easing.linear,useNativeDriver:true}));animation.start();return()=>animation.stop();},[rotation]);
 return <View accessibilityRole="progressbar" accessibilityLabel="일정 확인 중" style={{width:size,height:size}}><Animated.View style={{transform:[{rotate:rotation.interpolate({inputRange:[0,1],outputRange:['0deg','360deg']})}]}}><VehicleIcon name="loading" size={size} color={color}/></Animated.View></View>;
}
