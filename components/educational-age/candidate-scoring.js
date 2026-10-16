import { normalizeBaseMeasurements } from './measurements.js';
import { bmiFactor, inputBounds, numericValue } from './scoring.js';

// LOCAL CANDIDATE ONLY. These custom points and their conversion into years
// have no clinical validation. Guidance informs direction, not coefficients.
const pair = (en, es) => Object.freeze({ en, es });
const freezeMaps = maps => Object.freeze(Object.fromEntries(Object.entries(maps).map(([id, map]) => [id, Object.freeze(map)])));
export const candidateModel = Object.freeze({ id: 'local-candidate-2026-10-16', totalWeight: 98, baseline: 70, minimumCoverage: .60, minimumHabitAreas: 4 });
export const candidateWeights = Object.freeze({
  bmi: 5, tobaccoHistory: 10, exercise: 8, strength: 5, sedentary: 5,
  sleepDuration: 5, sleepQuality: 4, fruitVegetableServings: 4,
  wholeGrainServings: 3, nutSeedServings: 2, redMeatFrequency: 3,
  sugaryDrinks: 3, water: 3, alcoholServings: 3, stress: 5,
  socialSupport: 4, bloodPressureReading: 6, bloodGlucoseReading: 6,
  cholesterol: 4, energy: 4, functionalFitness: 6
});
export const candidateScoringMaps = freezeMaps({
  tobaccoHistory: { current: 5, quitUnder2: 62, quitOver2: 82, never: 100, other: null },
  exercise: { rarely: 18, '1-2': 50, '3-4': 82, '5+': 100 },
  strength: { none: 15, '1': 45, '2-3': 100, '4+': 100 },
  sedentary: { '10+': 15, '7-9': 45, '4-6': 78, '0-3': 100 },
  sleepDuration: { lt5: 10, '5-lt7': 48, '7-9': 100, gt9: null },
  sleepQuality: { poor: 15, fair: 48, good: 80, excellent: 100 },
  fruitVegetableServings: { '0-2': 25, '3-4': 70, '5+': 100 },
  wholeGrainServings: { none: 20, '1-2': 70, '3+': 100 },
  nutSeedServings: { '0-2': 25, '3-4': 70, '5+': 100, avoidsForCare: null },
  redMeatFrequency: { never: 100, lessWeekly: 90, '1-2Weekly': 70, '3plusWeekly': 40 },
  sugaryDrinks: { '2+': 12, '1': 45, few: 78, none: 100 },
  // Total fluid need cannot be inferred from plain-water volume alone.
  water: { lt4: null, '4-6': null, '7-9': null, '10+': null },
  alcoholServings: { none: 100, '1-7': 82, '8-14': 50, '15+': 18 },
  stress: { high: 18, moderate: 52, manageable: 82, low: 100 },
  socialSupport: { low: 20, some: 52, good: 82, excellent: 100 },
  bloodPressureReading: { diagnosed: 18, borderline: 56, normal: 100 },
  bloodGlucoseReading: { diagnosed: 12, borderline: 54, normal: 100 },
  cholesterol: { high: 28, borderline: 60, normal: 100 },
  energy: { low: 18, mixed: 54, good: 82, high: 100 },
  functionalFitness: { limited: 18, average: 55, good: 82, excellent: 100 }
});
export { candidateWeights as weights, candidateScoringMaps as scoringMaps };

