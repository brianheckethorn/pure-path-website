import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, sections, text } from '../components/educational-age/content.js';
import { answerText, reportAnswer, calculateAssessmentPreview, resultPDFModel, resultEmailText, readingSources } from '../components/educational-age/results.js';
import { createResultPDF } from '../components/result-pdf.js';
import { appendResultReport } from '../components/result-report.js';
import { componentHarness } from './dom-harness.mjs';
import { candidateFixtures } from './candidate-fixtures.mjs';

const sentinel = 'PRIVATE_IDENTITY_59F3';
const question = id => questions.find(entry => entry.id === id);

function exportedText(result, answers, language) {
  const model = resultPDFModel(result, answers, language);
  const plainText = resultEmailText(result, answers, language);
  const ui = componentHarness();
  appendResultReport(ui.root, { document: ui.document, model, language });
  const pdfSource = new TextDecoder().decode(createResultPDF(plainText, { language, model }));
  const pdfText = [...pdfSource.matchAll(/<([0-9A-F]+)> Tj/g)].map(match => new TextDecoder('windows-1252').decode(Uint8Array.from(match[1].match(/../g), byte => parseInt(byte, 16)))).join('\n');
  return { model, outputs: [JSON.stringify(model), plainText, ui.root.textContent, pdfText] };
}

test('only canonical assessment metadata can select or format report answers', () => {
  for (const language of ['en', 'es']) {
    for (const id of ['fullName', 'reportContact', 'name', 'email', 'phone', 'address', 'zip']) {
      const forged = { id, type: 'text', prompt: { en: sentinel, es: sentinel } };
      assert.equal(answerText(forged, sentinel, language), text.unanswered[language]);
      assert.equal(reportAnswer(forged, { [id]: sentinel }, language), text.unanswered[language]);
    }
    assert.doesNotMatch(answerText({ id: 'age', type: 'text' }, sentinel, language), /PRIVATE_IDENTITY/);
    assert.equal(answerText({ id: 'age', type: 'text' }, '50', language), '50');
    assert.doesNotMatch(answerText({ id: 'waistMeasurement', type: 'group', fields: [{ id: 'email', type: 'text' }] }, { value: '32', unit: 'in', email: sentinel }, language), /PRIVATE_IDENTITY/);
  }
  assert.equal(questions.length, 29);
});

test('malformed numeric values and extra nested identity fields cannot enter any generated export', () => {
  let coercions = 0;
  const coercible = { toString() { coercions++; return sentinel; } };
  const answers = {
    ...candidateFixtures[0].answers,
    age: sentinel, height: sentinel, weight: coercible,
    fullName: sentinel, name: sentinel, email: `${sentinel}@example.test`, phone: sentinel, address: sentinel, zip: sentinel,
    reportContact: { email: `${sentinel}@example.test`, phone: sentinel },
    waistMeasurement: { value: sentinel, unit: sentinel, name: sentinel },
    bloodPressureReading: { readingStatus: 'measured', history: 'normal', systolic: coercible, diastolic: [sentinel], email: sentinel },
    bloodGlucoseReading: { readingStatus: 'measured', history: sentinel, value: sentinel, unit: sentinel, timing: sentinel, address: sentinel },
    exercise: coercible, interests: [sentinel], spiritualityPreference: sentinel
  };
  for (const language of ['en', 'es']) {
    const result = { ...calculateAssessmentPreview(candidateFixtures[0].answers), actualAge: sentinel, quizAge: sentinel, difference: sentinel };
    for (const output of exportedText(result, answers, language).outputs) assert.equal(output.includes(sentinel), false, language);
  }
  assert.equal(coercions, 0, 'report formatting never coerces arbitrary answer objects');
});

test('malformed result strings and unassessed-domain metadata cannot enter generated exports', () => {
  const answers = candidateFixtures[0].answers;
  const goodResult = calculateAssessmentPreview(answers);
  for (const language of ['en', 'es']) {
    for (const result of [
      { ...goodResult, actualAge: sentinel, quizAge: sentinel, difference: sentinel, bmi: sentinel, coverage: { knownWeight: sentinel, totalWeight: 98, percent: sentinel } },
      { ...goodResult, difference: sentinel, habitAreaCount: sentinel, range: { minAge: sentinel, maxAge: sentinel }, unassessed: [{ id: 'water', label: { en: sentinel, es: sentinel }, reason: sentinel, reasonLabel: { en: sentinel, es: sentinel } }, { id: sentinel, label: { en: sentinel, es: sentinel } }] }
    ]) for (const output of exportedText(result, answers, language).outputs) assert.equal(output.includes(sentinel), false, language);
  }
});

test('later question or section mutations do not create identity export fields', () => {
  const age = question('age');
  const glucose = question('bloodGlucoseReading');
  const saved = { prompt: age.prompt.en, type: age.type, section: sections[0].en, fields: glucose.fields };
  try {
    age.prompt.en = sentinel; age.type = 'text'; sections[0].en = sentinel;
    glucose.fields = [...glucose.fields, { id: 'email', type: 'text', label: { en: sentinel, es: sentinel } }];
    questions.push({ id: 'email', type: 'text', section: 0, prompt: { en: sentinel, es: sentinel } });
    const answers = { ...candidateFixtures[0].answers, email: sentinel, bloodGlucoseReading: { ...candidateFixtures[0].answers.bloodGlucoseReading, email: sentinel } };
    for (const output of exportedText(calculateAssessmentPreview(answers), answers, 'en').outputs) assert.equal(output.includes(sentinel), false);
    for (const source of readingSources) assert.equal(Object.isFrozen(source), true);
  } finally {
    age.prompt.en = saved.prompt; age.type = saved.type; sections[0].en = saved.section; glucose.fields = saved.fields;
    questions.pop();
  }
});

test('valid health reading precision, units, age and candidate arithmetic are preserved', () => {
  const answers = {
    ...candidateFixtures[1].answers,
    waistMeasurement: { value: '00081.2800', unit: 'cm' },
    bloodPressureReading: { readingStatus: 'measured', history: 'borderline', systolic: '000120.00', diastolic: '080.000' },
    bloodGlucoseReading: { readingStatus: 'measured', history: 'normal', value: '005.4000', unit: 'mmolL', timing: 'fasting' }
  };
  const result = calculateAssessmentPreview(answers);
  assert.equal(result.score, candidateFixtures[1].expected.score);
  assert.equal(result.quizAge, candidateFixtures[1].expected.quizAge);
  for (const language of ['en', 'es']) {
    const { model, outputs } = exportedText(result, answers, language);
    assert.equal(model.actual.value, 58);
    assert.equal(model.estimate.value, 64);
    for (const output of outputs) {
      for (const value of ['00081.2800', '000120.00', '080.000', '005.4000', 'mmol/L']) assert.ok(output.includes(value), `${language}: ${value}`);
    }
    assert.ok(reportAnswer(question('height'), answers, language).includes('175 cm'));
    assert.ok(reportAnswer(question('weight'), answers, language).includes('92 kg'));
  }
});
