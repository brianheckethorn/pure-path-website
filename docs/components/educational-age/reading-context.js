// Optional entry checks only. No clinical ranges, classifications, conversions,
// treatment advice, or age/scoring adjustments are applied to these readings.
const groups = [
  { id: 'waistMeasurement', fields: ['value', 'unit'] },
  { id: 'bloodPressureReading', fields: ['systolic', 'diastolic'] },
  { id: 'bloodGlucoseReading', fields: ['value', 'unit', 'timing'] }
];

const labels = {
  en: {
    prefix: 'Entry needs checking; not clinically assessed.',
    waistMeasurement: 'Waist measurement', bloodPressureReading: 'Blood pressure', bloodGlucoseReading: 'Blood glucose',
    format: 'clear and re-enter this reading in the fields provided',
    value: 'enter a positive, finite number using plain decimal notation',
    systolic: 'enter the systolic (top) value as a positive, finite number using plain decimal notation',
    diastolic: 'enter the diastolic (bottom) value as a positive, finite number using plain decimal notation',
    waistUnit: 'choose inches or centimeters', glucoseUnit: 'choose mg/dL or mmol/L',
    timing: 'choose fasting, after a meal, or not sure for the measurement timing'
  },
  es: {
    prefix: 'Revisa la entrada; no se ha evaluado clínicamente.',
    waistMeasurement: 'Medida de cintura', bloodPressureReading: 'Presión arterial', bloodGlucoseReading: 'Glucosa en sangre',
    format: 'borra y vuelve a escribir esta lectura en los campos indicados',
    value: 'escribe un número positivo y finito en notación decimal simple',
    systolic: 'escribe el valor sistólico (superior) como un número positivo y finito en notación decimal simple',
    diastolic: 'escribe el valor diastólico (inferior) como un número positivo y finito en notación decimal simple',
    waistUnit: 'elige pulgadas o centímetros', glucoseUnit: 'elige mg/dL o mmol/L',
    timing: 'elige en ayunas, después de comer o no sé para el momento de la medición'
  }
};

const isBlank = value => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
const isOmitted = value => isBlank(value) || value === 'skip' || value === 'unknown';
const isGroup = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const answersObject = answers => isGroup(answers) ? answers : {};

function groupHasEntry(value, fields) {
  if (isOmitted(value)) return false;
  if (!isGroup(value)) return true;
  return fields.some(field => !isBlank(value[field]));
}

function isPositiveDecimal(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  // Validate the entered notation before Number(), which accepts exponent,
  // hexadecimal and empty-string coercions. Never round or impose an upper
  // clinical bound: any positive, finite plain-decimal entry is accepted.
  if (!/^\d+(?:\.\d+)?$/.test(String(value).trim())) return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

export function hasReadingContext(answers = {}) {
  const source = answersObject(answers);
  return groups.some(({ id, fields }) => groupHasEntry(source[id], fields));
}

/** Return at most one issue per entered group. A valid entry only means that
 * its fields can be read; it is not a clinical assessment or a safe range.
 */
export function readingEntryIssues(answers = {}, language = 'en') {
  const source = answersObject(answers);
  const text = labels[language === 'es' ? 'es' : 'en'];
  const issues = [];
  for (const { id, fields } of groups) {
    const value = source[id];
    if (!groupHasEntry(value, fields)) continue;
    const problems = [];
    if (!isGroup(value)) problems.push(text.format);
    else if (id === 'bloodPressureReading') {
      if (!isPositiveDecimal(value.systolic)) problems.push(text.systolic);
      if (!isPositiveDecimal(value.diastolic)) problems.push(text.diastolic);
    } else {
      if (!isPositiveDecimal(value.value)) problems.push(text.value);
      if (id === 'waistMeasurement') {
        if (!['in', 'cm'].includes(value.unit)) problems.push(text.waistUnit);
      } else {
        if (!['mgDl', 'mmolL'].includes(value.unit)) problems.push(text.glucoseUnit);
        if (!['fasting', 'postMeal', 'unsure'].includes(value.timing)) problems.push(text.timing);
      }
    }
    if (problems.length) issues.push({ id, message: `${text.prefix} ${text[id]}: ${problems.join('; ')}.` });
  }
  return issues;
}
