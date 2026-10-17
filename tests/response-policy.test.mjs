import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../components/educational-age/content.js';
import { questionResponseIssue, assessmentResponseIssues } from '../components/educational-age/response-policy.js';
import { calculateIllustrativeAge } from '../components/educational-age/scoring.js';

const question = id => questions.find(entry => entry.id === id);
const issue = (id, value, extra = {}, language = 'en') => questionResponseIssue(question(id), { [id]: value, ...extra }, language);
function completeAnswers() {
  return {
    ...Object.fromEntries(questions.filter(entry => entry.type === 'radio').map(entry => [entry.id, entry.options[0].id])),
    age: '42', height: '66', weight: '140', interests: ['fitnessExercise'],
    waistMeasurement: { value: '32', unit: 'in' }, bloodPressureReading: { readingStatus: 'measured', history: 'normal', systolic: '120', diastolic: '80' },
    bloodGlucoseReading: { readingStatus: 'measured', history: 'normal', value: '100', unit: 'mgDl', timing: 'unsure' }
  };
}

test('every assessment item requires a response; no blank supplemental bypass remains', () => {
  const missing = assessmentResponseIssues(questions, {});
  assert.deepEqual(missing.map(entry => entry.id), questions.map(entry => entry.id));
  assert.ok(missing.every(entry => typeof entry.message === 'string' && entry.message.length > 10));
  const answers = completeAnswers();
  assert.deepEqual(assessmentResponseIssues(questions, answers), []);
  for (const entry of questions) for (const blank of [undefined, '', ' ', null]) {
    assert.ok(questionResponseIssue(entry, { ...answers, [entry.id]: blank }), `${entry.id}: ${String(blank)}`);
  }
});

test('explicit declines satisfy every item without adding required email or consent', () => {
  for (const response of ['preferNot', 'skip']) {
    const answers = Object.fromEntries(questions.map(entry => [entry.id, response]));
    assert.deepEqual(assessmentResponseIssues(questions, answers), []);
    assert.equal(calculateIllustrativeAge(answers).status, 'incomplete', 'declines never manufacture a numeric estimate');
  }
  const answers = { ...completeAnswers(), fullName: 'preferNot', reportContact: 'preferNot', resultConsent: false, listConsent: false, email: '' };
  assert.deepEqual(assessmentResponseIssues(questions, answers), []);
});

test('number entries use existing age bounds and normalized measurement units', () => {
  for (const value of ['18', 100]) assert.equal(issue('age', value), null);
  for (const value of ['17', '101', '18.5', '1e2', NaN, Infinity, [], {}, true]) assert.ok(issue('age', value));
  assert.equal(issue('height', '167.64', { heightUnit: 'cm' }), null);
  assert.equal(issue('weight', '36.2873896', { weightUnit: 'kg' }), null);
  assert.equal(issue('height', undefined, { heightUnit: 'ft-in', heightFeet: '5', heightInches: '6' }), null);
  for (const extra of [{ heightUnit: 'cm' }, { heightUnit: 'unsupported' }, { heightUnit: 'ft-in', heightFeet: '5' }, { heightUnit: 'ft-in', heightFeet: '5', heightInches: '12' }]) assert.ok(issue('height', '66', extra));
  for (const value of ['unknown', 'preferNot', 'skip']) {
    assert.equal(issue('age', value), null);
    assert.equal(issue('height', value, { heightUnit: 'ft-in', heightFeet: 'bad', heightInches: 'bad' }), null);
    assert.equal(issue('weight', value), null);
  }
});

test('radio and multi answers must use exact listed choices or an explicit response sentinel', () => {
  for (const entry of questions.filter(entry => entry.type === 'radio')) {
    for (const option of entry.options) assert.equal(questionResponseIssue(entry, { [entry.id]: option.id }), null);
    for (const value of ['unknown', 'preferNot']) assert.equal(questionResponseIssue(entry, { [entry.id]: value }), null);
    for (const value of ['unlisted', [], {}, true, 1]) assert.ok(questionResponseIssue(entry, { [entry.id]: value }));
  }
  for (const value of [['fitnessExercise'], ['fitnessExercise', 'healthyCooking'], 'none', 'unknown', 'preferNot']) assert.equal(issue('interests', value), null);
  for (const value of [[], ['unlisted'], ['fitnessExercise', 'unlisted'], ['fitnessExercise', 'fitnessExercise'], ['none'], ['unknown'], {}, true, 1]) assert.ok(issue('interests', value));
});

