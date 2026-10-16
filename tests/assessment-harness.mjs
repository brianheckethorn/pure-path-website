import { questions, text } from '../components/educational-age/content.js';

// Complete the active assessment without supplying identifiers or inventing
// measurements. These tests exercise delivery/preferences, so explicit unknown
// and declined answers keep that setup independent of scoring assumptions.
export function answerAssessmentWithoutDisclosure(ui, question, language = 'en') {
  if (question.id === 'fullName' || question.id === 'reportContact') ui.click(text.preferNot[language]);
  else if (question.type === 'multi') ui.click(text.noneSelected[language]);
  else if (question.supplemental || question.type === 'number') ui.click(text.unknown[language]);
  else ui.select(text.unknown[language]);
}

export function finishAssessmentWithExplicitResponses(ui, language = 'en', startIndex = 0) {
  for (let index = startIndex; index < questions.length; index++) {
    answerAssessmentWithoutDisclosure(ui, questions[index], language);
    ui.click(text[index === questions.length - 1 ? 'finish' : 'next'][language]);
  }
}
