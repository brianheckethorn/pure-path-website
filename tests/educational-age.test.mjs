import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { questions, disclosure } from '../components/educational-age/content.js';
import { weights, scoringMaps, bmiFactor, calculateIllustrativeAge, inputBounds } from '../components/educational-age/scoring.js';
import { discussionIdeas, resultEmailText } from '../components/educational-age/results.js';
import { illustrativeHome } from '../scripts/build-illustrative-home.mjs';

export function syntheticAnswers(kind = 'best') {
  return { age: '42', height: '66', weight: '140', ...Object.fromEntries(Object.entries(scoringMaps).map(([key, choices]) => [key, Object.entries(choices).sort((a,b) => kind === 'best' ? b[1] - a[1] : a[1] - b[1])[0][0]])) };
}
test('all original 22 field IDs and option coefficients are retained without source defaults', () => {
  const inventory = JSON.parse(readFileSync(new URL('../ORIGINAL-ASSESSMENT-INVENTORY.json', import.meta.url), 'utf8'));
  assert.deepEqual(questions.map(question => question.id), inventory.sections.flatMap(section => section.questions.map(question => question.id)));
  const reference = JSON.parse(readFileSync(new URL('../ILLUSTRATIVE-SCORING-REFERENCE.json', import.meta.url), 'utf8'));
  assert.deepEqual(weights, reference.weights); assert.deepEqual(scoringMaps, reference.scoringMaps);
  assert.equal(Object.values(weights).reduce((sum, number) => sum + number, 0), 98);
  for (const question of questions) {
    assert.equal('default' in question, false);
    if (question.type === 'radio') assert.deepEqual(question.options.map(option => option.id), inventory.sections.flatMap(section => section.questions).find(field => field.id === question.id).choices.map(choice => choice.value));
  }
});
test('missing/unknown/skipped/invalid required answers never produce a numeric result', () => {
  for (const id of ['age', 'height', 'weight', ...Object.keys(scoringMaps)]) {
    for (const value of [undefined, '', 'unknown', 'skip', NaN, Infinity, null, {}, []]) {
      const answers = { ...syntheticAnswers(), [id]: value };
      const result = calculateIllustrativeAge(answers);
      assert.equal(result.status, 'incomplete', `${id}: ${String(value)}`);
      assert.equal('quizAge' in result, false);
    }
  }
  assert.equal(calculateIllustrativeAge(syntheticAnswers()).status, 'complete');
  assert.equal(calculateIllustrativeAge({ ...syntheticAnswers(), sex: 'unknown' }).status, 'complete');
});
test('source adult/input bounds reject extremes and age fractions; boundary values work', () => {
  for (const [id, bounds] of Object.entries(inputBounds)) {
    for (const value of [bounds.min - .01, bounds.max + .01, -1, 0, 1e10]) assert.equal(calculateIllustrativeAge({ ...syntheticAnswers(), [id]: String(value) }).status, 'incomplete', `${id}: ${value}`);
    for (const value of [bounds.min, bounds.max]) assert.equal(calculateIllustrativeAge({ ...syntheticAnswers(), [id]: String(value) }).status, 'complete');
  }
  assert.equal(calculateIllustrativeAge({ ...syntheticAnswers(), age: '18.5' }).status, 'incomplete');
});
test('BMI factor bands have no gaps or rounding surprises at original boundaries', () => {
  for (const [value, expected] of [[15.999, .12], [16, .34], [16.999, .34], [17, .68], [18.499, .68], [18.5, 1], [24.9, 1], [24.999, 1], [25, .68], [29.9, .68], [29.999, .68], [30, .34], [34.9, .34], [34.999, .34], [35, .12], [150, .12]]) assert.equal(bmiFactor(value), expected, `${value}`);
  for (const value of [0, -1, NaN, Infinity]) assert.throws(() => bmiFactor(value));
});
test('original score rounding and year coefficients are exact; output caps cannot reverse a comparison', () => {
  const best = calculateIllustrativeAge(syntheticAnswers());
  assert.equal(best.score, 100); assert.equal(best.adjustment, -10); assert.equal(best.quizAge, 32);
  const highAgeWorst = calculateIllustrativeAge({ ...syntheticAnswers('worst'), age: '100', height: '48', weight: '500' });
  assert.equal(highAgeWorst.adjustment, 15); assert.equal(highAgeWorst.quizAge, 115); assert.equal(highAgeWorst.difference, 15);
  const youngBest = calculateIllustrativeAge({ ...syntheticAnswers(), age: '18' });
  assert.equal(youngBest.quizAge, 8); assert.equal(youngBest.difference, -10);
  for (const kind of ['best', 'worst']) {
    const result = calculateIllustrativeAge(syntheticAnswers(kind));
    assert.equal(result.score, Math.round(result.weightedTotal / result.totalWeight * 100));
    assert.equal(result.adjustment, Math.min(15, Math.max(-12, ((70 - result.score) / 30) * 10)));
  }
});
test('every better source option factor is monotonic; worsening a factor cannot lower quiz age', () => {
  for (const [key, choices] of Object.entries(scoringMaps)) {
    const ordered = Object.entries(choices).sort((a,b) => a[1] - b[1]);
    let previous = Infinity;
    for (const [value] of ordered) {
      const result = calculateIllustrativeAge({ ...syntheticAnswers('worst'), [key]: value });
      assert.ok(result.quizAge <= previous, `${key}: ${value}`); previous = result.quizAge;
    }
  }
});
test('recommendations cannot pressure never/former users to quit or propose weight loss for low BMI', () => {
  for (const nicotine of ['never', 'former', 'unknown', 'skip']) assert.equal(discussionIdeas({ nicotine }).some(idea => idea.key === 'nicotine'), false);
  assert.equal(discussionIdeas({ nicotine: 'current' }).some(idea => idea.key === 'nicotine'), true);
  assert.equal(discussionIdeas(syntheticAnswers())[0].key, 'maintenance');
  assert.doesNotMatch(JSON.stringify(discussionIdeas({ weight: '80', height: '84', functionalFitness: 'limited' })), /weight loss|lose weight|younger|stop medicine/i);
});
test('disclosure is exact, adjacent in component, and included in both-language email previews', () => {
  assert.equal(disclosure.en, 'This is an educational estimate from a custom lifestyle quiz. It does not measure biological age or diagnose health conditions.');
  for (const language of ['en', 'es']) {
    for (const answers of [syntheticAnswers(), {}]) assert.ok(resultEmailText(calculateIllustrativeAge(answers), answers, language).includes(disclosure[language]));
  }
});
test('JS failure cannot expose native health forms/inputs; no submission, storage, URL answer encoding or logging', () => {
  const paths = ['health-age-assessment/index.html', 'health-age-assessment/page.js', 'components/educational-age/component.js', 'components/educational-age/content.js', 'components/educational-age/results.js', 'components/educational-age/scoring.js'];
  for (const path of paths) assert.doesNotMatch(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), /<form\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|URLSearchParams|console\.log|location\.(?:search|hash)\s*=/i, path);
  const page = readFileSync(new URL('../health-age-assessment/index.html', import.meta.url), 'utf8');
  assert.match(page, /<noscript>/); assert.doesNotMatch(page, /<input\b|<button\b/);
});
test('homepage has separate stable links and preserves the Snapshot home version', () => {
  const source = readFileSync(new URL('../Neighbor.dc.html', import.meta.url), 'utf8');
  assert.equal(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), illustrativeHome(source));
  assert.match(illustrativeHome(source), /href="\.\/health-age-assessment\/"/);
  assert.match(illustrativeHome(source), /href="\.\/wellness-snapshot\/"/);
});
