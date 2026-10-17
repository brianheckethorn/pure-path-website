import { questions, sections, disclosure, text } from './content.js';
import { measurementDisplay } from './measurements.js';
import { hasReadingContext, readingEntryIssues } from './reading-context.js';
import { calculateCandidateAssessment, candidateDomainLabels, candidateReasons } from './candidate-scoring.js';
import { numericValue } from './scoring.js';
import { reportPortrait } from '../report-portrait.js';
import { discussionIdeas } from './lifestyle-recommendations.js';
export { discussionIdeas } from './lifestyle-recommendations.js';

// Report fields are an explicit health/preference allowlist, rather than a
// fallback that can stringify old identity fields or arbitrary question data.
// Keep a private metadata snapshot so a caller-supplied question cannot replace
// a numeric reading with a text/contact field or inject its own labels.
const allowedQuestionIds = new Set([
  'age', 'sex', 'height', 'weight', 'waistMeasurement',
  'bloodPressureReading', 'bloodGlucoseReading', 'cholesterol', 'tobaccoHistory',
  'exercise', 'strength', 'sedentary', 'functionalFitness', 'sleepDuration', 'sleepQuality', 'energy',
  'breakfastFrequency', 'snackingFrequency', 'fruitVegetableServings', 'wholeGrainServings',
  'nutSeedServings', 'redMeatFrequency', 'sugaryDrinks', 'water', 'alcoholServings',
  'stress', 'socialSupport', 'spiritualityPreference', 'interests'
]);
const snapshotOptions = options => (options || []).map(option => Object.freeze({ id: option.id, label: Object.freeze({ ...option.label }) }));
const canonicalQuestions = questions.filter(question => allowedQuestionIds.has(question.id)).map(question => Object.freeze({
  id: question.id, type: question.type, section: question.section,
  privatePreference: Boolean(question.privatePreference), prompt: Object.freeze({ ...question.prompt }),
  options: Object.freeze(snapshotOptions(question.options)),
  fields: Object.freeze((question.fields || []).map(field => Object.freeze({ id: field.id, type: field.type,
    whenReading: field.whenReading, label: Object.freeze({ ...field.label }), options: Object.freeze(snapshotOptions(field.options)) })))
}));
const questionById = new Map(canonicalQuestions.map(question => [question.id, question]));
const reportQuestions = canonicalQuestions.filter(question => !question.privatePreference);
const reportSections = sections.map(section => Object.freeze({ ...section }));
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const localeFor = language => language === 'es' ? 'es' : 'en';
const canonicalQuestion = question => question && typeof question.id === 'string' ? questionById.get(question.id) : undefined;
const finiteNumber = value => typeof value === 'number' && Number.isFinite(value);

function numericAnswer(value, language) {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) return text.unanswered[language];
  const entered = typeof value === 'string' ? value.trim() : finiteNumber(value) ? String(value) : '';
  // This is display-type validation, not a clinical range check. Preserve
  // entered decimal precision (including zero/negative entries to be checked),
  // while preventing names/contact strings and object coercion from leaking.
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(entered) && Number.isFinite(Number(entered)) ? entered : text.unknown[language];
}

function actualAgeForReport(result, answers) {
  const age = numericValue(own(result, 'actualAge') ? result.actualAge : answers.age);
  return Number.isInteger(age) && age >= 18 && age <= 100 ? age : undefined;
}

export function calculateAssessmentPreview(answers) {
  return calculateCandidateAssessment(answers);
}