export const candidateDomainLabels = Object.freeze({
  bmi: pair('Height and weight / BMI', 'Estatura y peso / IMC'),
  tobaccoHistory: pair('Tobacco history', 'Historial de tabaco'),
  exercise: pair('Activity frequency', 'Frecuencia de actividad'),
  strength: pair('Muscle-strengthening activity', 'Actividad de fortalecimiento muscular'),
  sedentary: pair('Sitting and reclining time', 'Tiempo sentado o recostado'),
  sleepDuration: pair('Sleep duration', 'Duración del sueño'),
  sleepQuality: pair('Sleep quality', 'Calidad del sueño'),
  fruitVegetableServings: pair('Fruit and vegetables', 'Frutas y verduras'),
  wholeGrainServings: pair('Whole grains', 'Cereales integrales'),
  nutSeedServings: pair('Nuts and seeds', 'Frutos secos y semillas'),
  redMeatFrequency: pair('Red-meat frequency', 'Frecuencia de carne roja'),
  sugaryDrinks: pair('Drinks with added sugar', 'Bebidas con azúcar añadido'),
  water: pair('Plain-water intake', 'Consumo de agua simple'),
  alcoholServings: pair('Alcohol intake', 'Consumo de alcohol'),
  stress: pair('Reported stress', 'Estrés informado'),
  socialSupport: pair('Reported social support', 'Apoyo social informado'),
  bloodPressureReading: pair('Known blood-pressure history', 'Historial conocido de presión arterial'),
  bloodGlucoseReading: pair('Known blood-glucose history', 'Historial conocido de glucosa en sangre'),
  cholesterol: pair('Known cholesterol history', 'Historial conocido de colesterol'),
  energy: pair('Reported energy', 'Energía informada'),
  functionalFitness: pair('Everyday physical activities', 'Actividades físicas cotidianas')
});
export const candidateReasons = Object.freeze({
  missingOrUnknown: pair('Missing, not known, declined, or no usable matching choice.', 'Dato ausente, desconocido, no compartido o sin una opción utilizable.'),
  invalidDomainScore: pair('No usable candidate points were supplied for this domain.', 'No se aportaron puntos utilizables para este apartado.'),
  invalidMeasurements: pair('Height or weight is missing, invalid, or outside the original input range.', 'Falta la estatura o el peso, no son válidos o están fuera del intervalo de entrada original.'),
  adultBmiNotApplicable: pair('Adult BMI bands are not used for ages 18–19 in this candidate.', 'Este modelo no usa los intervalos de IMC de adultos para edades de 18 a 19 años.'),
  ageNeededForBmi: pair('A valid age is needed before using the candidate adult BMI bands.', 'Se necesita una edad válida antes de usar los intervalos de IMC de adultos del modelo.'),
  medicallyUnsuitable: pair('Excluded because this item was marked unsuitable for the person’s care or circumstances.', 'Se excluye porque se indicó que este apartado no es adecuado para la atención o las circunstancias de la persona.'),
  individualSleepNeeds: pair('Longer sleep is not given a score because individual sleep needs and circumstances vary.', 'No se asignan puntos al sueño más prolongado porque las necesidades y circunstancias individuales varían.'),
  waterNeedsContext: pair('Plain-water volume alone does not establish individual total-fluid needs.', 'La cantidad de agua simple por sí sola no determina las necesidades individuales de líquidos totales.'),
  historyNotKnown: pair('No known clinician-reported history was supplied; raw readings are not used to infer it.', 'No se indicó un historial conocido comunicado por un profesional; las lecturas no se usan para deducirlo.')
});
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validPoints = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const dietIds = ['fruitVegetableServings', 'wholeGrainServings', 'nutSeedServings', 'redMeatFrequency'];
const validAge = value => { const age = numericValue(value); return age !== null && Number.isInteger(age) && age >= 18 && age <= 100 ? age : null; };
const yearAdjustment = score => Math.min(15, Math.max(-12, (70 - score) / 3));
const ageAtScore = (age, score) => Math.round(age + yearAdjustment(score));

