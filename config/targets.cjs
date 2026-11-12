const targets = {
  mobile: { name: '프리브', package: 'com.jb8.preve.mobile' },
  pleos: { name: '프리브', package: 'com.jb8.preve.pleos' },
};
function resolveTarget(value = 'mobile') {
  if (!Object.hasOwn(targets, value)) throw new Error(`Unknown APP_TARGET: ${value}`);
  return { ...targets[value], id: value };
}
module.exports = { resolveTarget };
