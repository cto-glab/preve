const { spawnSync } = require('node:child_process');
const { resolveTarget } = require('../config/targets.cjs');
const [targetName, command, ...args] = process.argv.slice(2);
const target = resolveTarget(targetName);
if (!command) throw new Error('Usage: node scripts/expo.cjs mobile|pleos <expo command>');
// Native folders are generated and ignored. Regenerate when switching targets so
// automotive permissions/features cannot leak into the phone binary.
if (command === 'run:android') {
  const prepared = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), 'prebuild', '--platform', 'android', '--clean', '--no-install'], {
    stdio: 'inherit', env: { ...process.env, APP_TARGET: target.id },
  });
  if (prepared.error) throw prepared.error;
  if (prepared.status !== 0) process.exit(prepared.status ?? 1);
}
const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), command, ...args], {
  stdio: 'inherit', env: { ...process.env, APP_TARGET: target.id },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
