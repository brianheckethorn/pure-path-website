export function createSnapshotState() {
  return { adult: null, answers: {}, step: 0, resultsVisible: false, email: '', resultEmailConsent: false, mailingListConsent: false, newsletterTopics: [], spiritualSupport: '' };
}

export function answerLabel(question, value) {
  if (value === undefined) return 'Not answered';
  const option = question.options.find(candidate => candidate.id === value);
  if (!option) throw new Error('Unknown answer.');
  return option.id === 'skip' ? 'Skipped' : option.label;
}

// Return descriptive, source-authored guidance only. Never derive a numerical
// score, biological age, BMI, or clinical classification from these answers.
export function buildSnapshot(content, answers) {
  const cards = content.domains.map(domain => ({
    id: domain.id, title: domain.title,
    answers: content.questions.filter(question => question.domain === domain.id).map(question => ({ id: question.id, question: question.prompt, answer: answerLabel(question, answers[question.id]) })),
    guidance: guidanceFor(domain.id, answers), sources: domain.sources
  }));
  return {
    allMissing: content.questions.every(question => answers[question.id] === undefined || answers[question.id] === 'skip'),
    cards,
    steps: snapshotSteps(answers),
    disclaimer: content.disclaimer
  };
}

function guidanceFor(domain, answers) {
  if (domain === 'food') {
    if (answers.fruit === 'daily' && answers.vegetables === 'daily') return 'Try a different fruit or vegetable you like for variety.';
    return 'Try adding a fruit or vegetable you like to a meal or snack.';
  }
  if (domain === 'movement') return 'Small amounts of movement can help. Choose something you enjoy that feels safe for your body.';
  if (domain === 'sleep') return answers.rested === 'hardly'
    ? 'Try keeping regular bed and wake times. If you hardly ever feel rested, consider talking with a health professional.'
    : 'Try keeping regular bed and wake times.';
  if (domain === 'tobacco') {
    if (answers.tobacco === 'never') return '';
    if (answers.tobacco === 'former') return 'If you would like support for staying tobacco-free, a health professional can help.';
    if (answers.tobacco === 'most' || answers.tobacco === 'some') return 'If you would like support for quitting, a health professional can help you find options.';
    return 'If quitting support would be useful to you, a health professional can help.';
  }
  return '';
}

export function snapshotSteps(answers) {
  const steps = [];
  if (['most', 'some'].includes(answers.tobacco)) steps.push('Write down one question about quitting support to bring to a health professional.');
  if (answers.tobacco === 'former') steps.push('If support with staying tobacco-free would help, write down one question for a health professional.');
  if (answers.rested === 'hardly' || ['less', 'varies'].includes(answers.sleepHours)) steps.push('Choose one regular bedtime or wake-up cue to try. If you hardly ever feel rested, discuss it with a health professional.');
  if (['none', 'some'].includes(answers.fruit) || ['none', 'some'].includes(answers.vegetables)) steps.push('If it fits your care plan, add a fruit or vegetable you enjoy to your next meal or snack.');
  if (['none', 'some'].includes(answers.movement) || ['none', 'one'].includes(answers.muscles)) steps.push('Choose one comfortable movement break to try, such as walking or seated movement, that fits your abilities and care plan.');
  if (answers.fruit === 'daily' && answers.vegetables === 'daily') steps.push('Try a different fruit or vegetable you like for variety.');
  if (!steps.length) steps.push('General idea: choose one everyday habit you would like to discuss or keep practicing.');
  return steps.slice(0, 2);
}

export function snapshotEmailText(snapshot) {
  return ['Your Wellness Snapshot', ...(snapshot.allMissing ? ["You haven't shared any answers. You can go back, or read the general tips below."] : []), 'One or two small steps', ...snapshot.steps, ...snapshot.cards.flatMap(card => [card.title, ...card.answers.map(answer => `${answer.question}\n${answer.answer}`), ...card.sources.map(source => `${source.title}: ${source.url}`)]), snapshot.disclaimer].join('\n\n');
}
