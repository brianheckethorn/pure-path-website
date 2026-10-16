import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../components/educational-age/content.js';
import { candidateWeights, candidateScoringMaps, candidateDomainLabels, calculateCandidateFromDomainScores, calculateCandidateAssessment } from '../components/educational-age/candidate-scoring.js';

const uniform = score => Object.fromEntries(Object.keys(candidateWeights).map(id => [id, score]));
const bestAnswers = () => ({ age: '50', height: '66', weight: '140', tobaccoHistory: 'never', exercise: '5+', strength: '2-3', sedentary: '0-3', sleepDuration: '7-9', sleepQuality: 'excellent', fruitVegetableServings: '5+', wholeGrainServings: '3+', nutSeedServings: '5+', redMeatFrequency: 'never', sugaryDrinks: 'none', water: '7-9', alcoholServings: 'none', stress: 'low', socialSupport: 'excellent', bloodPressureReading: { readingStatus: 'notMeasured', history: 'normal' }, bloodGlucoseReading: { readingStatus: 'notMeasured', history: 'normal' }, cholesterol: 'normal', energy: 'high', functionalFitness: 'excellent' });
const domain = (result, id) => result.domains.find(entry => entry.id === id);

test('fixed 98 budget and one 12-point detailed diet budget; all domains have bilingual labels', () => {
  assert.equal(Object.values(candidateWeights).reduce((a, b) => a + b, 0), 98);
  assert.equal(['fruitVegetableServings', 'wholeGrainServings', 'nutSeedServings', 'redMeatFrequency'].reduce((sum, id) => sum + candidateWeights[id], 0), 12);
  for (const id of ['dietQuality', 'vegetables', 'nicotine', 'alcohol', 'bloodPressure', 'bloodSugar', 'waistMeasurement', 'breakfastFrequency', 'snackingFrequency', 'fullName', 'reportContact', 'sex', 'spiritualityPreference', 'interests']) assert.equal(id in candidateWeights, false);
  for (const id of Object.keys(candidateWeights)) { assert.ok(candidateDomainLabels[id].en); assert.ok(candidateDomainLabels[id].es); }
  for (const [id, map] of Object.entries(candidateScoringMaps)) {
    if (['bloodPressureReading', 'bloodGlucoseReading'].includes(id)) continue;
    const actualOptions = questions.find(question => question.id === id).options.map(option => option.id);
    assert.deepEqual(Object.keys(map).sort(), actualOptions.sort(), id);
  }
});

test('goldens: all70=actualage, all100=age40, all0=age65 at actualage50', () => {
  for (const [points, expectedScore, expectedAge, adjustment] of [[70, 70, 50, 0], [100, 100, 40, -10], [0, 0, 65, 15]]) {
    const result = calculateCandidateFromDomainScores(uniform(points), 50);
    assert.equal(result.status, 'complete'); assert.equal(result.score, expectedScore);
    assert.equal(result.quizAge, expectedAge); assert.equal(result.adjustment, adjustment);
    assert.equal(result.coverage.knownWeight, 98); assert.equal(result.coverage.percent, 100);
    assert.equal(result.habitAreaCount, 5); assert.deepEqual(result.unassessed, []);
    assert.equal(result.range.minAge, expectedAge); assert.equal(result.range.maxAge, expectedAge);
  }
});

test('three unknown lab/history domains retain neutral anchor and widen the mathematical range', () => {
  const scores = uniform(70);
  for (const id of ['bloodPressureReading', 'bloodGlucoseReading', 'cholesterol']) delete scores[id];
  const result = calculateCandidateFromDomainScores(scores, 50);
  assert.equal(result.status, 'complete'); assert.equal(result.score, 70); assert.equal(result.quizAge, 50);
  assert.equal(result.coverage.knownWeight, 82); assert.equal(result.coverage.totalWeight, 98); assert.equal(result.coverage.percent, 84);
  assert.deepEqual(result.range, { minAge: 48, maxAge: 54, minScore: 59, maxScore: 75 });
  assert.deepEqual(result.unassessed.map(entry => entry.id), ['bloodPressureReading', 'bloodGlucoseReading', 'cholesterol']);
  assert.ok(result.unassessed.every(entry => entry.reason === 'missingOrUnknown'));
});

test('all unknown, bad age, low coverage and fewer than four distinct habit areas withhold estimates', () => {
  for (const scores of [{}, uniform(null), uniform('70'), uniform(NaN), uniform(Infinity), uniform(-1), uniform(101)]) {
    const result = calculateCandidateFromDomainScores(scores, 50);
    assert.equal(result.status, 'incomplete'); assert.equal('quizAge' in result, false); assert.equal('score' in result, false); assert.equal('range' in result, false);
  }
  for (const age of ['', 'unknown', 'preferNot', 17, 101, 50.5, NaN, Infinity, null, {}, []]) assert.equal(calculateCandidateFromDomainScores(uniform(70), age).status, 'incomplete');
  assert.equal(calculateCandidateFromDomainScores(uniform(70)).status, 'incomplete', 'an absent actual age is never filled in');
  const threeAreas = { ...uniform(70), exercise: null, sleepDuration: null };
  assert.ok(calculateCandidateFromDomainScores(threeAreas, 50).coverage.percent > 60);
  assert.equal(calculateCandidateFromDomainScores(threeAreas, 50).status, 'incomplete');
  const sparse = { fruitVegetableServings: 70, wholeGrainServings: 70, nutSeedServings: 70, exercise: 70, sleepDuration: 70, tobaccoHistory: 70, alcoholServings: 70 };
  assert.equal(calculateCandidateFromDomainScores(sparse, 50).habitAreaCount, 5);
  assert.equal(calculateCandidateFromDomainScores(sparse, 50).status, 'incomplete');
});

