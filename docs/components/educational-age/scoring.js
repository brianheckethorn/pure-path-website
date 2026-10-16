import { normalizeBaseMeasurements } from './measurements.js';
// Copied coefficients from the owner's public script.js, 2026-10-12.
// This is a custom illustrative heuristic, not a validated medical instrument.
export const weights = Object.freeze({ bmi: 5, nicotine: 10, exercise: 8, strength: 5, sedentary: 5, sleepDuration: 5, sleepQuality: 4, dietQuality: 8, sugaryDrinks: 3, vegetables: 4, water: 3, alcohol: 3, stress: 5, socialSupport: 4, bloodPressure: 6, bloodSugar: 6, cholesterol: 4, energy: 4, functionalFitness: 6 });
export const scoringMaps = Object.freeze({
  nicotine: { current: .05, former: .62, never: 1 },
  exercise: { rarely: .18, '1-2': .5, '3-4': .82, '5+': 1 },
  strength: { none: .15, '1': .45, '2-3': .82, '4+': 1 },
  sedentary: { '10+': .15, '7-9': .45, '4-6': .78, '0-3': 1 },
  sleepDuration: { lt5: .1, '5-6': .48, '7-8': 1, '9+': .72 },
  sleepQuality: { poor: .15, fair: .48, good: .8, excellent: 1 },
  dietQuality: { poor: .12, fair: .5, good: .8, excellent: 1 },
  sugaryDrinks: { '2+': .12, '1': .45, few: .78, none: 1 },
  vegetables: { '0-1': .18, '2-3': .55, '4-5': .86, '6+': 1 },
  water: { lt4: .2, '4-6': .58, '7-9': .88, '10+': 1 },
  alcohol: { heavy: .18, moderate: .5, light: .82, none: 1 },
  stress: { high: .18, moderate: .52, manageable: .82, low: 1 },
  socialSupport: { low: .2, some: .52, good: .82, excellent: 1 },
  bloodPressure: { diagnosed: .18, borderline: .56, normal: 1 },
  bloodSugar: { diagnosed: .12, borderline: .54, normal: 1 },
  cholesterol: { high: .28, borderline: .6, normal: 1 },
  energy: { low: .18, mixed: .54, good: .82, high: 1 },
  functionalFitness: { limited: .18, average: .55, good: .82, excellent: 1 }
});
export const inputBounds = Object.freeze({ age: { min: 18, max: 100, integer: true }, height: { min: 48, max: 84, integer: false }, weight: { min: 80, max: 500, integer: false } });
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export function numericValue(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && (!/^\d+(?:\.\d+)?$/.test(value.trim()))) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function validateAnswers(answers) {
  answers = normalizeBaseMeasurements(answers);
  const errors = [];
  for (const [id, bounds] of Object.entries(inputBounds)) {
    const value = numericValue(answers[id]);
    if (value === null) errors.push({ id, code: 'missingNumber' });
    else if (value < bounds.min || value > bounds.max || (bounds.integer && !Number.isInteger(value))) errors.push({ id, code: 'bounds' });
  }
  for (const [id, choices] of Object.entries(scoringMaps)) {
    if (typeof answers[id] !== 'string' || !own(choices, answers[id])) errors.push({ id, code: 'missingChoice' });
  }
  // Sex is retained from the original question set, but has no source coefficient.
  // It is optional; no inferred sex or extra age coefficient is introduced.
  if (answers.sex !== undefined && !['female', 'male', 'unknown', 'skip'].includes(answers.sex)) errors.push({ id: 'sex', code: 'missingChoice' });
  return errors;
}

export function bmiFactor(bmi) {
  if (!Number.isFinite(bmi) || bmi <= 0) throw new Error('Invalid BMI input.');
  // Unit conversion can put the same measurement one floating-point step on
  // either side of an existing boundary. Snap machine noise only, preserving
  // the original bands and coefficients for meaningfully different values.
  for (const boundary of [16, 17, 18.5, 25, 30, 35]) {
    if (Math.abs(bmi - boundary) <= 8 * Number.EPSILON * boundary) { bmi = boundary; break; }
  }
  // Same source factors, with continuous boundaries at 25, 30, and 35.
  if (bmi >= 18.5 && bmi < 25) return 1;
  if ((bmi >= 17 && bmi < 18.5) || (bmi >= 25 && bmi < 30)) return .68;
  if ((bmi >= 16 && bmi < 17) || (bmi >= 30 && bmi < 35)) return .34;
  return .12;
}

export function calculateIllustrativeAge(answers) {
  answers = normalizeBaseMeasurements(answers);
  const errors = validateAnswers(answers);
  if (errors.length) return { status: 'incomplete', errors };
  const actualAge = numericValue(answers.age);
  const height = numericValue(answers.height);
  const weight = numericValue(answers.weight);
  const bmi = (weight / (height * height)) * 703;
  const factorScores = [{ key: 'bmi', factor: bmiFactor(bmi) }, ...Object.entries(scoringMaps).map(([key, map]) => ({ key, factor: map[answers[key]] }))];
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const weightedTotal = factorScores.reduce((sum, entry) => sum + entry.factor * weights[entry.key], 0);
  const score = Math.round(weightedTotal / totalWeight * 100);
  const adjustment = Math.min(15, Math.max(-12, ((70 - score) / 30) * 10));
  // Remove the source's 18/95 output-age caps: no reversed comparison at age 96+.
  const quizAge = Math.round(actualAge + adjustment);
  return { status: 'complete', actualAge, quizAge, difference: quizAge - actualAge, bmi, score, adjustment, weightedTotal, totalWeight, factorScores };
}
