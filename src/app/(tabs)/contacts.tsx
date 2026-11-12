import {environment} from '../../config/environment';
import {VehicleHome} from '../../features/meetings/VehicleHome';
import {ContactsScreen} from '../../features/contacts/ContactsScreen';
export default function Contacts(){return environment.target==='pleos'?<VehicleHome/>:<ContactsScreen/>;}
