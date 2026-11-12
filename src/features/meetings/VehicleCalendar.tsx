import {useState} from 'react';
import {router} from 'expo-router';
import {Pressable,Text,View,useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../../auth/context';
import {VehicleActions} from '../../components/VehicleActions';
import {VehicleIconButton} from '../../components/VehicleIconButton';
import {VehicleSpinner} from '../../components/VehicleSpinner';
import {theme} from '../../theme/tokens';
import {useMeetings} from './context';
import {localDay,meetingDay,monthDays} from './vehicle-calendar-model';
export function VehicleCalendar(){
 const {session}=useAuth();const {liveMeetings,loadingMeetings,meetingError,refreshMeetings}=useMeetings();const window=useWindowDimensions();
 const [month,setMonth]=useState(localDay(new Date()).slice(0,7)),[selected,setSelected]=useState(localDay(new Date())),[page,setPage]=useState(0),[frame,setFrame]=useState({width:0,height:0}),[bodyHeight,setBodyHeight]=useState(0);
 const width=frame.width||window.width,height=frame.height||window.height,small=height<500,side=width>=760||height<700,padding=small?8:20,gap=small?6:12,footerSize=small?64:height<800?96:140;
 const [year,index]=month.split('-').map(Number),cells=monthDays(year,index-1),dated=liveMeetings.filter(m=>meetingDay(m)===selected),today=localDay(new Date()),currentIndex=Math.min(page,Math.max(0,dated.length-1)),meeting=dated[currentIndex];
 const availableBody=bodyHeight||Math.max(100,height-padding*2-(small?30:42)-footerSize-gap*2),panelHeight=side?availableBody:availableBody*0.56,toolbarSize=small?36:48,weekdaySize=small?18:24;
 const agendaHeight=side?availableBody:availableBody-panelHeight-gap,agendaSmall=agendaHeight<620,agendaTight=agendaHeight<420;const cellWidth=(side?(width-padding*2-gap)*0.6:width-padding*2)/7;
 const rowHeight=Math.max(18,(panelHeight-toolbarSize-weekdaySize-4*(cells.length/7+1))/(cells.length/7)),dayFont=Math.min(small?20:32,cellWidth*0.65,Math.max(12,rowHeight*0.48)),countFont=Math.min(small?10:16,Math.max(8,rowHeight*0.22));
 function select(day:string){setSelected(day);setPage(0);}
 function move(offset:number){const date=new Date(year,index-1+offset,1);setMonth(localDay(date).slice(0,7));select(localDay(date));}
 const foreground=theme.colors.textPrimary;
 return <SafeAreaView edges={['top','left','right']} onLayout={e=>setFrame({width:e.nativeEvent.layout.width,height:e.nativeEvent.layout.height})} style={{flex:1,padding,gap,backgroundColor:theme.colors.background}}>
 <View style={{height:small?30:42,flexDirection:'row',alignItems:'center',gap:12,flexShrink:0}}><Text accessibilityRole="header" style={{fontSize:small?24:32,lineHeight:small?30:42,includeFontPadding:false,fontWeight:'600',color:foreground}}>캘린더</Text>{(!small||meetingError)&&<Text accessibilityRole={meetingError?'alert':undefined} numberOfLines={1} style={{flex:1,fontSize:small?12:16,color:theme.colors.textSecondary}}>{meetingError||'불러온 일정'}</Text>}{loadingMeetings&&<VehicleSpinner size={small?24:32} color={theme.colors.primary}/>}</View>
 {!session?<View style={{flex:1,justifyContent:'center',gap:16}}><Text style={{fontSize:22,color:foreground}}>휴대폰 계정을 연결하면 일정을 볼 수 있어요.</Text><VehicleActions layout="row" maxSize={small?88:180} items={[{label:'휴대폰 연결 안내',icon:'connection',onPress:()=>router.push('/vehicle/connection')}]} /></View>:<View testID="vehicle-calendar-body" onLayout={e=>setBodyHeight(e.nativeEvent.layout.height)} style={{flex:1,minHeight:0,flexDirection:side?'row':'column',gap}}>
 <View style={{flex:side?3:undefined,height:side?undefined:panelHeight,minWidth:0,gap:4}}>
 <View style={{height:toolbarSize,flexShrink:0,flexDirection:'row',alignItems:'center',gap:4}}><VehicleIconButton label="이전 달" icon="chevron-left" size={toolbarSize} onPress={()=>move(-1)}/><Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={{flex:1,textAlign:'center',fontSize:small?22:30,color:foreground,fontWeight:'600'}}>{year}년 {index}월</Text><VehicleIconButton label="다음 달" icon="chevron-right" size={toolbarSize} onPress={()=>move(1)}/><VehicleIconButton label="오늘" icon="today" size={toolbarSize} onPress={()=>{setMonth(today.slice(0,7));select(today);}}/></View>
 <View style={{flexDirection:'row',height:weekdaySize,flexShrink:0}}>{['일','월','화','수','목','금','토'].map(day=><Text key={day} style={{width:'14.285714%',textAlign:'center',lineHeight:weekdaySize,includeFontPadding:false,fontSize:small?12:18,color:theme.colors.primary}}>{day}</Text>)}</View>
 {Array.from({length:cells.length/7},(_,row)=><View key={row} style={{flexDirection:'row',height:rowHeight,flexShrink:0}}>{cells.slice(row*7,row*7+7).map((day,col)=>{const count=day?liveMeetings.filter(m=>meetingDay(m)===day).length:0;return day?<Pressable key={day} accessibilityRole="button" accessibilityLabel={day+' 일정 '+count+'개'} accessibilityState={{selected:day===selected}} onPress={()=>select(day)} style={{width:'14.285714%',height:rowHeight,alignItems:'center',justifyContent:'center',borderRadius:small?8:16,backgroundColor:day===selected?theme.colors.primary:day===today?theme.colors.primarySoft:theme.colors.background}}><Text style={{fontSize:dayFont,lineHeight:dayFont*1.2,includeFontPadding:false,color:day===selected?theme.colors.onPrimary:foreground,fontWeight:day===today?'700':'500'}}>{Number(day.slice(-2))}</Text><Text style={{fontSize:countFont,lineHeight:countFont*1.1,includeFontPadding:false,color:day===selected?theme.colors.onPrimary:theme.colors.primary}}>{count?(small?'•':count+'개'):' '}</Text></Pressable>:<View key={'blank'+col} style={{width:'14.285714%'}}/>;})}</View>)}
 </View>
 <View testID="vehicle-calendar-agenda" style={{flex:side?2:1,minWidth:0,minHeight:0,padding:agendaTight?8:agendaSmall?12:16,gap:agendaTight?4:agendaSmall?6:10,borderRadius:16,backgroundColor:theme.colors.primarySoft}}>
 <Text numberOfLines={1} style={{fontSize:agendaTight?14:agendaSmall?18:22,fontWeight:'600',color:foreground}}>{selected} 일정</Text>
 {meeting?<><Text numberOfLines={agendaSmall?2:3} style={{fontSize:agendaTight?16:agendaSmall?22:28,lineHeight:agendaTight?22:agendaSmall?30:38,fontWeight:'600',color:foreground}}>{meeting.title}</Text><Text numberOfLines={1} style={{fontSize:agendaTight?12:agendaSmall?16:18,color:theme.colors.textSecondary}}>{meeting.time}</Text>{!agendaSmall&&<Text numberOfLines={1} style={{fontSize:18,color:theme.colors.textSecondary}}>{meeting.location}</Text>}</>:<Text numberOfLines={3} style={{fontSize:agendaTight?14:agendaSmall?18:20,color:theme.colors.textSecondary}}>{loadingMeetings?'일정 확인 중…':'이 날짜에 불러온 일정이 없어요.'}</Text>}
 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8}}><VehicleIconButton label="이전 일정" icon="previous" size={agendaTight?28:agendaSmall?36:40} disabled={currentIndex===0} onPress={()=>setPage(Math.max(0,currentIndex-1))}/><Text style={{fontSize:agendaTight?12:agendaSmall?16:18,color:foreground}}>{dated.length?currentIndex+1:0} / {dated.length}</Text><VehicleIconButton label="다음 일정" icon="next" size={agendaTight?28:agendaSmall?36:40} disabled={currentIndex>=dated.length-1} onPress={()=>setPage(Math.min(dated.length-1,currentIndex+1))}/></View>
 {!!meeting&&<VehicleActions layout="row" maxSize={agendaTight?64:agendaSmall?96:220} align="start" items={[{label:'이 일정 준비하기',icon:'briefing',primary:true,onPress:()=>router.push({pathname:'/meeting/[id]',params:{id:meeting.id}})}]}/>}<View style={{flex:1,minHeight:0}}/>
 </View>
 </View>}
 <View testID="vehicle-calendar-footer" style={{height:footerSize,flexShrink:0}}><VehicleActions layout="row" maxSize={footerSize} align="end" items={[...(session?[{label:'일정 새로고침',icon:'refresh' as const,busy:loadingMeetings,disabled:loadingMeetings,onPress:()=>{void refreshMeetings();}}]:[]),{label:'내 미팅으로',icon:'home',onPress:()=>router.replace('/')}]} /></View>
 </SafeAreaView>;
}
