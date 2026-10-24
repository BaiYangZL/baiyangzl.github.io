// Lossless transport only: the repository keeps the original Cocos runtime bytes.
const fs = require('node:fs/promises');
const path = require('node:path');
const { gzipSync, gunzipSync } = require('node:zlib');
const assert = require('node:assert/strict');

async function prepare(root = process.cwd(), destination = path.join(root, '.edgeone-dist')) {
  root = path.resolve(root); destination = path.resolve(destination);
  assert(destination.startsWith(root + path.sep), 'Output must stay inside the checkout');
  await fs.mkdir(destination); // A fresh deployment must never overwrite an old output.
  const report = { version: 'lossless-bin-20261024', files: 0, originalBytes: 0, transferBytes: 0 };
  async function copy(relative = '') {
    for (const item of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
      if (!relative && ['.git', '.github', 'node_modules', '.edgeone-dist', 'tools'].includes(item.name)) continue;
      const name = path.join(relative, item.name), target = path.join(destination, name);
      assert(!item.isSymbolicLink(), 'Symlink not allowed: ' + name);
      if (item.isDirectory()) { await fs.mkdir(target); await copy(name); continue; }
      const bytes = await fs.readFile(path.join(root, name));
      if ((name.replaceAll('\\', '/').startsWith('tavern/assets/') || name.replaceAll('\\', '/').startsWith('tavern/packs/')) && name.endsWith('.bin')) {
        const compressed = gzipSync(bytes, { level: 9 });
        assert(gunzipSync(compressed).equals(bytes), 'Compression round-trip failed: ' + name);
        await fs.writeFile(target, compressed);
        report.files++; report.originalBytes += bytes.length; report.transferBytes += compressed.length;
      } else await fs.writeFile(target, bytes);
    }
  }
  await copy();
  await fs.writeFile(path.join(destination, 'delivery-report.json'), JSON.stringify(report));
  return report;
}
module.exports = { prepare };
if (require.main === module) prepare().then(console.log).catch(error => { console.error(error); process.exitCode = 1; });
