// Optional entry checks only. No clinical ranges, classifications, conversions,
// treatment advice, or age/scoring adjustments are applied to these readings.
const groups = [
  { id: 'waistMeasurement', fields: ['value', 'unit'] },
  { id: 'bloodPressureReading', fields: ['systolic', 'diastolic'], hasMode: true },
  { id: 'bloodGlucoseReading', fields: ['value', 'unit', 'timing'], hasMode: true }
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
    readingStatus: 'choose Measured or Not measured for the reading status',
    history: 'choose a listed health-history answer, Not sure, or Prefer not to answer',
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
    readingStatus: 'elige Medido o No medido para el estado de la lectura',
    history: 'elige una respuesta de historial de salud de la lista, No sé o Prefiero no responder',
    timing: 'elige en ayunas, después de comer o no sé para el momento de la medición'
  }
};

const isBlank = value => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
const isOmitted = value => isBlank(value) || value === 'skip' || value === 'unknown' || value === 'preferNot';
const isGroup = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const answersObject = answers => isGroup(answers) ? answers : {};
const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const historyOptions = ['diagnosed', 'borderline', 'normal', 'unknown', 'preferNot'];

function groupHasEntry(value, fields, hasMode) {
  if (isOmitted(value)) return false;
  if (!isGroup(value)) return true;
  // A declared absence of a reading takes precedence over stale raw fields.
  // The participant's separately answered history is not a measured reading.
  if (hasMode && value.readingStatus === 'notMeasured') return false;
  if (hasMode && owns(value, 'readingStatus') && !isBlank(value.readingStatus)) return true;
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
  return groups.some(({ id, fields, hasMode }) => groupHasEntry(source[id], fields, hasMode));
}

/** Return at most one issue per entered group. A valid entry only means that
 * its fields can be read; it is not a clinical assessment or a safe range.
 */
export function readingEntryIssues(answers = {}, language = 'en') {
  const source = answersObject(answers);
  const text = labels[language === 'es' ? 'es' : 'en'];
  const issues = [];
  for (const { id, fields, hasMode } of groups) {
    const value = source[id];
    if (isOmitted(value)) continue;
    // Preserve the legacy entry-only API when readingStatus is absent. The
    // active questionnaire's schema requires an explicit status via its
    // response policy; this helper does not infer one for historical objects.
    const modeEntry = hasMode && isGroup(value) && owns(value, 'readingStatus');
    if (!modeEntry && !groupHasEntry(value, fields, hasMode)) continue;
    const problems = [];
    if (!isGroup(value)) problems.push(text.format);
    else {
      if (modeEntry) {
        if (!['measured', 'notMeasured'].includes(value.readingStatus)) problems.push(text.readingStatus);
        if (!historyOptions.includes(value.history)) problems.push(text.history);
        // With no measured value, inspect only status/history and never raw
        // numbers, units or timing left behind by an earlier answer.
        if (value.readingStatus !== 'measured') {
          if (problems.length) issues.push({ id, message: `${text.prefix} ${text[id]}: ${problems.join('; ')}.` });
          continue;
        }
      }
      if (id === 'bloodPressureReading') {
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
    }
    if (problems.length) issues.push({ id, message: `${text.prefix} ${text[id]}: ${problems.join('; ')}.` });
  }
  return issues;
}
