import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive a runnable local homepage from the preserved Claude Design artboard.
// Only the questionnaire navigation and callout change. All other artboard
// markup, colors, spacing, imagery, and placeholder copy remain unchanged.
export function homepageFromDesign(source) {
  const artboard = source.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];
  const helmet = artboard.match(/<helmet>([\s\S]*?)<\/helmet>/)[1]
    .replace(/<link rel="preconnect"[^>]*>/, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="./assets/fonts/fonts.css">');
  let body = artboard.replace(/<helmet>[\s\S]*?<\/helmet>/, '').replaceAll('{{lime}}', '#B9CF5C');
  body = body.replace('href="#quiz" style="color: #F4F1E6; text-decoration: none">Health Age', 'href="./wellness-snapshot/" style="color: #F4F1E6; text-decoration: none">Wellness Snapshot');
  body = body.replace("What's your Health Age?", 'Your Wellness Snapshot');
  body = body.replace('A free, [X]-minute questionnaire that reflects on your everyday habits and suggests a first step. No sign-up needed.', 'Answer 8 simple questions about your daily habits. See your snapshot right away. No email needed.');
  body = body.replace('<a href="#" style="align-self: flex-start;', '<a href="./wellness-snapshot/" style="align-self: flex-start;');
  body = body.replace('Start the questionnaire', 'Start my snapshot');
  body = body.replace('Question 1 of [N]', 'A question from your snapshot');
  body = body.replace('How many hours do you usually sleep?', 'How many days a week do you eat fruit?');
  body = body.replace('>Under 6</button>', '>No days</button>').replace(/>6[-–]7<\/button>/, '>1–3 days</button>').replace(/>7[-–]9<\/button>/, '>4–6 days</button>').replace('>Over 9</button>', '>Every day</button>');
  // Sample options remain visual examples, not misleading functional controls.
  body = body.replace(/<button type="button" style="([^\"]*)">(.*?)<\/button>/g, '<span style="$1; display: block; text-align: center">$2</span>');
  return `<!doctype html>\n<!-- Local preview derived from Neighbor.dc.html; original export preserved. -->\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Your Pure Path - Mario, Up Close</title>\n${helmet}\n</head>\n<body>${body}\n</body>\n</html>\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = readFileSync(new URL('../Neighbor.dc.html', import.meta.url), 'utf8');
  writeFileSync(new URL('../index.html', import.meta.url), homepageFromDesign(source));
  console.log('Generated local homepage from preserved Claude Design artboard.');
}