export const readingSources = Object.freeze([
  Object.freeze({ id: 'bloodPressureReading', en: 'American Heart Association: blood pressure readings and urgent care', es: 'American Heart Association: presión arterial y atención urgente', url: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings' }),
  Object.freeze({ id: 'bloodGlucoseReading', en: 'NIDDK: diabetes testing and diagnosis', es: 'NIDDK: pruebas y diagnóstico de diabetes', url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis' })
]);

export function readingContextText(answers, language) {
  answers = record(answers) ? answers : {};
  language = localeFor(language);
  if (!hasReadingContext(answers)) return [];
  const issues = readingEntryIssues(answers, language);
  return [text.readingNotice[language], ...(issues.length ? [text.readingIssues[language], ...issues.map(issue => issue.message)] : []),
    ...(hasReadingContext({ bloodPressureReading: answers.bloodPressureReading }) ? [text.bpSafety[language], `${readingSources[0][language]}: ${readingSources[0].url}`] : []),
    ...(hasReadingContext({ bloodGlucoseReading: answers.bloodGlucoseReading }) ? [text.glucoseSafety[language], `${readingSources[1][language]}: ${readingSources[1].url}`] : [])];
}

export function answerText(question, value, language) {
  question = canonicalQuestion(question);
  language = localeFor(language);
  if (!question) return text.unanswered[language];
  if (value === undefined || value === '') return text.unanswered[language];
  if (value === 'unknown') return text.unknown[language];
  if (value === 'skip') return text.skipped[language];
  if (value === 'preferNot') return text.preferNot[language];
  if (value === 'none' && question.type === 'multi') return text.noneSelected[language];
  if (question.type === 'group') {
    if (!record(value)) return text.unknown[language];
    return question.fields.filter(field => !field.whenReading || value.readingStatus === field.whenReading || (!value.readingStatus && value[field.id] !== undefined)).map(field => {
      const entry = value[field.id];
      const display = field.type === 'select'
        ? (field.options.find(option => option.id === entry)?.label[language] || (entry === undefined || entry === '' ? text.unanswered[language] : text.unknown[language]))
        : field.type === 'number' ? numericAnswer(entry, language) : text.unanswered[language];
      return `${field.label[language]}: ${display}`;
    }).filter(Boolean).join('; ') || text.unanswered[language];
  }
  if (question.type === 'multi') return Array.isArray(value) ? question.options.filter(option => value.includes(option.id)).map(option => option.label[language]).join('; ') || text.unanswered[language] : text.unknown[language];
  if (question.type === 'number') return numericAnswer(value, language);
  return question.options.find(option => option.id === value)?.label[language] ?? text.unknown[language];
}

export function reportAnswer(question, answers, language) {
  question = canonicalQuestion(question);
  language = localeFor(language);
  if (!question || question.privatePreference) return text.unanswered[language];
  answers = record(answers) ? answers : {};
  if (answers[question.id] === 'preferNot') return text.preferNot[language];
  if (['height', 'weight'].includes(question.id)) return measurementDisplay(question.id, answers, language);
  return answerText(question, answers[question.id], language);
}

export function recommendationText(idea, language) { return `${idea.title?.[language] ? `${idea.title[language]}. ` : ''}${idea[language]}`; }

export function scoringContextText(result, language) {
  result = record(result) ? result : {};
  language = localeFor(language);
  const coverage = result.coverage;
  if (!record(coverage) || ![coverage.knownWeight, coverage.totalWeight, coverage.percent].every(finiteNumber)
    || coverage.totalWeight !== 98 || coverage.knownWeight < 0 || coverage.knownWeight > 98 || coverage.percent < 0 || coverage.percent > 100) return [];
  const es = language === 'es';
  const { knownWeight, totalWeight, percent } = result.coverage;
  const areaCount = Number.isInteger(result.habitAreaCount) && result.habitAreaCount >= 0 && result.habitAreaCount <= 5
    ? result.habitAreaCount : ['diet', 'activity', 'sleep', 'tobacco', 'alcohol'].filter(id => result.habitAreas?.[id] === true).length;
  const copy = [es ? `Peso de puntuación evaluado: ${percent}% (${knownWeight} de ${totalWeight} puntos). Áreas de hábitos representadas: ${areaCount} de 5.` : `Scoring weight assessed: ${percent}% (${knownWeight} of ${totalWeight} points). Habit areas represented: ${areaCount} of 5.`];
  copy.push(es ? 'Para mostrar un número, esta versión necesita al menos el 60% del peso de puntuación y 4 de 5 áreas: alimentación, actividad, horas de sueño, tabaco y alcohol. Alimentación cuenta con 3 de sus 4 componentes conocidos. Esta regla es una decisión del producto, no una norma clínica; no necesitas conocer los análisis.' : 'To show a number, this version needs at least 60% of scoring weight and 4 of 5 areas: diet, activity, sleep duration, tobacco, and alcohol. Diet counts when 3 of its 4 components are known. This gate is a product choice, not a clinical standard; lab results are not required.');
  const unassessed = Array.isArray(result.unassessed) ? result.unassessed.filter(domain => record(domain) && typeof domain.id === 'string' && own(candidateDomainLabels, domain.id)) : [];
  if (unassessed.length) {
    copy.push(es ? 'Áreas de puntuación sin evaluar:' : 'Unassessed scoring areas:');
    for (const domain of unassessed) copy.push(`${candidateDomainLabels[domain.id][language]} - ${typeof domain.reason === 'string' && own(candidateReasons, domain.reason) ? candidateReasons[domain.reason][language] : (es ? 'Sin información utilizable para puntuar.' : 'No usable scoring information.')}`);
  } else copy.push(es ? 'Todas las áreas tienen respuestas utilizables. Esto no demuestra buena salud.' : 'All scoring areas have usable answers. This does not establish good health.');
  if (result.status === 'complete' && record(result.range) && [result.range.minAge, result.range.maxAge].every(finiteNumber)) copy.push(es ? `Posible efecto de los datos sin evaluar: edad estimada de ${result.range.minAge} a ${result.range.maxAge} años. Este intervalo muestra posibilidades matemáticas para las respuestas sin evaluar; no es un intervalo de confianza clínica ni una predicción.` : `Possible effect of unassessed items: estimated age ${result.range.minAge}-${result.range.maxAge} years. This range shows mathematical possibilities for unassessed answers; it is not a clinical confidence interval or a prediction.`);
  return copy;
}

export function resultPDFModel(result, answers, language) {
  result = record(result) ? result : {};
  answers = record(answers) ? answers : {};
  language = localeFor(language);
  const actualAge = actualAgeForReport(result, answers);
  const complete = result.status === 'complete' && finiteNumber(result.quizAge) && actualAge !== undefined;
  const actual = actualAge !== undefined ? { label: text.actual[language], value: actualAge, unit: text.years[language] } : undefined;
  const scoring = scoringContextText(result, language);
  const ideas = discussionIdeas(answers);
  const lifestyle = ideas.filter(idea => idea.kind !== 'care').map(idea => recommendationText(idea, language));
  const care = ideas.filter(idea => idea.kind === 'care').map(idea => recommendationText(idea, language));
  return {
    title: text.resultTitle[language], actual,
    portrait: reportPortrait,
    portraitCopy: language === 'es' ? 'Opcional: puedes contactar a Mario por separado para conversar sobre asesoramiento personal en su consultorio. Tus respuestas no se comparten automáticamente. La inscripción para eventos es una elección aparte.' : 'Optional: contact Mario separately to discuss personal counseling at his office. Your answers are not shared automatically. Signing up for events is a separate choice.',
    estimate: complete ? { label: text.estimate[language], value: result.quizAge, unit: text.years[language] } : undefined,
    estimatePending: result.status === 'research-pending',
    disclosure: disclosure[language],
    notice: `${scoring[0] ? `${scoring[0]} ` : ''}${complete ? text.scoringReview[language] : result.status === 'research-pending' ? `${text.researchPending[language]}. ${text.researchWhy[language]} ${text.scoringReview[language]}` : `${text.withheld[language]}. ${text.withheldWhy[language]} ${text.scoringReview[language]}`}`,
    recommendations: { title: text.suggestions[language], intro: text.care[language], primaryTitle: language === 'es' ? 'Elige una idea para empezar' : 'Choose one place to start', additionalTitle: language === 'es' ? 'Más ideas según tus respuestas' : 'More ideas from your answers', careTitle: language === 'es' ? 'Apoyo y preguntas para tu equipo de salud' : 'Support and questions for your care team', primary: lifestyle.slice(0, 3), additional: lifestyle.slice(3), care, items: ideas.map(idea => recommendationText(idea, language)) },
    readingContext: readingContextText(answers, language),
    readingLinks: readingSources.filter(source => hasReadingContext({ [source.id]: answers[source.id] })).map(source => ({ url: source.url, label: source[language] })),
    interpretation: { title: text.calculationDetails[language], paragraphs: [...scoring, ...(complete ? [...(finiteNumber(result.difference) ? [`${text.difference[language]}: ${result.difference > 0 ? '+' : ''}${result.difference} ${text.years[language]}`] : []), text.comparisonNote[language], ...(Number.isFinite(result.bmi) ? [`${text.bmi[language]}: ${result.bmi.toFixed(1)}`, text.bmiNote[language]] : [])] : [result.status === 'research-pending' ? text.researchWhy[language] : text.withheldWhy[language]])] },
    answerGroups: reportSections.map((section, index) => ({ title: section[language], answers: reportQuestions.filter(question => question.section === index).map(question => ({ question: question.prompt[language], answer: reportAnswer(question, answers, language) })) })).filter(group => group.answers.length)
  };
}

export function resultEmailText(result, answers, language) {
  result = record(result) ? result : {};
  answers = record(answers) ? answers : {};
  language = localeFor(language);
  const actualAge = actualAgeForReport(result, answers);
  const complete = result.status === 'complete' && finiteNumber(result.quizAge) && actualAge !== undefined;
  const ageLines = complete ? [
    `${text.actual[language]}: ${actualAge} ${text.years[language]}`,
    `${text.estimate[language]}: ${result.quizAge} ${text.years[language]}`
  ] : [...(actualAge !== undefined ? [`${text.actual[language]}: ${actualAge} ${text.years[language]}`] : []), ...(result.status === 'research-pending' ? [text.researchPending[language], text.researchWhy[language]] : [text.withheld[language], text.withheldWhy[language]])];
  const details = complete ? [
    text.calculationDetails[language],
    ...(finiteNumber(result.difference) ? [`${text.difference[language]}: ${result.difference > 0 ? '+' : ''}${result.difference} ${text.years[language]}`] : []),
    text.comparisonNote[language], ...(Number.isFinite(result.bmi) ? [`${text.bmi[language]}: ${result.bmi.toFixed(1)}`, text.bmiNote[language]] : [])
  ] : [];
  return [text.resultTitle[language], ...ageLines, disclosure[language], text.scoringReview[language], ...scoringContextText(result, language), ...readingContextText(answers, language), text.suggestions[language], text.care[language],
    ...discussionIdeas(answers).map((idea, index) => `${index + 1}. ${recommendationText(idea, language)}`), ...details,
    text.review[language], ...reportQuestions.map(question => `${question.prompt[language]}\n${reportAnswer(question, answers, language)}`)
  ].join('\n\n');
}