test('reading groups require complete fields or explicit unknown/decline, with entry checks only', () => {
  for (const id of ['waistMeasurement', 'bloodPressureReading', 'bloodGlucoseReading']) {
    for (const value of ['unknown', 'preferNot']) assert.equal(issue(id, value), null);
    for (const value of [{}, [], { value: '' }, 1, false]) assert.ok(issue(id, value));
  }
  assert.ok(issue('waistMeasurement', { value: '32' }));
  assert.ok(issue('waistMeasurement', { value: '-5', unit: 'in' }));
  assert.ok(issue('waistMeasurement', { value: '32', unit: 'm' }));
  assert.ok(issue('bloodPressureReading', { systolic: '120' }));
  assert.ok(issue('bloodPressureReading', { systolic: '120', diastolic: '0' }));
  assert.ok(issue('bloodGlucoseReading', { value: '100', unit: 'mgDl' }));
  assert.ok(issue('bloodGlucoseReading', { value: '1e99', unit: 'mgDl', timing: 'fasting' }));
  assert.equal(issue('bloodGlucoseReading', { readingStatus: 'measured', history: 'normal', value: '100', unit: 'mgDl', timing: 'unsure' }), null);
  assert.equal(issue('bloodPressureReading', { readingStatus: 'measured', history: 'normal', systolic: '99999.123456789', diastolic: '99999.123456789' }), null, 'no clinical upper threshold is invented');
});

test('consolidated reading modes require status/history and require raw fields only when measured', () => {
  for (const id of ['bloodPressureReading', 'bloodGlucoseReading']) {
    const existing = question(id);
    const modeQuestion = { ...existing, fields: [
      { id: 'readingStatus', type: 'select', options: [{ id: 'measured' }, { id: 'notMeasured' }] },
      { id: 'history', type: 'select', options: ['diagnosed', 'borderline', 'normal', 'unknown', 'preferNot'].map(id => ({ id })) },
      ...existing.fields.filter(field => !['readingStatus', 'history'].includes(field.id)).map(field => ({ ...field, whenReading: 'measured' }))
    ] };
    const check = value => questionResponseIssue(modeQuestion, { [id]: value });
    const raw = id === 'bloodPressureReading' ? { systolic: '120', diastolic: '80' } : { value: '100', unit: 'mgDl', timing: 'unsure' };
    for (const history of ['diagnosed', 'borderline', 'normal', 'unknown', 'preferNot']) {
      assert.equal(check({ readingStatus: 'notMeasured', history }), null);
      assert.equal(check({ readingStatus: 'notMeasured', history, systolic: 'bad', diastolic: 0, value: '-1', unit: 'bad', timing: '' }), null, 'notMeasured ignores stale raw fields');
      assert.equal(check({ readingStatus: 'measured', history, ...raw }), null);
    }
    for (const readingStatus of [undefined, '', 'unknown', 'skip', 'bad']) assert.ok(check({ readingStatus, history: 'normal', ...raw }));
    for (const history of [undefined, '', 'bad', 'skip', [], true]) {
      assert.ok(check({ readingStatus: 'notMeasured', history }));
      assert.ok(check({ readingStatus: 'measured', history, ...raw }));
    }
    assert.ok(check({ readingStatus: 'measured', history: 'normal' }));
    for (const field of Object.keys(raw)) assert.ok(check({ readingStatus: 'measured', history: 'normal', ...raw, [field]: '' }), `${id}: ${field}`);
    assert.equal(check('unknown'), null);
    assert.equal(check('preferNot'), null);
  }
});

test('policy is bilingual and pure, and declining context never changes existing age math', () => {
  const answers = completeAnswers();
  const before = structuredClone(answers);
  const originalScore = calculateIllustrativeAge(answers);
  assert.deepEqual(assessmentResponseIssues(questions, answers), []);
  assert.deepEqual(answers, before);
  assert.match(issue('exercise', '', {}, 'es'), /Elige una respuesta/);
  assert.match(issue('bloodPressureReading', {}, {}, 'es'), /Completa/);
  const changed = { ...answers, ...Object.fromEntries(questions.filter(entry => entry.supplemental).map(entry => [entry.id, 'preferNot'])) };
  assert.deepEqual(assessmentResponseIssues(questions, changed), []);
  assert.deepEqual(calculateIllustrativeAge(changed), originalScore);
});
