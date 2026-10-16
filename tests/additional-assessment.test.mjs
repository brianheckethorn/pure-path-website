import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, originalQuestions, text } from '../components/educational-age/content.js';
import { additionalQuestions } from '../components/educational-age/additional-questions.js';
import { calculateIllustrativeAge, scoringMaps, weights } from '../components/educational-age/scoring.js';
import { calculateAssessmentPreview, resultEmailText, resultPDFModel, discussionIdeas, answerText } from '../components/educational-age/results.js';
import { mountEducationalAge } from '../components/educational-age/component.js';
import { createMockDeliveryAdapter } from '../components/wellness-snapshot/delivery.js';
import { componentHarness } from './dom-harness.mjs';
import { answerAssessmentWithoutDisclosure } from './assessment-harness.mjs';
import { candidateFixtures } from './candidate-fixtures.mjs';

const core = () => ({ age: '50', height: '67', weight: '160', ...Object.fromEntries(Object.entries(scoringMaps).map(([id, choices]) => [id, Object.keys(choices)[0]])) });

test('31 active questions use unique bilingual inputs; expanded answers cannot alter frozen legacy arithmetic', () => {
  assert.equal(questions.length, 31); assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  assert.equal(originalQuestions.length, 22);
  for (const id of ['dietQuality', 'vegetables', 'nicotine', 'bloodPressure', 'bloodSugar', 'alcohol', 'exerciseTwentyThirty', 'sleepSevenEightFrequency']) {
    assert.equal(questions.some(q => q.id === id), false, `No duplicate/removed active question: ${id}`);
  }
  const base = core(); const expected = calculateIllustrativeAge(base);
  for (const question of additionalQuestions) {
    assert.equal(question.supplemental, true); assert.equal(question.score, 'none');
    assert.equal(question.id in scoringMaps, false); assert.equal(question.id in weights, false);
    for (const language of ['en', 'es']) { assert.ok(question.prompt[language]); assert.ok(question.help[language]); }
    for (const value of [undefined, 'skip', 'unknown', 'preferNot', ...(question.options || []).map(option => option.id), { value: '99999', unit: 'other' }]) {
      assert.deepEqual(calculateIllustrativeAge({ ...base, [question.id]: value }), expected, `${question.id}: ${String(value)}`);
    }
  }
});

test('missing active candidate inputs withhold health age instead of inventing removed answers', () => {
  for (const answers of [{}, { age: '50' }, core(), { ...core(), spiritualityPreference: 'deep', tobaccoHistory: 'never', fruitVegetableServings: '5+' }]) {
    const result = calculateAssessmentPreview(answers);
    assert.equal(result.status, 'incomplete'); assert.equal(Number.isFinite(result.quizAge), false);
    assert.equal(result.actualAge, answers.age ? Number(answers.age) : null);
    for (const language of ['en', 'es']) {
      const report = resultEmailText(result, answers, language);
      assert.ok(report.includes(text.withheld[language])); assert.ok(report.includes(text.scoringReview[language]));
      assert.equal(report.split('\n').some(line => line.startsWith(`${text.estimate[language]}:`)), false);
      const model = resultPDFModel(result, answers, language);
      assert.notEqual(model.estimatePending, true); assert.equal(model.estimate, undefined);
    }
  }
});

