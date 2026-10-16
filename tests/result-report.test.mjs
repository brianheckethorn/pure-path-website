import test from 'node:test';
import assert from 'node:assert/strict';
import { componentHarness } from './dom-harness.mjs';
import { appendResultReport, reportStyles } from '../components/result-report.js';
import { calculateAssessmentPreview, resultPDFModel, reportAnswer } from '../components/educational-age/results.js';
import { questions, disclosure, text } from '../components/educational-age/content.js';
import { candidateFixtures } from './candidate-fixtures.mjs';

test('shared template report keeps actual age distinct, insufficient-information estimate honest, and private answers out in EN/ES', () => {
  const answers = { age: '50', fullName: '<img src=x onerror=alert(1)>', spiritualityPreference: 'deep', reportContact: { email: 'private@example.test' }, bloodPressureReading: { readingStatus: 'notMeasured', history: 'unknown', systolic: '999' } };
  for (const language of ['en', 'es']) {
    const model = resultPDFModel(calculateAssessmentPreview(answers), answers, language);
    const ui = componentHarness(); const { title } = appendResultReport(ui.root, { document: ui.document, model, language });
    assert.equal(title.textContent, text.resultTitle[language]);
    assert.equal(ui.find(node => node.className === 'age-number').length, 1);
    assert.equal(ui.find(node => node.className === 'age-number')[0].textContent, '50');
    assert.equal(ui.find(node => node.className === 'age-pending')[0].textContent, language === 'es' ? 'No disponible' : 'Not available');
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

test('candidate reports expose completeness and mathematical missing-input range while retaining reading warnings', () => {
  for (const fixture of candidateFixtures) {
    const answers = { ...fixture.answers, bloodPressureReading: { readingStatus: 'measured', history: 'normal', systolic: '210', diastolic: '130' } };
    const result = calculateAssessmentPreview(answers); assert.equal(result.status, 'complete');
    const model = resultPDFModel(result, answers, fixture.language); const ui = componentHarness();
    appendResultReport(ui.root, { document: ui.document, model, language: fixture.language });
    assert.ok(ui.root.textContent.includes(fixture.language === 'es' ? 'Peso de puntuación evaluado: 97%' : 'Scoring weight assessed: 97%'));
    assert.ok(ui.root.textContent.includes(fixture.language === 'es' ? 'no es un intervalo de confianza clínica' : 'not a clinical confidence interval'));
    assert.ok(ui.root.textContent.includes(text.bpSafety[fixture.language]));
    assert.ok(ui.root.textContent.includes(text.glucoseSafety[fixture.language]));
    assert.ok(ui.find(node => node.tagName === 'A' && node.href?.startsWith('https://www.heart.org/')).length);
    assert.ok(model.interpretation.paragraphs.some(copy => copy.includes(String(result.range.minAge)) && copy.includes(String(result.range.maxAge))));
  }
  const malformed = { age: '1e2' };
  const model = resultPDFModel(calculateAssessmentPreview(malformed), malformed, 'en');
  assert.equal(model.actual, undefined); assert.equal(model.estimate, undefined);
});
