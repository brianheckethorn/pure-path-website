// Parent-approved specification received 2026-10-12. Educational content still
// requires clinical/content review before publication. No clinical thresholds.
export const sources = {
  food: [{ title: 'American Heart Association: fruit and vegetable choices', url: 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/nutrition-basics/fresh-frozen-or-canned-fruits-and-vegetables-all-can-be-healthy-choices' }],
  movement: [
    { title: 'CDC: adult activity', url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html' },
    { title: 'CDC: activity with health conditions and disabilities', url: 'https://www.cdc.gov/physical-activity-basics/guidelines/chronic-health-conditions-and-disabilities.html' }
  ],
  sleep: [{ title: 'CDC: about sleep', url: 'https://www.cdc.gov/sleep/about/index.html' }],
  tobacco: [{ title: 'CDC: vaping and quitting', url: 'https://www.cdc.gov/tobacco/e-cigarettes/quitting.html' }],
  privacy: { title: 'FTC: health app privacy practices', url: 'https://www.ftc.gov/business-guidance/resources/mobile-health-app-developers-ftc-best-practices' }
};
const options = entries => [...entries.map(([id, label]) => ({ id, label })), { id: 'unsure', label: 'Not sure' }, { id: 'skip', label: 'Skip' }];
const foodDays = [['none', 'No days'], ['some', '1–3 days'], ['often', '4–6 days'], ['daily', 'Every day']];
export const snapshotContent = {
  intro: 'Answer 8 simple questions about your daily habits. See your snapshot right away. No email needed.',
  disclaimer: 'This is wellness education, not medical advice or a diagnosis. Choose ideas that fit your existing care plan. A health professional can help you decide what is right for you.',
  questions: [
    { id: 'fruit', domain: 'food', prompt: 'How many days a week do you eat fruit?', help: 'Fresh, frozen, canned, and dried fruit count.', options: options(foodDays) },
    { id: 'vegetables', domain: 'food', prompt: 'How many days a week do you eat vegetables?', help: 'Fresh, frozen, and canned vegetables count.', options: options(foodDays) },
    { id: 'wholeGrains', domain: 'food', prompt: 'How many days a week do you eat whole grains?', help: 'Examples: oatmeal, brown rice, and whole-grain bread.', options: options(foodDays) },
    { id: 'movement', domain: 'movement', prompt: 'How many days a week do you move enough to breathe a bit harder?', help: 'Examples: a fast walk, dancing, swimming, or pushing a wheelchair.', options: options([['none', 'No days'], ['some', '1–2 days'], ['often', '3–4 days'], ['most', '5–7 days']]) },
    { id: 'muscles', domain: 'movement', prompt: 'How many days a week do you do exercises that make your muscles work hard?', help: 'Examples: weights or exercise bands.', options: options([['none', 'No days'], ['one', '1 day'], ['twoPlus', '2 or more days']]) },
    { id: 'sleepHours', domain: 'sleep', prompt: 'About how much sleep do you get in a full day?', help: 'Count naps too.', options: options([['less', 'Less than 7 hours'], ['middle', '7–9 hours'], ['more', 'More than 9 hours'], ['varies', 'It changes a lot']]) },
    { id: 'rested', domain: 'sleep', prompt: 'How often do you feel rested after sleep?', help: '', options: options([['most', 'Most days'], ['some', 'Some days'], ['hardly', 'Hardly ever']]) },
    { id: 'tobacco', domain: 'tobacco', prompt: 'Do you smoke tobacco or use a nicotine vape?', help: 'Do not count patches or gum used to quit.', options: options([['most', 'Yes, most days'], ['some', 'Yes, some days'], ['former', "I used to, but don't now"], ['never', 'I have never done either']]) }
  ],
  domains: [
    { id: 'food', title: 'Food', sources: sources.food },
    { id: 'movement', title: 'Movement', sources: sources.movement },
    { id: 'sleep', title: 'Sleep', sources: sources.sleep },
    { id: 'tobacco', title: 'Smoking and vaping', sources: sources.tobacco }
  ]
};