test('private faith/contact choices stay out of incomplete saved reports and entered units stay explicit', () => {
  const answers = { ...core(), fullName: 'Synthetic Angela', spiritualityPreference: 'deep', reportContact: { email: 'synthetic@example.test', address: 'PRIVATE_CONTACT_SENTINEL' }, bloodGlucoseReading: { readingStatus: 'measured', history: 'normal', value: '5.4', unit: 'mmolL', timing: 'fasting' } };
  for (const language of ['en', 'es']) {
    const result = calculateAssessmentPreview(answers); const report = resultEmailText(result, answers, language);
    assert.match(report, /Synthetic Angela/); assert.match(report, /mmol\/L/);
    assert.doesNotMatch(report, /synthetic@example|PRIVATE_CONTACT_SENTINEL|Deeply spiritual|Profundamente espiritual/);
    assert.ok(report.includes(text.actual[language])); assert.ok(report.includes(text.withheld[language]));
    assert.ok(report.includes(text.readingNotice[language])); assert.ok(report.includes(text.glucoseSafety[language]));
    const model = resultPDFModel(result, answers, language);
    assert.equal(model.actual.value, 50); assert.equal(model.estimate, undefined);
    assert.doesNotMatch(JSON.stringify(model), /synthetic@example|PRIVATE_CONTACT_SENTINEL|Deeply spiritual|Profundamente espiritual/);
  }
  const glucose = questions.find(q => q.id === 'bloodGlucoseReading');
  assert.match(answerText(glucose, { readingStatus: 'measured', value: '100' }, 'en'), /Unit: Not answered/);
});

test('unassessed readings and entry issues are exported even for a favorable frozen legacy estimate', () => {
  const best = { age: '45', height: '67', weight: '150', ...Object.fromEntries(Object.entries(scoringMaps).map(([id, choices]) => [id, Object.entries(choices).sort((a,b) => b[1]-a[1])[0][0]])) };
  const answers = { ...best, waistMeasurement: { value: '-5' }, bloodPressureReading: { systolic: '200', diastolic: '130' }, bloodGlucoseReading: { value: '40' } };
  // This direct utility check preserves the historical formula, not active UI scoring.
  const result = calculateIllustrativeAge(answers); assert.equal(result.quizAge, 35);
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
    assert.equal(metric.quizAge, imperial.quizAge, `${height} inches / BMI ${bmi}`); assert.equal(metric.score, imperial.score);
  }
});

test('multi-select clearing needs a new explicit response; None and declined contact complete without identifiers', () => {
  const downloads = []; const ui = componentHarness();
  mountEducationalAge(ui.root, { delivery: createMockDeliveryAdapter(), onDownload: copy => downloads.push(copy) });
  const interestsIndex = questions.findIndex(q => q.id === 'interests'); const interests = questions[interestsIndex];
  for (let index = 0; index < interestsIndex; index++) {
    const current = questions[index];
    if (current.id === 'age') { const input = ui.find(n => n.type === 'number')[0]; input.value = '50'; input.emit('input'); }
    else answerAssessmentWithoutDisclosure(ui, current);
    ui.click(text.next.en);
  }
  const currentTitle = () => ui.find(n => n.tagName === 'H2')[0].textContent;
  ui.click(text.next.en); assert.equal(currentTitle(), interests.prompt.en);
  assert.ok(ui.find(n => n.className === 'snapshot-error' && n.textContent).length);
  const cooking = interests.options.find(option => option.id === 'healthyCooking');
  const memory = interests.options.find(option => option.id === 'mentalPerformance');
  ui.select(cooking.label.en); ui.select(memory.label.en); ui.click('Español');
  assert.ok(ui.inputByLabel(cooking.label.es).checked); assert.ok(ui.inputByLabel(memory.label.es).checked);
  ui.click(text.clear.es); assert.equal(ui.find(n => n.type === 'checkbox' && n.checked).length, 0);
  ui.click(text.next.es); assert.equal(currentTitle(), interests.prompt.es);
  ui.click(text.noneSelected.es); ui.click(text.next.es);
  const contact = questions.find(q => q.id === 'reportContact'); assert.equal(currentTitle(), contact.prompt.es);
  ui.click(text.finish.es); assert.equal(currentTitle(), contact.prompt.es);
  const email = ui.find(n => n.type === 'email')[0]; email.value = 'invalid'; email.emit('input');
  ui.click(text.finish.es); assert.equal(currentTitle(), contact.prompt.es);
  ui.click(text.preferNot.es); ui.click(text.finish.es);
  assert.ok(ui.root.textContent.includes(text.withheld.es));
  const comparison = ui.find(n => n.className === 'age-comparison')[0];
  assert.equal(comparison.children[0].children[1].children[0].textContent, '50');
  assert.equal(comparison.children[1].children[1].children[0].className, 'age-pending');
  assert.doesNotMatch(comparison.children[1].children[1].children[0].textContent, /\d/);
  assert.equal(comparison.children[0].children[1].children[1].textContent, text.years.es);
  assert.equal(ui.find(n => n.type === 'email').length, 0);
  ui.click('Descargar mis resultados (.txt)');
  assert.equal(downloads.length, 1); assert.ok(downloads[0].includes(text.noneSelected.es));
  assert.equal(downloads[0].includes(cooking.label.es), false); assert.equal(downloads[0].includes(memory.label.es), false);
  assert.equal(downloads[0].includes('invalid'), false);
});

