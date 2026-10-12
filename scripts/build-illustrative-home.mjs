import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { homepageFromDesign } from './build-home.mjs';

export function illustrativeHome(source) {
  const snapshot = homepageFromDesign(source);
  return snapshot
    .replace('href="#" lang="es"', 'href="./health-age-assessment/" lang="es"')
    .replace('Ver en español</a>', 'Quiz: English / Español</a>')
    .replace("Let's talk — it's free", "Let's talk")
    .replace('[WARM PORTRAIT OF MARIO — in the office or outdoors]', '<img src="./assets/a143c2a9960446d649523f272677f609.jpg" alt="Your Pure Path tree logo" style="width: 100%; max-width: 360px; border-radius: 50%">')
    .replace('<p style="margin: 0">[2–3 SENTENCES IN MARIO\'S OWN VOICE: why he started Your Pure Path and who he loves working with.]</p>', '')
    .replace('[CREDENTIALS · YEARS IN PRACTICE]', 'Certified Functional Nutritional Counselor')
    .replace('[HOURS]', 'Contact Mario for appointment availability.')
    .replace('Video sessions in English or Spanish', 'Ask about English or Spanish support')
    .replace("Start with a free 15-minute conversation. No pressure — just a chance to see if we're a good fit.", "Start with a conversation. Contact Mario to discuss the support you're looking for.")
    .replace('<a href="#" style="text-decoration: none; border: 1.5px solid #F4F1E6; color: #F4F1E6; padding: 17px 30px; border-radius: 10px; font-weight: 700; font-size: 18px">Book online</a>', '<a href="mailto:mario@yourpurepath.com" style="text-decoration: none; border: 1.5px solid #F4F1E6; color: #F4F1E6; padding: 17px 30px; border-radius: 10px; font-weight: 700; font-size: 18px">Arrange a conversation</a>')
    .replace('<a href="./wellness-snapshot/" style="color: #F4F1E6; text-decoration: none">Wellness Snapshot</a>', '<a href="./health-age-assessment/" style="color: #F4F1E6; text-decoration: none">Illustrative Health-Age Quiz</a>\n<a href="./wellness-snapshot/" style="color: #F4F1E6; text-decoration: none">Wellness Snapshot</a>')
    .replace('Start my snapshot</a>', 'Start my snapshot</a>\n<a href="./health-age-assessment/" style="align-self: flex-start; text-decoration: none; background: #B9CF5C; color: #26301A; padding: 17px 30px; border-radius: 10px; font-weight: 700; font-size: 18px">Try the original 22-question quiz</a>\n<p style="margin: 0; font-size: 16px; line-height: 1.6; color: #E9E2CC">The 22-question quiz gives an illustrative age comparison from custom weights. It does not measure biological age or diagnose health conditions.</p>');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = readFileSync(new URL('../Neighbor.dc.html', import.meta.url), 'utf8');
  writeFileSync(new URL('../index.html', import.meta.url), illustrativeHome(source));
  console.log('Built homepage with separate 22-question and 8-question routes.');
}
