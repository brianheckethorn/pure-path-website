import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { homepageFromDesign } from './build-home.mjs';

const decorativeBadge = (name, size) => `<img src="./assets/icons/${name}.svg" alt="" aria-hidden="true" width="${size}" height="${size}" style="display: block; flex: none">`;

export function illustrativeHome(source) {
  const snapshot = homepageFromDesign(source);
  return snapshot
    .replace('href="#" lang="es"', 'href="./health-age-assessment/" lang="es"')
    .replace('Ver en español</a>', 'Quiz: English / Español</a>')
    .replace('</nav>', '<a href="https://www.facebook.com/YourPurePath" style="color: #F4F1E6; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 44px; padding: 8px 14px; box-sizing: border-box; border: 1.5px solid #B9CF5C; border-radius: 8px; font-weight: 700"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect width="24" height="24" rx="5" fill="#1877F2"/><path d="M14.5 22V13.1h3l.5-3.5h-3.5V7.3c0-1 .3-1.8 1.8-1.8H18V2.4c-.6-.1-1.7-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2.9H8v3.5h3V22h3.5Z" fill="#FFFFFF"/></svg><span>Facebook</span></a>\n</nav>')
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
    .replace('Answer 8 simple questions about your daily habits. See your snapshot right away. No email needed.', 'Explore 31 questions about your daily habits and health history. Compare your actual age with a rough educational health-age estimate when enough scoring information is available. Get practical next steps matched to your answers and a personal report you can print, save as a PDF, or share yourself. Not known and prefer not to answer are valid responses.')
    .replace('href="./wellness-snapshot/" style="align-self: flex-start;', 'href="./health-age-assessment/" style="align-self: flex-start;')
    .replace('Start my snapshot</a>', 'Start my Health Age Assessment</a>\n<p style="margin: 0; font-size: 16px; line-height: 1.6; color: #E9E2CC">The scoring and conversion to years are custom educational choices. This quiz is not scientifically validated and does not measure biological age or diagnose health conditions.</p>')
    .replace('A question from your snapshot', 'A question from the Health Age Assessment')
    .replace('How many days a week do you eat fruit?', 'How would you describe your sleep?')
    .replace('>No days</span>', '>Poor</span>').replace('>1–3 days</span>', '>Fair</span>').replace('>4–6 days</span>', '>Good</span>').replace('>Every day</span>', '>Excellent</span>')
    .replace(/(<h2[^>]*>Your Health Age Assessment<\/h2>)/, `${decorativeBadge('badge-health-age-light', 56)}\n$1`)
    .replace('<a href="tel:+13047127873" style="text-decoration: none;', '<a href="tel:+13047127873" style="display: inline-flex; align-items: center; justify-content: center; gap: 10px; text-decoration: none;')
    .replace('>Call (304) 712-7873</a>', `>${decorativeBadge('badge-phone-dark', 32)}<span>Call (304) 712-7873</span></a>`)
    .replace('<a href="mailto:mario@yourpurepath.com" style="text-decoration: none; background:', '<a href="mailto:mario@yourpurepath.com" style="display: inline-flex; align-items: center; justify-content: center; gap: 10px; text-decoration: none; background:')
    .replace('>Email Mario</a>', `>${decorativeBadge('badge-email-dark', 32)}<span>Email Mario</span></a>`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = readFileSync(new URL('../Neighbor.dc.html', import.meta.url), 'utf8');
  writeFileSync(new URL('../index.html', import.meta.url), illustrativeHome(source));
  console.log('Built homepage with the 31-question Health Age Assessment as the primary questionnaire.');
}
