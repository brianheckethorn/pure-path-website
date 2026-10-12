import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const originalFiles = {
  'Neighbor.dc.html': '2A74A130790AA38BE595670D416B80AEEC10B74D4A977CF9E4936F9A659C2CC3',
  'README.md': 'B62F2EB8C554E42CE102A018696AEB8C65D05657EF6D4008C19B39D11012D3B3',
  'support.js': '654B7F6201E7E08C0AA3D9C670125D53B47F1438141ECD0D7DF05589A877B324',
  'assets/a143c2a9960446d649523f272677f609.jpg': 'B07E604C8033CCA684EE7D781BEB98D42C877E4F3EE298F9DB2B5E4C2B613958',
  'vendor/react.js': 'D949F1C3687AEDADCEDAC85261865F29B17CD273997E7F6B2BFC53B2F9D4C4DD',
  'vendor/react-dom.js': '35F4F974F4B2BCD44DA73963347F8952E341F83909E4498227D4E26B98F66F0D'
};

for (const [path, expected] of Object.entries(originalFiles)) {
  const data = readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)));
  const actual = createHash('sha256').update(data).digest('hex').toUpperCase();
  if (actual !== expected) throw new Error(`Original design changed: ${path}`);
  console.log(`Preserved: ${path}`);
}
