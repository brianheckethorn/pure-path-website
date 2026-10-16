import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
export const publicFiles = [
  '.nojekyll', 'CNAME', 'index.html', 'health-age.html', 'health-age-assessment.html',
  'health-age-assessment/index.html', 'health-age-assessment/page.js',
  'wellness-snapshot/index.html', 'wellness-snapshot/page.js',
  'assets/a143c2a9960446d649523f272677f609.jpg', 'assets/mario-portrait.jpg',
  'assets/fonts/fonts.css', 'assets/fonts/DM-Serif-Display-OFL.txt', 'assets/fonts/Karla-OFL.txt',
  'assets/fonts/dm-serif-display-regular.ttf', 'assets/fonts/dm-serif-display-italic.ttf',
  'assets/fonts/karla-regular.ttf', 'assets/fonts/karla-medium.ttf', 'assets/fonts/karla-bold.ttf',
  'components/support-preferences.js', 'components/result-tools.js', 'components/result-pdf.js', 'components/result-pdf-fonts.js', 'components/result-report.js', 'components/report-portrait.js',
  ...['age.css', 'component.js', 'content.js', 'results.js', 'scoring.js', 'candidate-scoring.js', 'additional-questions.js', 'measurements.js', 'reading-context.js', 'response-policy.js', 'question-guidance.js'].map(name => `components/educational-age/${name}`),
  ...['component.js', 'content.js', 'delivery.js', 'model.js', 'snapshot.css'].map(name => `components/wellness-snapshot/${name}`)
];
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async entry => {
    if (entry.name === '.DS_Store') return []; // Finder metadata is never a published asset.
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Unexpected symbolic link in published folder.');
    return entry.isDirectory() ? await files(target) : [path.relative(path.join(root, 'docs'), target).split(path.sep).join('/')];
  }))).flat();
}
export async function buildSite() {
  const output = path.join(root, 'docs');
  await mkdir(output, { recursive: true });
  const extras = (await files(output)).filter(file => !publicFiles.includes(file));
  if (extras.length) throw new Error(`Unexpected files in generated publish folder; review before changing: ${extras.join(', ')}`);
  for (const file of publicFiles) {
    const target = path.join(output, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await readFile(path.join(root, file)));
  }
  console.log(`Built ${publicFiles.length} public files in docs/. Design prototypes, tests, and handoff documents are excluded.`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await buildSite();
