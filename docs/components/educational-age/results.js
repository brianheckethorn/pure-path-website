import { questions, disclosure, text } from './content.js';
import { measurementDisplay } from './measurements.js';
import { hasReadingContext, readingEntryIssues } from './reading-context.js';

export const readingSources = Object.freeze([
  { id: 'bloodPressureReading', en: 'American Heart Association: blood pressure readings and urgent care', es: 'American Heart Association: presión arterial y atención urgente', url: 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings' },
  { id: 'bloodGlucoseReading', en: 'NIDDK: diabetes testing and diagnosis', es: 'NIDDK: pruebas y diagnóstico de diabetes', url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis' }
]);

export function readingContextText(answers, language) {
  if (!hasReadingContext(answers)) return [];
  const issues = readingEntryIssues(answers, language);
  return [text.readingNotice[language], ...(issues.length ? [text.readingIssues[language], ...issues.map(issue => issue.message)] : []),
    ...(hasReadingContext({ bloodPressureReading: answers.bloodPressureReading }) ? [text.bpSafety[language], `${readingSources[0][language]}: ${readingSources[0].url}`] : []),
    ...(hasReadingContext({ bloodGlucoseReading: answers.bloodGlucoseReading }) ? [text.glucoseSafety[language], `${readingSources[1][language]}: ${readingSources[1].url}`] : [])];
}

const tip = (key, en, es) => ({ key, en, es });
// Suggestions respond to the actual answer, not to the three lowest factors.
// No weight-loss advice, disability penalty advice, or medication changes.
export function discussionIdeas(answers) {
  const ideas = [];
  if (answers.nicotine === 'current' || answers.tobaccoHistory === 'current') ideas.push(tip('nicotine', 'If support with nicotine choices would help, discuss your goals with a health professional. Do not change nicotine medicines used to quit without guidance.', 'Si necesitas apoyo con decisiones sobre nicotina, conversa con un profesional. No cambies medicamentos con nicotina para dejar de fumar sin orientación.'));
  if (['diagnosed', 'borderline'].includes(answers.bloodPressure) || ['diagnosed', 'borderline'].includes(answers.bloodSugar) || ['high', 'borderline'].includes(answers.cholesterol)) ideas.push(tip('history', 'You could bring questions about the health history you shared to your usual care team. This quiz does not interpret readings or recommend treatment.', 'Puedes llevar preguntas sobre el historial que compartiste a tu equipo de atención. Este cuestionario no interpreta resultados ni recomienda tratamiento.'));
  if (['poor', 'fair'].includes(answers.sleepQuality) || ['lt5', '5-6'].includes(answers.sleepDuration) || ['0-2', '3-4'].includes(answers.sleepSevenEightFrequency)) ideas.push(tip('sleep', 'Choose one regular bedtime or wake-up cue to try. If sleep problems persist, consider talking with a health professional.', 'Elige una señal habitual para acostarte o despertarte que puedas probar. Si los problemas persisten, considera hablar con un profesional.'));
  if (['poor', 'fair'].includes(answers.dietQuality) || ['0-1', '2-3'].includes(answers.vegetables) || ['0-2', '3-4'].includes(answers.fruitVegetableServings)) ideas.push(tip('food', 'If it fits your care plan, add a vegetable you enjoy to your next meal.', 'Si se ajusta a tu plan de atención, añade una verdura que te guste a tu próxima comida.'));
  if (['rarely', '1-2'].includes(answers.exercise) || ['none', '1'].includes(answers.strength) || ['10+', '7-9'].includes(answers.sedentary) || ['rarely', '1-2'].includes(answers.exerciseTwentyThirty)) ideas.push(tip('movement', 'Choose one comfortable movement break to try, such as walking or seated movement, that fits your abilities and care plan.', 'Elige una pausa cómoda de movimiento, como caminar o moverte sentado, que se ajuste a tus capacidades y plan de atención.'));
  if (['high', 'moderate'].includes(answers.stress) || ['low', 'some'].includes(answers.socialSupport)) ideas.push(tip('support', 'A small calming routine or a conversation with someone you trust may be a place to start.', 'Una pequeña rutina tranquila o una conversación con alguien de confianza puede ser un comienzo.'));
  if (['heavy', 'moderate'].includes(answers.alcohol) || ['highReference', '1-7'].includes(answers.alcoholServings)) ideas.push(tip('alcohol', 'If alcohol is something you want to discuss, a health professional can help you explore your goals and options.', 'Si quieres conversar sobre el alcohol, un profesional puede ayudarte a explorar tus metas y opciones.'));
  if (['low', 'mixed'].includes(answers.energy) || answers.functionalFitness === 'limited') ideas.push(tip('dailyLife', 'You could discuss changes in energy or everyday activities with your usual care team, in a way that fits your abilities.', 'Puedes conversar con tu equipo de atención sobre cambios de energía o actividades diarias, según tus capacidades.'));
  if (answers.wholeGrainServings === 'none') ideas.push(tip('wholeGrains', 'If it fits your care plan, explore a whole-grain food you enjoy as part of a meal.', 'Si se ajusta a tu plan de atención, prueba un cereal integral que disfrutes como parte de una comida.'));
  if (answers.nutSeedServings === '0-2') ideas.push(tip('nutsSeeds', 'If safe for your allergies and care plan, consider nuts or seeds you enjoy with a meal. Ask your care team if you are unsure.', 'Si tus alergias y tu plan de atención lo permiten, considera añadir frutos secos o semillas que disfrutes a una comida. Consulta con tu equipo si tienes dudas.'));
  if (answers.redMeatFrequency === '3plusWeekly') ideas.push(tip('foodVariety', 'You could discuss food variety and protein choices that fit your needs with a qualified nutrition professional.', 'Puedes conversar con un profesional de nutrición sobre variedad de alimentos y fuentes de proteína que se ajusten a tus necesidades.'));
  if (answers.breakfastFrequency === 'lt2') ideas.push(tip('breakfast', 'If you want to explore your morning routine, discuss a breakfast that suits your preferences and care plan. Skipping breakfast alone does not establish a health problem.', 'Si quieres explorar tu rutina de la mañana, conversa sobre un desayuno que se ajuste a tus preferencias y plan de atención. Omitir el desayuno por sí solo no determina un problema de salud.'));
  if (answers.snackingFrequency === 'severalDaily') ideas.push(tip('snacks', 'If you have questions about snacks, look at the foods, hunger, and any medical needs involved with your care team. Frequency alone does not mean snacks should be avoided.', 'Si tienes preguntas sobre comer entre comidas, revisa los alimentos, el hambre y las necesidades médicas con tu equipo de atención. La frecuencia por sí sola no indica que debas evitarlo.'));
  if (ideas.length < 3 && !ideas.some(idea => idea.key === 'food') && (['good', 'excellent'].includes(answers.dietQuality) || ['4-5', '6+'].includes(answers.vegetables))) ideas.push(tip('maintenance', 'For variety, choose a different vegetable you enjoy for a meal, if it fits your care plan.', 'Para variar, elige una verdura diferente que disfrutes para una comida, si se ajusta a tu plan de atención.'));
  if (ideas.length < 3 && !ideas.some(idea => idea.key === 'movement') && ['3-4', '5+'].includes(answers.exercise)) ideas.push(tip('maintainMovement', 'Keep a comfortable movement routine you enjoy, adjusting it to your abilities and care plan.', 'Mantén una rutina cómoda de movimiento que disfrutes, adaptándola a tus capacidades y plan de atención.'));
  if (ideas.length < 3 && !ideas.some(idea => idea.key === 'sleep') && ['good', 'excellent'].includes(answers.sleepQuality)) ideas.push(tip('maintainSleep', 'Keep the sleep routine that helps you feel rested; choose one bedtime cue to keep consistent.', 'Mantén la rutina de sueño que te ayuda a descansar; elige una señal para acostarte de forma constante.'));
  if (!ideas.length) ideas.push(tip('general', 'General idea: choose one everyday habit or question you would like to discuss. No missing answer is interpreted as a problem.', 'Idea general: elige un hábito diario o una pregunta que quieras conversar. Una respuesta que falta no se interpreta como un problema.'));
  return ideas.slice(0, 3);
}

export function answerText(question, value, language) {
  if (value === undefined || value === '') return text.unanswered[language];
  if (value === 'unknown') return text.unknown[language];
  if (value === 'skip') return text.skipped[language];
  if (question.type === 'group') {
    if (typeof value !== 'object' || Array.isArray(value)) return text.unknown[language];
    return question.fields.map(field => {
      const entry = value[field.id];
      const display = field.type === 'select' ? field.options.find(option => option.id === entry)?.label[language] : entry;
      return `${field.label[language]}: ${display || text.unanswered[language]}`;
    }).filter(Boolean).join('; ') || text.unanswered[language];
  }
  if (question.type === 'multi') return Array.isArray(value) ? question.options.filter(option => value.includes(option.id)).map(option => option.label[language]).join('; ') || text.unanswered[language] : text.unknown[language];
  if (question.type === 'number' || question.type === 'text') return String(value);
  return question.options.find(option => option.id === value)?.label[language] ?? text.unknown[language];
}

export function reportAnswer(question, answers, language) {
  if (['height', 'weight'].includes(question.id)) return measurementDisplay(question.id, answers, language);
  return answerText(question, answers[question.id], language);
}

export function resultEmailText(result, answers, language) {
  const ageLines = result.status === 'complete' ? [
    `${text.actual[language]}: ${result.actualAge} ${text.years[language]}`,
    `${text.estimate[language]}: ${result.quizAge} ${text.years[language]}`
  ] : [text.withheld[language], text.withheldWhy[language]];
  const details = result.status === 'complete' ? [
    text.calculationDetails[language],
    `${text.difference[language]}: ${result.difference > 0 ? '+' : ''}${result.difference} ${text.years[language]}`,
    text.comparisonNote[language], `${text.bmi[language]}: ${result.bmi.toFixed(1)}`, text.bmiNote[language]
  ] : [];
  return [text.resultTitle[language], ...ageLines, disclosure[language], ...readingContextText(answers, language), text.suggestions[language], text.care[language],
    ...discussionIdeas(answers).map((idea, index) => `${index + 1}. ${idea[language]}`), ...details,
    text.review[language], ...questions.filter(question => !question.privatePreference).map(question => `${question.prompt[language]}\n${reportAnswer(question, answers, language)}`)
  ].join('\n\n');
}
