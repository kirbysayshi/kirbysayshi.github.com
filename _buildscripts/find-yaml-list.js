module.exports = function fileYamlList(contents, propRe) {
  const all = [];
  const lines = contents.split('\n');
  const propIdx = lines.findIndex(line => line.match(propRe));

  if (propIdx === -1) return all;

  let idx = propIdx + 1;
  while (idx < lines.length) {
    const line = lines[idx++];
    const match = line.match(/^\s*\-(.+)$/);
    const isFrontMatterEnd = line.match(/---/);
    if (isFrontMatterEnd) break;
    if (!match) break;
    const val = match[1].trim();
    all.push(val);
  }

  return all;
}