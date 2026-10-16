// Unit conversion only. The existing scoring code retains its original bounds
// and coefficients; choosing a different unit does not introduce a new factor.
const CM_PER_INCH = 2.54;
// Exact international conversion, expressed as a decimal integer ratio.
const KG_RATIO_NUMERATOR = 45359237;
const KG_RATIO_DENOMINATOR = 100000000;
const canonicalBounds = Object.freeze({
  height: Object.freeze({ min: 48, max: 84, integer: false }),
  weight: Object.freeze({ min: 80, max: 500, integer: false })
});

const copy = {
  en: { unanswered: 'Not answered', unknown: 'Not sure', skip: 'Skipped', invalid: 'Invalid measurement' },
  es: { unanswered: 'Sin respuesta', unknown: 'No sé', skip: 'Omitida', invalid: 'Medida no válida' }
};

function number(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && !/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function unitFor(questionId, answers) {
  const supplied = answers[`${questionId}Unit`];
  return supplied === undefined ? (questionId === 'height' ? 'in' : 'lb') : supplied;
}

function canonicalHeight(answers) {
  if (answers.height === 'unknown' || answers.height === 'skip') return null;
  const unit = unitFor('height', answers);
  if (unit === 'ft-in') {
    const feet = number(answers.heightFeet);
    const inches = number(answers.heightInches);
    if (feet === null || !Number.isInteger(feet) || feet < 0 || inches === null || inches < 0 || inches >= 12) return null;
    const converted = feet * 12 + inches;
    return Number.isFinite(converted) ? converted : null;
  }
  const height = number(answers.height);
  if (height === null) return null;
  if (unit === 'in') return height;
  if (unit === 'cm') return height / CM_PER_INCH;
  return null;
}

function canonicalWeight(answers) {
  const weight = number(answers.weight);
  if (weight === null) return null;
  const unit = unitFor('weight', answers);
  if (unit === 'lb') return weight;
  if (unit === 'kg') {
    // Preserve the exact original endpoints rather than letting binary
    // conversion noise turn 36.2873896 kg into 79.99999999999999 lb. Only exact
    // equality with the converted bound is handled; no tolerance is added.
    const bounds = unitBounds('weight', 'kg');
    if (weight === bounds.min) return canonicalBounds.weight.min;
    if (weight === bounds.max) return canonicalBounds.weight.max;
    const converted = weight * KG_RATIO_DENOMINATOR / KG_RATIO_NUMERATOR;
    return Number.isFinite(converted) ? converted : null;
  }
  return null;
}

/** Return a fresh, idempotent scoring copy in inches and pounds.
 * Invalid/missing measurements become null, so the existing validator withholds
 * the estimate. Raw answers remain available for editing and report display.
 */
export function normalizeBaseMeasurements(answers = {}) {
  return {
    ...answers,
    height: canonicalHeight(answers),
    weight: canonicalWeight(answers),
    heightUnit: 'in',
    weightUnit: 'lb'
  };
}

/** Bounds expressed in the selected unit, preserving the original input range.
 * For ft-in these bound the feet field; inches must be in [0, 12), and the
 * combined height still goes through the original 48–84 inch validation.
 * Unknown questions or unsupported units have no usable bounds.
 */
export function unitBounds(questionId, unit) {
  if (questionId !== 'height' && questionId !== 'weight') return null;
  const selected = unit === undefined ? (questionId === 'height' ? 'in' : 'lb') : unit;
  const bounds = canonicalBounds[questionId];
  if ((questionId === 'height' && selected === 'in') || (questionId === 'weight' && selected === 'lb')) return { ...bounds };
  if (questionId === 'height' && selected === 'cm') return { min: bounds.min * CM_PER_INCH, max: bounds.max * CM_PER_INCH, integer: false };
  if (questionId === 'height' && selected === 'ft-in') return { min: bounds.min / 12, max: bounds.max / 12, integer: true };
  if (questionId === 'weight' && selected === 'kg') return { min: bounds.min * KG_RATIO_NUMERATOR / KG_RATIO_DENOMINATOR, max: bounds.max * KG_RATIO_NUMERATOR / KG_RATIO_DENOMINATOR, integer: false };
  return null;
}

/** Display the entered measurement with its units, without exposing a converted
 * value as though that were what the user entered. No answer is inferred.
 */
export function measurementDisplay(questionId, answers = {}, language = 'en') {
  if (questionId !== 'height' && questionId !== 'weight') return '';
  const locale = language === 'es' ? 'es' : 'en';
  const labels = copy[locale];
  const raw = answers[questionId];
  if (raw === 'unknown') return labels.unknown;
  if (raw === 'skip') return labels.skip;
  const unit = unitFor(questionId, answers);
  const format = value => new Intl.NumberFormat(locale, { maximumFractionDigits: 10 }).format(value);
  if (questionId === 'height' && unit === 'ft-in') {
    const feet = answers.heightFeet;
    const inches = answers.heightInches;
    if ((feet === undefined || feet === '') && (inches === undefined || inches === '')) return labels.unanswered;
    if (canonicalHeight(answers) === null) return labels.invalid;
    return locale === 'es'
      ? `${format(number(feet))} pies ${format(number(inches))} pulgadas`
      : `${format(number(feet))} ft ${format(number(inches))} in`;
  }
  if (raw === undefined || raw === '') return labels.unanswered;
  const normalized = questionId === 'height' ? canonicalHeight(answers) : canonicalWeight(answers);
  if (normalized === null) return labels.invalid;
  const suffix = questionId === 'height'
    ? (unit === 'cm' ? 'cm' : locale === 'es' ? 'pulgadas' : 'in')
    : (unit === 'kg' ? 'kg' : locale === 'es' ? 'libras' : 'lb');
  return `${format(number(raw))} ${suffix}`;
}
