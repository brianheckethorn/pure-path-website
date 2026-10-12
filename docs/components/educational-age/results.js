import { questions, disclosure, text } from './content.js';

const tip = (key, en, es) => ({ key, en, es });
// Suggestions respond to the actual answer, not to the three lowest factors.
// No weight-loss advice, disability penalty advice, or medication changes.
export function discussionIdeas(answers) {
  const ideas = [];
  if (answers.nicotine === 'current') ideas.push(tip('nicotine', 'If support with nicotine choices would help, discuss your goals with a health professional. Do not change nicotine medicines used to quit without guidance.', 'Si necesitas apoyo con decisiones sobre nicotina, conversa con un profesional. No cambies medicamentos con nicotina para dejar de fumar sin orientación.'));
  if (['diagnosed', 'borderline'].includes(answers.bloodPressure) || ['diagnosed', 'borderline'].includes(answers.bloodSugar) || ['high', 'borderline'].includes(answers.cholesterol)) ideas.push(tip('history', 'You could bring questions about the health history you shared to your usual care team. This quiz does not interpret readings or recommend treatment.', 'Puedes llevar preguntas sobre el historial que compartiste a tu equipo de atención. Este cuestionario no interpreta resultados ni recomienda tratamiento.'));
  if (['poor', 'fair'].includes(answers.sleepQuality) || ['lt5', '5-6'].includes(answers.sleepDuration)) ideas.push(tip('sleep', 'Choose one regular bedtime or wake-up cue to try. If sleep problems persist, consider talking with a health professional.', 'Elige una señal habitual para acostarte o despertarte que puedas probar. Si los problemas persisten, considera hablar con un profesional.'));
  if (['poor', 'fair'].includes(answers.dietQuality) || ['0-1', '2-3'].includes(answers.vegetables)) ideas.push(tip('food', 'If it fits your care plan, add a vegetable you enjoy to your next meal.', 'Si se ajusta a tu plan de atención, añade una verdura que te guste a tu próxima comida.'));
  if (['rarely', '1-2'].includes(answers.exercise) || ['none', '1'].includes(answers.strength) || ['10+', '7-9'].includes(answers.sedentary)) ideas.push(tip('movement', 'Choose one comfortable movement break to try, such as walking or seated movement, that fits your abilities and care plan.', 'Elige una pausa cómoda de movimiento, como caminar o moverte sentado, que se ajuste a tus capacidades y plan de atención.'));
  if (['high', 'moderate'].includes(answers.stress) || ['low', 'some'].includes(answers.socialSupport)) ideas.push(tip('support', 'A small calming routine or a conversation with someone you trust may be a place to start.', 'Una pequeña rutina tranquila o una conversación con alguien de confianza puede ser un comienzo.'));
  if (['heavy', 'moderate'].includes(answers.alcohol)) ideas.push(tip('alcohol', 'If alcohol is something you want to discuss, a health professional can help you explore your goals and options.', 'Si quieres conversar sobre el alcohol, un profesional puede ayudarte a explorar tus metas y opciones.'));
  if (['low', 'mixed'].includes(answers.energy) || answers.functionalFitness === 'limited') ideas.push(tip('dailyLife', 'You could discuss changes in energy or everyday activities with your usual care team, in a way that fits your abilities.', 'Puedes conversar con tu equipo de atención sobre cambios de energía o actividades diarias, según tus capacidades.'));
  if (!ideas.length && (['good', 'excellent'].includes(answers.dietQuality) || ['4-5', '6+'].includes(answers.vegetables))) ideas.push(tip('maintenance', 'For variety, choose a different vegetable you enjoy for a meal, if it fits your care plan.', 'Para variar, elige una verdura diferente que disfrutes para una comida, si se ajusta a tu plan de atención.'));
  if (!ideas.length) ideas.push(tip('general', 'General idea: choose one everyday habit or question you would like to discuss. No missing answer is interpreted as a problem.', 'Idea general: elige un hábito diario o una pregunta que quieras conversar. Una respuesta que falta no se interpreta como un problema.'));
  return ideas.slice(0, 2);
}

export function answerText(question, value, language) {
  if (value === undefined || value === '') return text.unanswered[language];
  if (value === 'unknown') return text.unknown[language];
  if (value === 'skip') return text.skipped[language];
  if (question.type === 'number') return String(value);
  return question.options.find(option => option.id === value)?.label[language] ?? text.unknown[language];
}

export function resultEmailText(result, answers, language) {
  return [text.resultTitle[language], disclosure[language], ...(result.status === 'complete' ? [
    `${text.actual[language]}: ${result.actualAge} ${text.years[language]}`,
    `${text.estimate[language]}: ${result.quizAge} ${text.years[language]}`,
    `${text.difference[language]}: ${result.difference > 0 ? '+' : ''}${result.difference} ${text.years[language]}`,
    text.comparisonNote[language], `${text.bmi[language]}: ${result.bmi.toFixed(1)}`, text.bmiNote[language]
  ] : [text.withheld[language], text.withheldWhy[language]]), text.care[language], ...questions.map(question => `${question.prompt[language]}\n${answerText(question, answers[question.id], language)}`), text.suggestions[language], ...discussionIdeas(answers).map(idea => idea[language])].join('\n\n');
}
