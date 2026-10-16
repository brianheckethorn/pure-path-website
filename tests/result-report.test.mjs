import test from 'node:test';
import assert from 'node:assert/strict';
import { componentHarness } from './dom-harness.mjs';
import { appendResultReport, reportStyles } from '../components/result-report.js';
import { calculateAssessmentPreview, resultPDFModel, reportAnswer } from '../components/educational-age/results.js';
import { questions, disclosure, text } from '../components/educational-age/content.js';

test('shared template report keeps actual age distinct, pending estimate honest, and private answers out in EN/ES', () => {
  const answers = { age: '50', fullName: '<img src=x onerror=alert(1)>', spiritualityPreference: 'deep', reportContact: { email: 'private@example.test' }, bloodPressureReading: { readingStatus: 'notMeasured', history: 'unknown', systolic: '999' } };
  for (const language of ['en', 'es']) {
    const model = resultPDFModel(calculateAssessmentPreview(answers), answers, language);
    const ui = componentHarness(); const { title } = appendResultReport(ui.root, { document: ui.document, model, language });
    assert.equal(title.textContent, text.resultTitle[language]);
    assert.equal(ui.find(node => node.className === 'age-number').length, 1);
    assert.equal(ui.find(node => node.className === 'age-number')[0].textContent, '50');
    assert.equal(ui.find(node => node.className === 'age-pending')[0].textContent, text.pendingLabel[language]);
    assert.ok(ui.root.textContent.includes(disclosure[language]));
    assert.ok(ui.root.textContent.includes(answers.fullName));
    assert.equal(ui.find(node => node.tagName === 'IMG').length, 1, 'only the trusted portrait is an image');
    assert.doesNotMatch(ui.root.textContent, /private@example|999/);
    const privatePrompts = questions.filter(question => question.privatePreference).map(question => question.prompt[language]);
    for (const prompt of privatePrompts) assert.equal(ui.root.textContent.includes(prompt), false);
    assert.equal(model.portrait.bytes[0], 255); assert.equal(model.portrait.bytes[1], 216);
  }
});

test('reporting a not-measured reading omits inactive values and print rows allow pagination', () => {
  const question = questions.find(question => question.id === 'bloodGlucoseReading');
  const answer = reportAnswer(question, { bloodGlucoseReading: { readingStatus: 'notMeasured', history: 'preferNot', value: '12345', unit: 'mgDl' } }, 'en');
  assert.doesNotMatch(answer, /12345|mg\/dL|Blood glucose value/);
  assert.match(answer, /not measured|Not known/);
  const ui = componentHarness();
  const model = resultPDFModel(calculateAssessmentPreview({}), {}, 'es');
  appendResultReport(ui.root, { document: ui.document, model, language: 'es', collapsibleAnswers: false });
  assert.equal(ui.find(node => node.tagName === 'DETAILS').length, 0);
  assert.match(reportStyles, /@page\{size:letter;margin:14mm\}/);
  assert.match(reportStyles, /break-inside:avoid-page/);
  assert.doesNotMatch(reportStyles, /height:1056|position:fixed/);
});
