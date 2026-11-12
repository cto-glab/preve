import { environment } from '../config/environment';

export type DeviceCapability = 'navigation' | 'speechInput' | 'speechOutput' | 'gleo' | 'drivingRestrictions';
export type DeviceResult = { ok: false; reason: 'not-supported' | 'not-configured' };
export interface DeviceAdapter {
  target: 'mobile' | 'pleos';
  supports: (capability: DeviceCapability) => boolean;
  navigate: (destination: { latitude: number; longitude: number; name: string }) => Promise<DeviceResult>;
}

// Explicitly unavailable until the SDK is integrated and initialized. No fake native success.
export const device: DeviceAdapter = {
  target: environment.target,
  supports: () => false,
  navigate: async () => ({ ok: false, reason: environment.target === 'pleos' ? 'not-configured' : 'not-supported' }),
};