test('coverage gate uses exact weight; habit gate counts diet3of4, exercise alone and sleep duration alone', () => {
  const fourAreas = { ...uniform(70), alcoholServings: null };
  assert.equal(calculateCandidateFromDomainScores(fourAreas, 50).status, 'complete');
  assert.equal(calculateCandidateFromDomainScores({ ...uniform(70), fruitVegetableServings: null }, 50).habitAreas.diet, true);
  assert.equal(calculateCandidateFromDomainScores({ ...uniform(70), fruitVegetableServings: null, nutSeedServings: null }, 50).habitAreas.diet, false);
  assert.equal(calculateCandidateFromDomainScores({ ...uniform(70), exercise: null }, 50).habitAreas.activity, false);
  assert.equal(calculateCandidateFromDomainScores({ ...uniform(70), sleepDuration: null }, 50).habitAreas.sleep, false);
  const primary = ['tobaccoHistory', 'exercise', 'sleepDuration', 'alcoholServings', 'fruitVegetableServings', 'wholeGrainServings', 'nutSeedServings'];
  const at59 = Object.fromEntries([...primary, 'bmi', 'strength', 'sedentary', 'sleepQuality', 'stress'].map(id => [id, 70]));
  const at58 = { ...at59, stress: null, socialSupport: 70 };
  assert.equal(calculateCandidateFromDomainScores(at59, 50).coverage.knownWeight, 59);
  assert.equal(calculateCandidateFromDomainScores(at59, 50).status, 'complete');
  assert.equal(calculateCandidateFromDomainScores(at58, 50).coverage.knownWeight, 58);
  assert.equal(calculateCandidateFromDomainScores(at58, 50).habitAreaCount, 5);
  assert.equal(calculateCandidateFromDomainScores(at58, 50).status, 'incomplete');
});

test('known numeric0 is assessed; unknown inputs never become zero or gain missing-weight reweighting', () => {
  const result = calculateCandidateFromDomainScores({ ...uniform(70), exercise: 0, cholesterol: null }, 50);
  assert.equal(domain(result, 'exercise').score, 0); assert.equal(domain(result, 'exercise').assessed, true);
  assert.equal(domain(result, 'cholesterol').score, null); assert.equal(domain(result, 'cholesterol').assessed, false);
  assert.equal(result.score, Math.round(70 + 8 * (0 - 70) / 98));
});

test('active detailed mappings, BMI units and current sleep/alcohol/red-meat choices work', () => {
  const answers = bestAnswers(); const before = structuredClone(answers);
  const result = calculateCandidateAssessment(answers);
  assert.equal(result.status, 'complete'); assert.equal(result.score, 99); assert.equal(result.quizAge, 40);
  assert.equal(result.coverage.knownWeight, 95); assert.equal(result.coverage.percent, 97);
  assert.equal(result.unassessed[0].id, 'water'); assert.equal(result.unassessed[0].reason, 'waterNeedsContext');
  assert.equal(result.bmi > 0, true); assert.deepEqual(answers, before);
  const metric = calculateCandidateAssessment({ ...answers, height: '167.64', heightUnit: 'cm', weight: '63.5029318', weightUnit: 'kg' });
  assert.equal(metric.quizAge, result.quizAge); assert.equal(metric.score, result.score); assert.equal(domain(metric, 'bmi').score, domain(result, 'bmi').score);
  for (const alcoholServings of ['none', '1-7', '8-14', '15+']) assert.equal(domain(calculateCandidateAssessment({ ...answers, alcoholServings }), 'alcoholServings').assessed, true);
  for (const redMeatFrequency of ['never', 'lessWeekly', '1-2Weekly', '3plusWeekly']) assert.equal(domain(calculateCandidateAssessment({ ...answers, redMeatFrequency }), 'redMeatFrequency').assessed, true);
});

