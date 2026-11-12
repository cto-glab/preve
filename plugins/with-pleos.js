const { withAndroidManifest, withGradleProperties, withSettingsGradle, withDangerousMod } = require('@expo/config-plugins');

// This config enables a resizable automotive shell; it does not grant Pleos SDK permissions.
module.exports = function withPleos(config) {
  config = withAndroidManifest(config, mod => {
    const manifest = mod.modResults.manifest;
    manifest['uses-permission'] = (manifest['uses-permission'] || []).filter(item => item.$['android:name'] !== 'android.permission.RECORD_AUDIO');
    manifest['uses-permission'].push({$: {'android:name':'android.permission.RECORD_AUDIO'}});
    const features = manifest['uses-feature'] || [];
    manifest['uses-feature'] = [
      ...features.filter(item => item.$['android:name'] !== 'android.hardware.type.automotive'),
      { $: { 'android:name': 'android.hardware.type.automotive', 'android:required': 'true' } },
    ];
    const application = manifest.application?.[0];
    for (const activity of application?.activity || []) {
      if (activity.$['android:name'] === '.MainActivity') {
        activity.$['android:resizeableActivity'] = 'true';
        const actions = require('../config/gleo-schema.json').actionCalls.map(item => item.function.name);
        activity['intent-filter'] = (activity['intent-filter'] || []).filter(filter => !filter.action?.some(item => actions.includes(item.$['android:name'])));
        for (const action of actions) activity['intent-filter'].push({action:[{$:{'android:name':action}}],category:[{$:{'android:name':'android.intent.category.DEFAULT'}}]});
        delete activity.$['android:screenOrientation'];
      }
    }
    return mod;
  });
  config = withSettingsGradle(config, mod => {
    const marker = '// preve: Google sign-in belongs to mobile only';
    if (!mod.modResults.contents.includes(marker)) {
      const anchor = 'expoAutolinking.useExpoModules()';
      if (!mod.modResults.contents.includes(anchor)) throw new Error('Expo autolinking anchor not found');
      mod.modResults.contents = mod.modResults.contents.replace(anchor,
        `${marker}\nexpoAutolinking.exclude = (expoAutolinking.exclude ?: []) + ['preve-google-auth', 'expo-camera']\n${anchor}`);
    }
    return mod;
  });
  config = withDangerousMod(config, ['android', async mod => {
    const fs = require('node:fs/promises'); const path = require('node:path');
    const assets = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/assets');
    await fs.mkdir(assets, {recursive:true});
    await fs.copyFile(path.join(mod.modRequest.projectRoot, 'config/gleo-schema.json'), path.join(assets, 'schema.json'));
    return mod;
  }]);
  return withGradleProperties(config, mod => {
    mod.modResults = mod.modResults.filter(item => item.key !== 'android.minSdkVersion');
    mod.modResults.push({ type: 'property', key: 'android.minSdkVersion', value: '28' });
    return mod;
  });
};
