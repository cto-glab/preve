import {Redirect} from 'expo-router';
import {environment} from '../../config/environment';
import {VehicleCalendar} from '../../features/meetings/VehicleCalendar';
export default function Calendar(){return environment.target==='pleos'?<VehicleCalendar />:<Redirect href="/" />;}