test('raw BP/glucose readings cannot diagnose or alter history scores, including random timing', () => {
  const answers = bestAnswers(); const baseline = calculateCandidateAssessment(answers);
  for (const raw of [{ systolic: '300', diastolic: '200', value: '800', unit: 'mgDl', timing: 'postMeal' }, { systolic: '1', diastolic: '1', value: '0.1', unit: 'mmolL', timing: 'unsure' }, { systolic: 'bad', diastolic: NaN, value: Infinity, unit: 'bad', timing: '' }]) {
    const changed = calculateCandidateAssessment({ ...answers, bloodPressureReading: { ...raw, history: 'normal', readingStatus: 'measured' }, bloodGlucoseReading: { ...raw, history: 'normal', readingStatus: 'measured' } });
    assert.equal(changed.score, baseline.score); assert.equal(changed.quizAge, baseline.quizAge);
    const unknown = calculateCandidateAssessment({ ...answers, bloodPressureReading: { ...raw, history: 'unknown' }, bloodGlucoseReading: { ...raw, history: 'unknown' } });
    assert.equal(domain(unknown, 'bloodPressureReading').assessed, false); assert.equal(domain(unknown, 'bloodGlucoseReading').assessed, false);
  }
  const legacy = calculateCandidateAssessment({ ...answers, bloodPressureReading: 'unknown', bloodGlucoseReading: 'unknown', bloodPressure: 'normal', bloodSugar: 'normal' });
  assert.equal(domain(legacy, 'bloodPressureReading').assessed, false); assert.equal(domain(legacy, 'bloodGlucoseReading').assessed, false);
});

test('care exclusions, long sleep, ages18–19 and invalid measurements stay unassessed', () => {
  const answers = bestAnswers();
  for (const nutSeedServings of ['avoidsForCare', 'unknown', 'preferNot', 'skip', 'other']) assert.equal(domain(calculateCandidateAssessment({ ...answers, nutSeedServings }), 'nutSeedServings').assessed, false);
  assert.equal(domain(calculateCandidateAssessment({ ...answers, nutSeedServings: 'avoidsForCare' }), 'nutSeedServings').reason, 'medicallyUnsuitable');
  assert.equal(domain(calculateCandidateAssessment({ ...answers, sleepDuration: 'gt9' }), 'sleepDuration').reason, 'individualSleepNeeds');
  for (const age of [18, 19]) assert.equal(domain(calculateCandidateAssessment({ ...answers, age }), 'bmi').reason, 'adultBmiNotApplicable');
  for (const measurement of [{ height: 'unknown' }, { height: '66', heightUnit: 'bad' }, { weight: '0' }, { height: '99' }]) assert.equal(domain(calculateCandidateAssessment({ ...answers, ...measurement }), 'bmi').assessed, false);
  const excluded = calculateCandidateAssessment({ ...answers, medicallyUnsuitableDomains: ['exercise', 'strength', 'bmi', 'not-a-domain'] });
  for (const id of ['exercise', 'strength', 'bmi']) assert.equal(domain(excluded, id).reason, 'medicallyUnsuitable');
  assert.equal(excluded.domains.length, Object.keys(candidateWeights).length);
});

test('faith, support preferences, identifiers, waist and removed duplicate questions have zero effect', () => {
  const answers = bestAnswers(); const baseline = calculateCandidateAssessment(answers);
  const changed = calculateCandidateAssessment({ ...answers, spiritualityPreference: 'deep', spiritualSupport: 'christ', interests: ['spiritualHealth'], fullName: 'Private name', reportContact: { email: 'private@example.test' }, waistMeasurement: { value: '999', unit: 'cm' }, breakfastFrequency: 'daily', snackingFrequency: 'severalDaily', exerciseTwentyThirty: 'rarely', sleepSevenEightFrequency: '0-2', weightDescription: 'severelyOverweight', dietQuality: 'poor', vegetables: '0-1', nicotine: 'current', alcohol: 'heavy', bloodPressure: 'diagnosed', bloodSugar: 'diagnosed' });
  assert.deepEqual(changed, baseline);
});

test('monotonic numeric contributions, bounded age conversion and nested missing-data ranges', () => {
  for (const id of Object.keys(candidateWeights)) {
    let lastAge = Infinity;
    for (const score of [0, 25, 50, 70, 100]) {
      const result = calculateCandidateFromDomainScores({ ...uniform(70), [id]: score }, 50);
      assert.ok(result.quizAge <= lastAge, id); lastAge = result.quizAge;
      assert.ok(result.range.minAge <= result.quizAge && result.range.maxAge >= result.quizAge);
    }
  }
  for (const age of [18, 50, 100]) for (const score of [0, 70, 100]) {
    const result = calculateCandidateFromDomainScores(uniform(score), age);
    assert.ok(result.quizAge >= age - 12 && result.quizAge <= age + 15);
  }
  const full = calculateCandidateFromDomainScores(uniform(70), 50);
  const missingOne = calculateCandidateFromDomainScores({ ...uniform(70), cholesterol: null }, 50);
  const missingThree = calculateCandidateFromDomainScores({ ...uniform(70), cholesterol: null, bloodPressureReading: null, bloodGlucoseReading: null }, 50);
  assert.ok(missingOne.range.minAge <= full.range.minAge && missingOne.range.maxAge >= full.range.maxAge);
  assert.ok(missingThree.range.minAge <= missingOne.range.minAge && missingThree.range.maxAge >= missingOne.range.maxAge);
});
