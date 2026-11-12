import { Redirect } from 'expo-router';
import { environment } from '../../config/environment';
import { VehicleConnection } from '../../features/meetings/VehicleConnection';
export default function Connection() { return environment.target === 'pleos' ? <VehicleConnection /> : <Redirect href="/settings" />; }
