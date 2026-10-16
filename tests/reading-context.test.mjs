import test from 'node:test';
import assert from 'node:assert/strict';
import { readingEntryIssues, hasReadingContext } from '../components/educational-age/reading-context.js';

const valid = () => ({
  waistMeasurement: { value: '32.5', unit: 'in' },
  bloodPressureReading: { systolic: '120', diastolic: '80' },
  bloodGlucoseReading: { value: '5.25', unit: 'mmolL', timing: 'unsure' }
});

test('absent, skipped, unknown and all-blank optional groups need no checking', () => {
  for (const answers of [undefined, null, {}, { age: '42' },
    { waistMeasurement: 'skip', bloodPressureReading: 'unknown', bloodGlucoseReading: undefined },
    { waistMeasurement: {}, bloodPressureReading: { systolic: '', diastolic: ' ' }, bloodGlucoseReading: { value: '', unit: null, timing: undefined } }
  ]) {
    assert.deepEqual(readingEntryIssues(answers), []);
    assert.equal(hasReadingContext(answers), false);
  }
});

test('readable values and all explicitly supported units/timings have no clinical interpretation', () => {
  const answers = valid();
  assert.equal(hasReadingContext(answers), true);
  assert.deepEqual(readingEntryIssues(answers), []);
  for (const unit of ['in', 'cm']) assert.deepEqual(readingEntryIssues({ waistMeasurement: { value: '32.1234567890123', unit } }), []);
  for (const unit of ['mgDl', 'mmolL']) for (const timing of ['fasting', 'postMeal', 'unsure']) {
    assert.deepEqual(readingEntryIssues({ bloodGlucoseReading: { value: 5.25, unit, timing } }), []);
  }
  assert.deepEqual(readingEntryIssues({ bloodPressureReading: { systolic: 80, diastolic: 120 } }), [], 'do not interpret or compare the two positive numbers');
});

test('positive finite plain decimals have no invented clinical upper bound or precision cap', () => {
  for (const value of ['0.0000000000000000000001', '99999999999999999999999999999999999999999999999999', '1.12345678901234567890123456789']) {
    const answers = { waistMeasurement: { value, unit: 'cm' }, bloodPressureReading: { systolic: value, diastolic: value }, bloodGlucoseReading: { value, unit: 'mgDl', timing: 'fasting' } };
    assert.deepEqual(readingEntryIssues(answers), []);
    assert.equal(answers.waistMeasurement.value, value);
  }
});

test('invalid numeric notation, nonpositive and non-finite entries are named without interpretation', () => {
  for (const value of ['1e99', '1e-9', '-5', -5, '0', 0, NaN, Infinity, 'NaN', 'Infinity', '0x10', '+5', '5,2', {}, [], false, '9'.repeat(400)]) {
    const answers = { waistMeasurement: { value, unit: 'in' }, bloodPressureReading: { systolic: value, diastolic: '80' }, bloodGlucoseReading: { value, unit: 'mgDl', timing: 'fasting' } };
    const issues = readingEntryIssues(answers);
    assert.deepEqual(issues.map(issue => issue.id), ['waistMeasurement', 'bloodPressureReading', 'bloodGlucoseReading'], String(value));
    assert.equal(hasReadingContext(answers), true);
    for (const issue of issues) assert.match(issue.message, /Entry needs checking; not clinically assessed\./);
    assert.match(issues[1].message, /systolic \(top\)/);
    assert.doesNotMatch(issues.map(issue => issue.message).join(' '), /danger|high|low|normal|diagnos|years|age adjustment/i);
  }
});

test('partial pairs and metadata-only entries count as context and identify missing fields', () => {
  assert.match(readingEntryIssues({ bloodPressureReading: { systolic: '120' } })[0].message, /diastolic \(bottom\)/);
  assert.match(readingEntryIssues({ bloodPressureReading: { diastolic: '80' } })[0].message, /systolic \(top\)/);
  for (const [id, value] of [['waistMeasurement', { unit: 'cm' }], ['bloodGlucoseReading', { timing: 'unsure' }]]) {
    const answers = { [id]: value };
    assert.equal(hasReadingContext(answers), true);
    assert.equal(readingEntryIssues(answers)[0].id, id);
    assert.match(readingEntryIssues(answers)[0].message, /positive, finite number/);
  }
});

test('missing or unsupported units and glucose timing are checked explicitly', () => {
  for (const unit of [undefined, '', null, 'unknown', 'skip', 'mm', 'IN']) {
    const issue = readingEntryIssues({ waistMeasurement: { value: '32', unit } })[0];
    assert.match(issue.message, /choose inches or centimeters/);
  }
  for (const unit of [undefined, '', 'mg/dL', 'mmol/l', 'unknown']) assert.match(readingEntryIssues({ bloodGlucoseReading: { value: '100', unit, timing: 'fasting' } })[0].message, /choose mg\/dL or mmol\/L/);
  for (const timing of [undefined, '', null, 'unknown', 'skip', 'random']) assert.match(readingEntryIssues({ bloodGlucoseReading: { value: '100', unit: 'mgDl', timing } })[0].message, /measurement timing/);
  assert.deepEqual(readingEntryIssues({ bloodGlucoseReading: { value: '100', unit: 'mgDl', timing: 'unsure' } }), []);
});

test('issue messages are bilingual, deterministic, pure and safe for malformed groups', () => {
  const answers = Object.freeze({ waistMeasurement: Object.freeze({ value: '-5', unit: 'other' }), bloodPressureReading: Object.freeze({ systolic: '120' }), bloodGlucoseReading: Object.freeze({ value: '100', unit: 'mgDl' }) });
  const issues = readingEntryIssues(answers, 'es');
  assert.deepEqual(issues.map(issue => issue.id), ['waistMeasurement', 'bloodPressureReading', 'bloodGlucoseReading']);
  for (const issue of issues) assert.match(issue.message, /Revisa la entrada; no se ha evaluado clínicamente\./);
  assert.match(issues[0].message, /Medida de cintura.*pulgadas o centímetros/);
  assert.match(issues[1].message, /Presión arterial.*diastólico/);
  assert.match(issues[2].message, /Glucosa en sangre.*momento de la medición/);
  assert.deepEqual(readingEntryIssues(answers, 'es'), issues);
  assert.equal(answers.waistMeasurement.value, '-5');
  for (const value of [false, 0, NaN, 'unreadable', []]) {
    assert.equal(hasReadingContext({ waistMeasurement: value }), true);
    assert.match(readingEntryIssues({ waistMeasurement: value })[0].message, /clear and re-enter/);
  }
});
