import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const manifestPath = path.join(root, 'COPY-MANIFEST.json');
async function files(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (entry.name === '.git' && entry.isDirectory()) continue;
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Copy manifest does not follow symlinks: ${entry.name}`);
    if (entry.isDirectory()) result.push(...await files(target));
    else if (entry.isFile() && target !== manifestPath && entry.name !== '.DS_Store') result.push(target);
  }
  return result.sort();
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
if (process.argv[2] === 'write') {
  const entries = [];
  for (const target of await files()) {
    const bytes = await readFile(target);
    entries.push({ path: path.relative(root, target).split(path.sep).join('/'), bytes: bytes.length, sha256: hash(bytes) });
  }
  await writeFile(manifestPath, JSON.stringify({ format: 'yourpurepath-copy-manifest-v1', generatedAt: new Date().toISOString(), sourceHost: 'QUORRA', sourceProject: root, baselineManifestSHA256: 'e7b84315f59724bd9a297f8e7e2bc02c6278955068ed809aba5b594f436d5ec6', algorithm: 'SHA-256', exclusions: ['COPY-MANIFEST.json (this manifest)', '.DS_Store (Mac metadata)', '.git (repository metadata)'], files: entries }, null, 2) + '\n');
  console.log(`Wrote COPY-MANIFEST.json for ${entries.length} files.`);
} else if (process.argv[2] === 'verify') {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.format !== 'yourpurepath-copy-manifest-v1') throw new Error('Unknown copy manifest.');
  const failures = [];
  for (const entry of manifest.files) {
    const target = path.resolve(root, entry.path);
    if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Manifest path escapes project.');
    try {
      const bytes = await readFile(target);
      if (bytes.length !== entry.bytes || hash(bytes) !== entry.sha256) failures.push(entry.path);
    } catch { failures.push(entry.path); }
  }
  const listed = new Set(manifest.files.map(entry => entry.path));
  const extras = (await files()).map(target => path.relative(root, target).split(path.sep).join('/')).filter(target => !listed.has(target));
  if (failures.length || extras.length) {
    console.error(JSON.stringify({ missingOrChanged: failures, unexpectedFiles: extras })); process.exitCode = 1;
  } else console.log(`Copy verified: ${manifest.files.length} files match SHA-256 and size.`);
} else {
  console.error('Use: node scripts/checksum.mjs write|verify'); process.exitCode = 1;
}
