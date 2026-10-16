import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { homepageFromDesign } from './build-home.mjs';

export function illustrativeHome(source) {
  const snapshot = homepageFromDesign(source);
  return snapshot
    .replace('href="#" lang="es"', 'href="./health-age-assessment/" lang="es"')
    .replace('Ver en español</a>', 'Quiz: English / Español</a>')
    .replace("Let's talk — it's free", "Let's talk")
    .replace('[WARM PORTRAIT OF MARIO — in the office or outdoors]', '<img src="./assets/mario-portrait.jpg" alt="Mario" width="360" height="360" style="width: 100%; height: auto; max-width: 360px; border-radius: 50%">')
    .replace('<p style="margin: 0">[2–3 SENTENCES IN MARIO\'S OWN VOICE: why he started Your Pure Path and who he loves working with.]</p>', '')
    .replace('[CREDENTIALS · YEARS IN PRACTICE]', 'Certified Functional Nutritional Counselor')
    .replace('[HOURS]', 'Contact Mario for appointment availability.')
    .replace('Video sessions in English or Spanish', 'Ask about English or Spanish support')
    .replace("Start with a free 15-minute conversation. No pressure — just a chance to see if we're a good fit.", "Start with a conversation. Contact Mario to discuss the support you're looking for.")
    .replace('<a href="#" style="text-decoration: none; border: 1.5px solid #F4F1E6; color: #F4F1E6; padding: 17px 30px; border-radius: 10px; font-weight: 700; font-size: 18px">Book online</a>', '<a href="mailto:mario@yourpurepath.com" style="text-decoration: none; border: 1.5px solid #F4F1E6; color: #F4F1E6; padding: 17px 30px; border-radius: 10px; font-weight: 700; font-size: 18px">Arrange a conversation</a>')
    .replace('<a href="./wellness-snapshot/" style="color: #F4F1E6; text-decoration: none">Wellness Snapshot</a>', '<a href="./health-age-assessment/" style="color: #F4F1E6; text-decoration: none">Health Age Assessment</a>')
    .replace('Your Wellness Snapshot</h2>', 'Your Health Age Assessment</h2>')
    .replace('Answer 8 simple questions about your daily habits. See your snapshot right away. No email needed.', 'Respond to 31 questions about your daily habits and health history. See a rough educational health-age comparison when enough scoring information is available, then print or save your report locally. Not known and prefer not to answer are valid responses. No email needed.')
    .replace('href="./wellness-snapshot/" style="align-self: flex-start;', 'href="./health-age-assessment/" style="align-self: flex-start;')
    .replace('Start my snapshot</a>', 'Start my Health Age Assessment</a>\n<p style="margin: 0; font-size: 16px; line-height: 1.6; color: #E9E2CC">Local scoring candidate: weights and the conversion to years are custom educational choices. This educational quiz is not scientifically validated and does not measure biological age or diagnose health conditions.</p>\n<a href="./wellness-snapshot/" style="align-self: flex-start; color: #F4F1E6; font-size: 16px">Optional: 8-question Wellness Snapshot (no age estimate)</a>')
    .replace('A question from your snapshot', 'A question from the Health Age Assessment')
    .replace('How many days a week do you eat fruit?', 'How would you describe your sleep?')
    .replace('>No days</span>', '>Poor</span>').replace('>1–3 days</span>', '>Fair</span>').replace('>4–6 days</span>', '>Good</span>').replace('>Every day</span>', '>Excellent</span>');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = readFileSync(new URL('../Neighbor.dc.html', import.meta.url), 'utf8');
  writeFileSync(new URL('../index.html', import.meta.url), illustrativeHome(source));
  console.log('Built homepage with the 31-question Health Age Assessment as the primary questionnaire.');
}
