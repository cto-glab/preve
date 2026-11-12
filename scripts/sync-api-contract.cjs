const { readFileSync, writeFileSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const source = resolve(process.argv[2] || 'D:/docker/node_server/preve_server/openapi/openapi.json');
const contract = JSON.parse(readFileSync(source, 'utf8'));
if (contract.openapi !== '3.0.3' || !contract.paths['/v1/documents/{documentId}']) throw new Error('Unexpected server API contract');
writeFileSync(resolve(dirname(process.argv[1]), '../src/api/generated/openapi.json'), JSON.stringify(contract, null, 2) + '\n');
console.log(`Synced API contract ${contract.info.version}`);
