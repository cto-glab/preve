import Constants from 'expo-constants';

export type AppTarget = 'mobile' | 'pleos';
const target: unknown = Constants.expoConfig?.extra?.appTarget;
if (target !== 'mobile' && target !== 'pleos') {
  throw new Error('Build target is missing. Use the mobile or pleos build script.');
}
export const environment = {
  target: target as AppTarget,
  googleWebClientId: target === 'mobile' ? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || null : null,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || null,
};
