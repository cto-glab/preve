const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const cli = require.resolve('expo/bin/cli');
for (const target of ['mobile', 'pleos']) {
  const config = JSON.parse(execFileSync(process.execPath, [cli, 'config', '--type', 'introspect', '--json'], {
    encoding: 'utf8', env: { ...process.env, APP_TARGET: target }, maxBuffer: 5 * 1024 * 1024,
  }));
  const android = config._internal.modResults.android;
  const manifest = android.manifest.manifest;
  const automotive = (manifest['uses-feature'] || []).some(feature => feature.$['android:name'] === 'android.hardware.type.automotive');
  assert.equal(automotive, target === 'pleos');
  assert.equal(config.android.package, `com.jb8.preve.${target}`);
  assert(manifest['uses-permission'].some(permission => permission.$['android:name'] === 'android.permission.READ_SMS' && permission.$['tools:node'] === 'remove'));
  assert(!config._internal.autolinkedModules.includes('sms-reader'));
  if (target === 'pleos') {
    assert(android.gradleProperties.some(property => property.key === 'android.minSdkVersion' && property.value === '28'));
    const activity = manifest.application[0].activity.find(activity => activity.$['android:name'] === '.MainActivity');
    assert.equal(activity.$['android:resizeableActivity'], 'true');
    assert.equal(activity.$['android:screenOrientation'], undefined);
  }
  console.log(`${target}: application ID, permissions, automotive feature and window config verified`);
}
