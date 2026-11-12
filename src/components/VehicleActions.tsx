import {useState} from 'react';
import {Pressable,Text,View,useWindowDimensions} from 'react-native';
import {VehicleSpinner} from './VehicleSpinner';
import {theme} from '../theme/tokens';
import {VehicleIcon,VehicleIconName} from './VehicleIcon';
export type VehicleAction={label:string;displayLabel?:string;onPress:()=>void;disabled?:boolean;busy?:boolean;primary?:boolean;icon?:VehicleIconName};
export function vehicleColumns(width:number){return width>=1200?4:width>=800?3:2;}
export function VehicleActions({items,layout='grid',maxSize,align='start'}:{items:VehicleAction[];layout?:'grid'|'row';maxSize?:number;align?:'start'|'end'}){
 const {width}=useWindowDimensions();const [measured,setMeasured]=useState(0);const available=measured||Math.max(0,width-72);const columns=layout==='row'?Math.max(1,items.length):vehicleColumns(available);const size=Math.min(maxSize??Infinity,Math.max(0,(available-(columns-1)*16)/columns));const tiny=size<80;const small=size<140;const compact=size<220;const iconSize=tiny?20:small?28:compact?40:56;const lineHeight=tiny?16:small?20:compact?32:38;
 return <View onLayout={event=>setMeasured(event.nativeEvent.layout.width)} style={{flexDirection:'row',flexWrap:layout==='row'?'nowrap':'wrap',alignItems:'flex-start',justifyContent:align==='end'?'flex-end':'flex-start',gap:16,width:'100%',height:layout==='row'?size:undefined}}>{items.map(item=>{
 const color=item.primary?theme.colors.onPrimary:theme.colors.primary;const words=item.label.split(' ');const title=item.displayLabel||(size<300&&words.length>1?words.slice(0,-1).join(' ')+'\n'+words[words.length-1]:item.label);
 return <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{disabled:!!(item.disabled||item.busy),busy:!!item.busy}} disabled={item.disabled||item.busy} onPress={item.onPress} style={({pressed})=>({width:size,height:size,aspectRatio:1,flexShrink:0,minHeight:layout==='row'?0:88,borderRadius:small?16:24,padding:small?4:12,alignItems:'center',justifyContent:'center',backgroundColor:item.primary?theme.colors.primary:theme.colors.primarySoft,opacity:item.disabled||item.busy||pressed?0.65:1})}>
 <View pointerEvents="none" style={{width:'100%',alignItems:'center',gap:tiny?4:small?8:compact?12:16}}>
 <View style={{width:iconSize,height:iconSize,alignItems:'center',justifyContent:'center'}}>{item.busy?<VehicleSpinner size={iconSize} color={color}/>:!!item.icon&&<VehicleIcon name={item.icon} size={iconSize} color={color}/>}</View>
 <View style={{width:'100%',height:lineHeight*2,alignItems:'center',justifyContent:'center'}}><Text accessibilityLabel={item.label} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} style={{width:'100%',fontSize:tiny?12:small?16:compact?24:28,lineHeight,textAlign:'center',textAlignVertical:'center',includeFontPadding:false,fontWeight:'600',color}}>{title}</Text></View>
 </View></Pressable>;
 })}</View>;
}