test('known imperial and metric fixtures satisfy candidate coverage; missing areas and low coverage withhold an age', async () => {
  const { calculateCandidateAssessment } = await import('../components/educational-age/candidate-scoring.js');
  const results = [];
  for (const fixture of candidateFixtures) {
    const untouched = structuredClone(fixture.answers);
    const result = calculateCandidateAssessment(fixture.answers); results.push(result);
    assert.deepEqual(fixture.answers, untouched);
    assert.equal(result.status, 'complete'); assert.equal(result.actualAge, Number(fixture.answers.age));
    assert.equal(result.score, fixture.expected.score); assert.equal(result.quizAge, fixture.expected.quizAge);
    assert.deepEqual(result.coverage, fixture.expected.coverage); assert.deepEqual(result.range, fixture.expected.range);
    assert.deepEqual(result.unassessed.map(item => item.id), ['water']);
    assert.deepEqual(calculateCandidateAssessment({ ...fixture.answers, fullName: 'Synthetic private name', spiritualityPreference: 'deep', spiritualSupport: 'christ', interests: ['spiritualHealth'], newsletterTopics: ['closer-to-god'], reportContact: { email: 'synthetic@example.test' } }), result);
    assert.ok(Number.isFinite(result.quizAge)); assert.ok(Number.isFinite(result.score));
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.equal(result.coverage.totalWeight, 98); assert.ok(result.coverage.percent >= 60);
    assert.ok(result.coverage.knownWeight <= result.coverage.totalWeight);
    assert.ok(Object.values(result.habitAreas).filter(Boolean).length >= 4);
    assert.ok(result.quizAge >= result.range.minAge && result.quizAge <= result.range.maxAge);
    assert.deepEqual(calculateAssessmentPreview(fixture.answers), result);
  }
  assert.notEqual(results[0].score, results[1].score);
  const base = candidateFixtures[0].answers;
  const noDiet = { ...base, fruitVegetableServings: 'unknown', wholeGrainServings: 'unknown', nutSeedServings: 'unknown', redMeatFrequency: 'unknown' };
  const fourAreas = calculateCandidateAssessment(noDiet);
  assert.equal(fourAreas.habitAreas.diet, false); assert.equal(fourAreas.status, 'complete');
  const threeAreas = calculateCandidateAssessment({ ...noDiet, exercise: 'unknown' });
  assert.ok(threeAreas.coverage.percent >= 60); assert.equal(threeAreas.status, 'incomplete');
  assert.equal(Number.isFinite(threeAreas.quizAge), false);
  const lowCoverage = calculateCandidateAssessment({ age: '50', fruitVegetableServings: '5+', wholeGrainServings: '3+', nutSeedServings: '5+', redMeatFrequency: 'never', exercise: '5+', sleepDuration: '7-9', tobaccoHistory: 'never', alcoholServings: 'none' });
  assert.equal(Object.values(lowCoverage.habitAreas).filter(Boolean).length, 5);
  assert.ok(lowCoverage.coverage.percent < 60); assert.equal(lowCoverage.status, 'incomplete');
  assert.equal(Number.isFinite(lowCoverage.quizAge), false);
});
