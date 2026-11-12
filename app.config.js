const { resolveTarget } = require('./config/targets.cjs');

module.exports = () => {
  const target = resolveTarget(process.env.APP_TARGET);
  return {
    expo: {
      name: target.name,
      slug: 'preve',
      icon: './assets/branding/preve/icon.png',
      scheme: `preve-${target.id}`,
      version: '0.1.0',
      platforms: ['android'],
      orientation: target.id === 'pleos' ? 'default' : 'portrait',
      userInterfaceStyle: 'light',
      newArchEnabled: true,
      android: {
        package: target.package,
        versionCode: 1,
        adaptiveIcon: {
          foregroundImage: './assets/branding/preve/adaptive-foreground.png',
          backgroundColor: '#F0F7FF',
          monochromeImage: './assets/branding/preve/adaptive-monochrome.png',
        },
        allowBackup: false,
        edgeToEdgeEnabled: true,
        blockedPermissions: [
          'android.permission.READ_SMS', 'android.permission.RECEIVE_SMS',
          'android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE',
          'android.permission.SYSTEM_ALERT_WINDOW',
          ...(target.id === 'mobile' ? ['android.permission.RECORD_AUDIO'] : []),
          ...(target.id === 'pleos' ? ['android.permission.CAMERA'] : []),
        ],
      },
      plugins: ['expo-router', 'expo-secure-store', ['expo-splash-screen', {
        image: './assets/branding/preve/splash.png',
        imageWidth: 288,
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
        dark: { image: './assets/branding/preve/splash.png', backgroundColor: '#FFFFFF' },
      }], ...(target.id === 'pleos' ? ['./plugins/with-pleos'] : [['expo-camera', { recordAudioAndroid: false }]])],
      extra: { appTarget: target.id },
      experiments: { typedRoutes: true },
    },
  };
};

