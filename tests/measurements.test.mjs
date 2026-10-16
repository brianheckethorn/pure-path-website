import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBaseMeasurements, measurementDisplay, unitBounds } from '../components/educational-age/measurements.js';
import { calculateIllustrativeAge, scoringMaps } from '../components/educational-age/scoring.js';

const nearly = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} should equal ${expected}`);
const scoredAnswers = () => ({ age: '42', height: '66', weight: '140', ...Object.fromEntries(Object.entries(scoringMaps).map(([key, choices]) => [key, Object.entries(choices).sort((a, b) => b[1] - a[1])[0][0]])) });

test('imperial defaults, metric, and feet/inches become a fresh canonical scoring copy', () => {
  const source = Object.freeze({ height: '66', weight: '140', age: '42', exercise: '3-4' });
  const result = normalizeBaseMeasurements(source);
  assert.notEqual(result, source);
  assert.deepEqual(result, { height: 66, weight: 140, age: '42', exercise: '3-4', heightUnit: 'in', weightUnit: 'lb' });
  assert.equal(source.height, '66');
  assert.equal(source.heightUnit, undefined);
  const metric = normalizeBaseMeasurements({ height: '167.64', heightUnit: 'cm', weight: '63.5029318', weightUnit: 'kg' });
  nearly(metric.height, 66);
  nearly(metric.weight, 140);
  assert.equal(metric.heightUnit, 'in');
  assert.equal(metric.weightUnit, 'lb');
  assert.deepEqual(normalizeBaseMeasurements(metric), metric);
  const split = normalizeBaseMeasurements({ heightUnit: 'ft-in', heightFeet: '5', heightInches: '6.5', weight: 140 });
  assert.equal(split.height, 66.5);
  assert.deepEqual(normalizeBaseMeasurements(split), split);
});

test('equivalent measurements produce the same existing score, factors, and age', () => {
  const imperial = calculateIllustrativeAge(normalizeBaseMeasurements(scoredAnswers()));
  for (const measurements of [
    { height: '167.64', heightUnit: 'cm', weight: '63.5029318', weightUnit: 'kg' },
    { height: '', heightUnit: 'ft-in', heightFeet: '5', heightInches: '6', weight: '140', weightUnit: 'lb' }
  ]) {
    const converted = calculateIllustrativeAge(normalizeBaseMeasurements({ ...scoredAnswers(), ...measurements }));
    assert.equal(converted.status, 'complete');
    assert.equal(converted.score, imperial.score);
    assert.equal(converted.quizAge, imperial.quizAge);
    assert.equal(converted.weightedTotal, imperial.weightedTotal);
    assert.deepEqual(converted.factorScores, imperial.factorScores);
    nearly(converted.bmi, imperial.bmi);
  }
});

test('explicit unsupported units never fall back to guessed imperial units', () => {
  for (const unit of ['', null, 'm', 'meters', 'lbs', 'KG', 'stone', {}, []]) {
    assert.equal(normalizeBaseMeasurements({ height: '66', heightUnit: unit, weight: '140' }).height, null);
    assert.equal(normalizeBaseMeasurements({ height: '66', weight: '140', weightUnit: unit }).weight, null);
    assert.equal(unitBounds('height', unit), null);
    assert.equal(unitBounds('weight', unit), null);
  }
});

test('empty, unknown, non-finite and malformed numeric answers withhold the existing estimate', () => {
  for (const id of ['height', 'weight']) {
    for (const value of [undefined, '', ' ', null, NaN, Infinity, -Infinity, 'NaN', 'Infinity', '1e2', 'unknown', 'skip', {}, [], true]) {
      const normalized = normalizeBaseMeasurements({ ...scoredAnswers(), [id]: value });
      assert.equal(normalized[id], null, `${id}: ${String(value)}`);
      const result = calculateIllustrativeAge(normalized);
      assert.equal(result.status, 'incomplete');
      assert.equal('quizAge' in result, false);
    }
  }
  assert.equal(normalizeBaseMeasurements({ height: Number.MAX_VALUE, weight: Number.MAX_VALUE, weightUnit: 'kg' }).weight, null);
});

test('feet/inches requires both fields, whole nonnegative feet, and inches below twelve', () => {
  for (const [feet, inches] of [
    ['', '6'], ['5', ''], [undefined, '6'], ['5', undefined], [null, '6'], ['5', null],
    [-1, 6], ['5.5', '6'], ['5', -1], ['5', 12], ['5', '12.1'], [NaN, 6], [5, NaN], [Infinity, 6], [5, Infinity]
  ]) assert.equal(normalizeBaseMeasurements({ heightUnit: 'ft-in', heightFeet: feet, heightInches: inches }).height, null, `${String(feet)} ft ${String(inches)} in`);
  assert.equal(normalizeBaseMeasurements({ heightUnit: 'ft-in', heightFeet: 0, heightInches: 0 }).height, 0);
  assert.equal(normalizeBaseMeasurements({ height: 'skip', heightUnit: 'ft-in', heightFeet: 5, heightInches: 6 }).height, null);
  assert.equal(normalizeBaseMeasurements({ height: 'unknown', heightUnit: 'ft-in', heightFeet: 5, heightInches: 6 }).height, null);
  assert.equal(normalizeBaseMeasurements({ heightUnit: 'ft-in', heightFeet: 5, heightInches: '11.999' }).height, 71.999);
});

test('unit bounds are exact conversions of the existing ranges, with no new clinical thresholds', () => {
  assert.deepEqual(unitBounds('height'), { min: 48, max: 84, integer: false });
  assert.deepEqual(unitBounds('height', 'cm'), { min: 121.92, max: 213.36, integer: false });
  assert.deepEqual(unitBounds('height', 'ft-in'), { min: 4, max: 7, integer: true });
  assert.deepEqual(unitBounds('weight'), { min: 80, max: 500, integer: false });
  assert.deepEqual(unitBounds('weight', 'kg'), { min: 36.2873896, max: 226.796185, integer: false });
  assert.equal(unitBounds('age', 'years'), null);
  const bounds = unitBounds('height', 'in');
  bounds.min = 1;
  assert.equal(unitBounds('height', 'in').min, 48);
  for (const [height, weight] of [[121.92, 36.2873896], [213.36, 226.796185]]) {
    const result = calculateIllustrativeAge(normalizeBaseMeasurements({ ...scoredAnswers(), height, heightUnit: 'cm', weight, weightUnit: 'kg' }));
    assert.equal(result.status, 'complete');
  }
  assert.equal(calculateIllustrativeAge(normalizeBaseMeasurements({ ...scoredAnswers(), heightUnit: 'ft-in', heightFeet: 7, heightInches: 1 })).status, 'incomplete');
});

test('report displays the entered units in English and Spanish and distinguishes unanswered/invalid', () => {
  assert.equal(measurementDisplay('height', { height: '66' }, 'en'), '66 in');
  assert.equal(measurementDisplay('height', { height: '66' }, 'es'), '66 pulgadas');
  assert.equal(measurementDisplay('weight', { weight: 140 }, 'en'), '140 lb');
  assert.equal(measurementDisplay('weight', { weight: 140 }, 'es'), '140 libras');
  assert.equal(measurementDisplay('height', { height: '167.64', heightUnit: 'cm' }, 'en'), '167.64 cm');
  assert.equal(measurementDisplay('height', { height: '167.64', heightUnit: 'cm' }, 'es'), '167,64 cm');
  assert.equal(measurementDisplay('weight', { weight: '63.5', weightUnit: 'kg' }, 'en'), '63.5 kg');
  const split = { heightUnit: 'ft-in', heightFeet: '5', heightInches: '6.5' };
  assert.equal(measurementDisplay('height', split, 'en'), '5 ft 6.5 in');
  assert.equal(measurementDisplay('height', split, 'es'), '5 pies 6,5 pulgadas');
  assert.equal(measurementDisplay('height', {}, 'en'), 'Not answered');
  assert.equal(measurementDisplay('height', { heightUnit: 'ft-in' }, 'es'), 'Sin respuesta');
  assert.equal(measurementDisplay('weight', { weight: 'unknown' }, 'es'), 'No sé');
  assert.equal(measurementDisplay('height', { height: 'skip', ...split }, 'en'), 'Skipped');
  assert.equal(measurementDisplay('height', { height: 66, heightUnit: 'm' }), 'Invalid measurement');
  assert.equal(measurementDisplay('height', { heightUnit: 'ft-in', heightFeet: 5, heightInches: 12 }, 'es'), 'Medida no válida');
  assert.equal(measurementDisplay('age', { age: 42 }), '');
});