function assemble(domainScores, ageInput, reasons = {}, extras = {}) {
  const source = object(domainScores) ? domainScores : {};
  const actualAge = validAge(ageInput);
  const domains = Object.entries(candidateWeights).map(([id, weight]) => {
    const assessed = own(source, id) && validPoints(source[id]);
    const reason = assessed ? null : (reasons[id] || (own(source, id) && source[id] !== null && source[id] !== undefined ? 'invalidDomainScore' : 'missingOrUnknown'));
    return { id, label: candidateDomainLabels[id], weight, assessed, score: assessed ? source[id] : null, reason, reasonLabel: reason ? candidateReasons[reason] : null };
  });
  const known = domains.filter(domain => domain.assessed);
  const knownWeight = known.reduce((sum, domain) => sum + domain.weight, 0);
  const isKnown = id => domains.find(domain => domain.id === id).assessed;
  const habitAreas = {
    diet: dietIds.filter(isKnown).length >= 3,
    activity: isKnown('exercise'),
    sleep: isKnown('sleepDuration'),
    tobacco: isKnown('tobaccoHistory'),
    alcohol: isKnown('alcoholServings')
  };
  const habitAreaCount = Object.values(habitAreas).filter(Boolean).length;
  const incompleteReasons = [];
  if (actualAge === null) incompleteReasons.push('actualAgeNeeded');
  if (knownWeight / candidateModel.totalWeight < candidateModel.minimumCoverage) incompleteReasons.push('coverageBelowMinimum');
  if (habitAreaCount < candidateModel.minimumHabitAreas) incompleteReasons.push('habitAreasBelowMinimum');
  const result = {
    status: incompleteReasons.length ? 'incomplete' : 'complete', model: candidateModel.id, actualAge,
    coverage: { knownWeight, totalWeight: candidateModel.totalWeight, percent: Math.round(knownWeight / candidateModel.totalWeight * 100) },
    unassessed: domains.filter(domain => !domain.assessed).map(({ id, label, reason, reasonLabel }) => ({ id, label, reason, reasonLabel })),
    habitAreas, habitAreaCount, domains, incompleteReasons, ...extras
  };
  if (incompleteReasons.length) return result;
  // Unknown domains add no deviation from the displayed neutral anchor. They
  // remain unassessed and reduce coverage; they are never scored as zero.
  const score = Math.round(70 + known.reduce((sum, domain) => sum + domain.weight * (domain.score - 70), 0) / 98);
  const adjustment = yearAdjustment(score);
  const quizAge = Math.round(actualAge + adjustment);
  const knownTotal = known.reduce((sum, domain) => sum + domain.weight * domain.score, 0);
  const missingWeight = 98 - knownWeight;
  const minScore = Math.round(knownTotal / 98);
  const maxScore = Math.round((knownTotal + 100 * missingWeight) / 98);
  return { ...result, score, adjustment, quizAge, difference: quizAge - actualAge,
    range: { minAge: ageAtScore(actualAge, maxScore), maxAge: ageAtScore(actualAge, minScore), minScore, maxScore } };
}

/** Pure numeric model seam for review/golden tests. Only finite numeric points
 * in [0,100] for the fixed domain IDs count; omitted/bad points are unassessed.
 */
export function calculateCandidateFromDomainScores(domainScores, actualAge) {
  return assemble(domainScores, actualAge);
}

/** Score only the active detailed responses. Legacy duplicate answer IDs,
 * raw BP/glucose readings, faith and personal details never enter the math.
 * Optional medicallyUnsuitableDomains is an explicit exclusion list, not an
 * inferred diagnosis; it cannot introduce new domains or alter weights.
 */
export function calculateCandidateAssessment(answers = {}) {
  const source = object(answers) ? answers : {};
  const scores = {};
  const reasons = {};
  const excluded = new Set(Array.isArray(source.medicallyUnsuitableDomains) ? source.medicallyUnsuitableDomains.filter(id => own(candidateWeights, id)) : []);
  for (const [id, map] of Object.entries(candidateScoringMaps)) {
    const value = ['bloodPressureReading', 'bloodGlucoseReading'].includes(id) ? (object(source[id]) ? source[id].history : undefined) : source[id];
    if (excluded.has(id) || ['avoidsForCare', 'notSuitable', 'medicallyUnsuitable'].includes(value)) reasons[id] = 'medicallyUnsuitable';
    else if (id === 'water') reasons[id] = 'waterNeedsContext';
    else if (id === 'sleepDuration' && value === 'gt9') reasons[id] = 'individualSleepNeeds';
    else if (typeof value === 'string' && own(map, value) && validPoints(map[value])) scores[id] = map[value];
    else reasons[id] = ['bloodPressureReading', 'bloodGlucoseReading'].includes(id) ? 'historyNotKnown' : 'missingOrUnknown';
  }
  const actualAge = validAge(source.age);
  const normalized = normalizeBaseMeasurements(source);
  const measurementsValid = ['height', 'weight'].every(id => {
    const value = numericValue(normalized[id]);
    return value !== null && value >= inputBounds[id].min && value <= inputBounds[id].max;
  });
  const extras = {};
  if (measurementsValid) extras.bmi = normalized.weight / normalized.height ** 2 * 703;
  if (excluded.has('bmi') || ['notSuitable', 'medicallyUnsuitable'].includes(source.bmiApplicability)) reasons.bmi = 'medicallyUnsuitable';
  else if (!measurementsValid) reasons.bmi = 'invalidMeasurements';
  else if (actualAge === null) reasons.bmi = 'ageNeededForBmi';
  else if (actualAge < 20) reasons.bmi = 'adultBmiNotApplicable';
  else scores.bmi = bmiFactor(extras.bmi) * 100;
  return assemble(scores, source.age, reasons, extras);
}
