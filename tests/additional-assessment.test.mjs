import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, text } from '../components/educational-age/content.js';
import { additionalQuestions } from '../components/educational-age/additional-questions.js';
import { calculateIllustrativeAge, scoringMaps, weights } from '../components/educational-age/scoring.js';
import { resultEmailText, discussionIdeas, answerText } from '../components/educational-age/results.js';
import { mountEducationalAge } from '../components/educational-age/component.js';
import { createMockDeliveryAdapter } from '../components/wellness-snapshot/delivery.js';
import { componentHarness } from './dom-harness.mjs';

const core = () => ({ age: '50', height: '67', weight: '160', ...Object.fromEntries(Object.entries(scoringMaps).map(([id, choices]) => [id, Object.keys(choices)[0]])) });

test('all expanded inputs have bilingual copy and remain outside age arithmetic', () => {
  assert.equal(questions.length, 40);
  assert.equal(new Set(questions.map(q => q.id)).size, 40);
  const base = core(); const expected = calculateIllustrativeAge(base);
  for (const question of additionalQuestions) {
    assert.equal(question.supplemental, true); assert.equal(question.score, 'none');
    assert.equal(question.id in scoringMaps, false); assert.equal(question.id in weights, false);
    for (const language of ['en', 'es']) { assert.ok(question.prompt[language]); assert.ok(question.help[language]); }
    for (const value of [undefined, 'skip', 'unknown', ...(question.options || []).map(option => option.id), { value: '99999', unit: 'other' }]) {
      assert.deepEqual(calculateIllustrativeAge({ ...base, [question.id]: value }), expected, `${question.id}: ${String(value)}`);
    }
  }
});

test('private faith/contact choices stay out of saved reports and entered units stay explicit', () => {
  const answers = { ...core(), fullName: 'Synthetic Ángela', spiritualityPreference: 'deep', reportContact: { email: 'synthetic@example.test', address: 'PRIVATE_CONTACT_SENTINEL' }, bloodGlucoseReading: { value: '5.4', unit: 'mmolL', timing: 'fasting' } };
  for (const language of ['en', 'es']) {
    const report = resultEmailText(calculateIllustrativeAge(answers), answers, language);
    assert.match(report, /Synthetic Ángela/); assert.match(report, /mmol\/L/);
    assert.doesNotMatch(report, /synthetic@example|PRIVATE_CONTACT_SENTINEL|Deeply spiritual|Profundamente espiritual/);
    assert.ok(report.includes(text.actual[language])); assert.ok(report.includes(text.estimate[language]));
    assert.ok(report.includes(text.readingNotice[language])); assert.ok(report.includes(text.glucoseSafety[language]));
  }
  const glucose = questions.find(q => q.id === 'bloodGlucoseReading');
  assert.match(answerText(glucose, { value: '100' }, 'en'), /Unit: Not answered/);
});

test('unassessed readings and entry issues are always exported even with a favorable estimate', () => {
  const best = { age: '45', height: '67', weight: '150', ...Object.fromEntries(Object.entries(scoringMaps).map(([id, choices]) => [id, Object.entries(choices).sort((a,b) => b[1]-a[1])[0][0]])) };
  const answers = { ...best, waistMeasurement: { value: '-5' }, bloodPressureReading: { systolic: '200', diastolic: '130' }, bloodGlucoseReading: { value: '40' } };
  const result = calculateIllustrativeAge(answers);
  assert.equal(result.quizAge, 35);
  for (const language of ['en', 'es']) {
    const report = resultEmailText(result, answers, language);
    assert.ok(report.includes(text.readingNotice[language])); assert.ok(report.includes(text.readingIssues[language]));
    assert.ok(report.includes(text.bpSafety[language])); assert.ok(report.includes(text.glucoseSafety[language]));
    assert.match(report, /https:\/\/www\.heart\.org/); assert.match(report, /https:\/\/www\.niddk\.nih\.gov/);
    assert.ok(report.indexOf(text.readingNotice[language]) < report.indexOf(text.suggestions[language]));
  }
});

test('additional recommendations follow explicit answers without assuming smoking or condemning snacks', () => {
  assert.equal(discussionIdeas({ tobaccoHistory: 'never' }).some(tip => tip.key === 'nicotine'), false);
  assert.equal(discussionIdeas({ tobaccoHistory: 'current' })[0].key, 'nicotine');
  assert.equal(discussionIdeas({ wholeGrainServings: 'none' })[0].key, 'wholeGrains');
  assert.equal(discussionIdeas({ nutSeedServings: '0-2' })[0].key, 'nutsSeeds');
  assert.equal(discussionIdeas({ snackingFrequency: 'severalDaily' })[0].key, 'snacks');
  assert.doesNotMatch(JSON.stringify(discussionIdeas({ spiritualityPreference: 'noInterest' })), /increase spirituality|immune|years gained|biological age/i);
});

test('unit conversion machine noise cannot cross an existing BMI factor boundary', () => {
  for (let height = 48; height <= 84; height += .5) for (const bmi of [16, 17, 18.5, 25, 30, 35]) {
    const weight = bmi * height * height / 703;
    if (weight < 80 || weight > 500) continue;
    const imperial = calculateIllustrativeAge({ ...core(), height, weight });
    const metric = calculateIllustrativeAge({ ...core(), height: height * 2.54, heightUnit: 'cm', weight: weight * .45359237, weightUnit: 'kg' });
    assert.equal(metric.quizAge, imperial.quizAge, `${height} inches / BMI ${bmi}`);
    assert.equal(metric.score, imperial.score);
  }
});

test('optional multi-select, clear, skip-to-results, and known actual age work without inferred data', () => {
  const ui = componentHarness(); mountEducationalAge(ui.root, { delivery: createMockDeliveryAdapter() });
  const input = ui.find(n => n.type === 'number')[0]; input.value = '50'; input.emit('input');
  for (let i = 0; i < questions.findIndex(q => q.id === 'interests'); i++) ui.click(text.next.en);
  ui.select('Healthy cooking'); ui.select('Memory and concentration');
  ui.click('Español'); assert.ok(ui.inputByLabel('Cocina saludable').checked); assert.ok(ui.inputByLabel('Memoria y concentración').checked);
  ui.click(text.clear.es); assert.equal(ui.find(n => n.type === 'checkbox' && n.checked).length, 0);
  ui.click('Omitir los detalles opcionales restantes y ver resultados');
  assert.match(ui.root.textContent, /Tu edad real: 50 años/); assert.ok(ui.root.textContent.includes(text.withheld.es));
});
