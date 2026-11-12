/* eslint-disable import/no-unresolved -- Official single-icon package exports are supported by Metro, not the legacy ESLint resolver. */
import IconMicrophone from '@tabler/icons-react-native/IconMicrophone';
import IconNotes from '@tabler/icons-react-native/IconNotes';
import IconArrowLeft from '@tabler/icons-react-native/IconArrowLeft';
import IconArrowRight from '@tabler/icons-react-native/IconArrowRight';
import IconCalendar from '@tabler/icons-react-native/IconCalendar';
import IconCalendarEvent from '@tabler/icons-react-native/IconCalendarEvent';
import IconRefresh from '@tabler/icons-react-native/IconRefresh';
import IconLink from '@tabler/icons-react-native/IconLink';
import IconUnlink from '@tabler/icons-react-native/IconUnlink';
import IconHome from '@tabler/icons-react-native/IconHome';
import IconPlayerPlay from '@tabler/icons-react-native/IconPlayerPlay';
import IconX from '@tabler/icons-react-native/IconX';
import IconLogout from '@tabler/icons-react-native/IconLogout';
import IconLoader2 from '@tabler/icons-react-native/IconLoader2';
import IconChevronLeft from '@tabler/icons-react-native/IconChevronLeft';
import IconChevronRight from '@tabler/icons-react-native/IconChevronRight';
export type VehicleIconName='microphone'|'briefing'|'previous'|'next'|'calendar'|'today'|'refresh'|'connection'|'disconnect'|'home'|'start'|'cancel'|'exit'|'loading'|'chevron-left'|'chevron-right';
const icons={'microphone':IconMicrophone,'briefing':IconNotes,'previous':IconArrowLeft,'next':IconArrowRight,'calendar':IconCalendar,'today':IconCalendarEvent,'refresh':IconRefresh,'connection':IconLink,'disconnect':IconUnlink,'home':IconHome,'start':IconPlayerPlay,'cancel':IconX,'exit':IconLogout,'loading':IconLoader2,'chevron-left':IconChevronLeft,'chevron-right':IconChevronRight};
export function VehicleIcon({name,size,color}:{name:VehicleIconName;size:number;color:string}){const Icon=icons[name];return <Icon size={size} color={color} strokeWidth={1.8} accessible={false}/>;}
