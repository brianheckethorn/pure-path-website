import { questions, text } from '../components/educational-age/content.js';

// Complete the active assessment without supplying identifiers or inventing
// measurements. These tests exercise delivery/preferences, so explicit unknown
// and declined answers keep that setup independent of scoring assumptions.
export function answerAssessmentWithoutDisclosure(ui, question, language = 'en') {
  if (question.type === 'multi') ui.click(text.noneSelected[language]);
  else if (question.supplemental || question.type === 'number') ui.click(text.unknown[language]);
  else ui.select(text.unknown[language]);
}

export function finishAssessmentWithExplicitResponses(ui, language = 'en', startIndex = 0) {
  for (let index = startIndex; index < questions.length; index++) {
    answerAssessmentWithoutDisclosure(ui, questions[index], language);
    ui.click(text[index === questions.length - 1 ? 'finish' : 'next'][language]);
  }
}

function enterField(ui, id, value) {
  const input = ui.find(node => ['INPUT', 'SELECT'].includes(node.tagName) && node.id?.endsWith(`-${id}`))[0];
  if (!input) throw new Error(`Assessment field unavailable: ${id}`);
  input.value = String(value); input.emit(input.tagName === 'SELECT' ? 'change' : 'input');
}

// Known synthetic fixtures use the same deliberate UI events as a participant.
// Omitted optional data still gets an explicit unknown/declined response.
export function finishAssessmentWithAnswers(ui, answers, language = 'en') {
  for (const [index, question] of questions.entries()) {
    const currentTitle = ui.find(node => node.tagName === 'H2')[0]?.textContent;
    if (currentTitle !== question.prompt[language]) throw new Error(`Assessment did not advance to ${question.id}`);
    const value = answers[question.id];
    if (value === undefined) answerAssessmentWithoutDisclosure(ui, question, language);
    else if (value === 'unknown' || value === 'preferNot') {
      const label = text[value === 'unknown' ? 'unknown' : 'preferNot'][language];
      if (question.supplemental || question.type === 'number') ui.click(label); else ui.select(label);
    } else if (question.type === 'multi') {
      if (value === 'none') ui.click(text.noneSelected[language]);
      else for (const id of value) ui.select(question.options.find(option => option.id === id).label[language]);
    } else if (question.type === 'number') {
      const units = question.id === 'height'
        ? { in: ['Inches', 'Pulgadas'], 'ft-in': ['Feet and inches', 'Pies y pulgadas'], cm: ['Centimeters', 'Centímetros'] }
        : question.id === 'weight' ? { lb: ['Pounds', 'Libras'], kg: ['Kilograms', 'Kilogramos'] } : null;
      const unit = answers[`${question.id}Unit`];
      if (units && unit) ui.select(units[unit][language === 'es' ? 1 : 0]);
      if (question.id === 'height' && unit === 'ft-in') {
        enterField(ui, 'heightFeet', answers.heightFeet); enterField(ui, 'heightInches', answers.heightInches);
      } else enterField(ui, question.id, value);
    } else if (question.type === 'text') enterField(ui, question.id, value);
    else if (question.type === 'group') {
      for (const field of question.fields) {
        if (field.whenReading && value.readingStatus !== field.whenReading) continue;
        if (Object.hasOwn(value, field.id)) enterField(ui, field.id, value[field.id]);
      }
    } else ui.select(question.options.find(option => option.id === value).label[language]);
    ui.click(text[index === questions.length - 1 ? 'finish' : 'next'][language]);
  }
}
