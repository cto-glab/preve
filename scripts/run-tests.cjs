const { readdirSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const files = readdirSync('tests').filter(name => name.endsWith('.test.cjs')).sort().map(name => `tests/${name}`);
if (!files.length) throw new Error('No tests found');
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
