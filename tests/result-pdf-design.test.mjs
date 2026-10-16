import test from 'node:test';
import assert from 'node:assert/strict';
import { createResultPDF } from '../components/result-pdf.js';
import { reportPortrait } from '../components/report-portrait.js';

function reportText(pdf) {
  const source = new TextDecoder().decode(pdf);
  const decode = new TextDecoder('windows-1252');
  return [...source.matchAll(/<([0-9A-F]+)> Tj/g)].map(match => decode.decode(Uint8Array.from(match[1].match(/../g), byte => parseInt(byte, 16)))).join('\n');
}
const normalize = copy => copy.replace(/\s/g, '').replace(/[\u2010-\u2015\u2212]/g, '-');
function fixture() {
  return {
    title: 'Tus resultados de edad de salud',
    actual: { label: 'Tu edad real', value: 42, unit: 'años' },
    estimate: { label: 'Tu edad de salud aproximada', value: 32, unit: 'años' },
    disclosure: 'Estimación educativa aproximada. No está validada científicamente. No mide la edad biológica.',
    recommendations: { title: 'Pequeños pasos según tus respuestas', intro: 'Elige pasos según tu plan de atención.', items: ['Añade una verdura que disfrutes.', 'Mantén una rutina cómoda de movimiento.'] },
    readingContext: ['Las lecturas no se evalúan clínicamente aquí.', 'No retrases la atención por una estimación favorable.', 'Fuente de referencia: https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis'],
    interpretation: { title: 'Cómo interpretar esta estimación', paragraphs: ['El número refleja los pesos elegidos para este cuestionario.', 'IMC: 22.6'] },
    answerGroups: [{ title: 'Sobre ti', answers: [{ question: '¿Cuál es tu estatura?', answer: '66 pulgadas' }, { question: '¿Qué nombre quieres en el informe?', answer: 'Érica Ejemplo - persona ficticia' }] }, { title: 'Movimiento y sueño', answers: [{ question: '¿Cómo describirías tu sueño?', answer: 'Excelente' }] }]
  };
}

test('structured PDF keeps every supplied report field, accented text, two age cards and grouped answers', () => {
  const model = fixture(); const pdf = createResultPDF('Fallback unused', { language: 'es', model });
  const copy = new TextDecoder().decode(pdf); const rendered = normalize(reportText(pdf));
  const required = [model.title, `${model.actual.label}: 42 años`, `${model.estimate.label}: 32 años`, model.disclosure,
    model.recommendations.title, model.recommendations.intro, ...model.recommendations.items, ...model.readingContext,
    model.interpretation.title, ...model.interpretation.paragraphs,
    ...model.answerGroups.flatMap(group => [group.title, ...group.answers.flatMap(answer => [answer.question, answer.answer])])];
  for (const field of required) assert.ok(rendered.includes(normalize(field)), field);
  assert.equal([...copy.matchAll(/\/F3 43 Tf/g)].length, 2);
  assert.match(copy, /\/BaseFont \/DMSerifDisplay-Regular/);
  assert.equal([...copy.matchAll(/\/FontFile2 /g)].length, 3);
  assert.doesNotMatch(reportText(pdf), /Fallback unused/);
  assert.doesNotMatch(copy, /\/JavaScript|\/OpenAction|\/URI|\/EmbeddedFile/);
});

test('incomplete reports show their supplied explanation without invented ages or numeric cards', () => {
  const model = { title: 'Your Health Age Results', notice: 'No numeric estimate is shown. Scoring answers are missing.', disclosure: 'Rough educational estimate. Not validated.', recommendations: { title: 'A small step', items: ['Choose a question to discuss.'] } };
  const pdf = createResultPDF('', { model }); const copy = new TextDecoder().decode(pdf);
  assert.match(reportText(pdf), /No numeric estimate is shown/);
  assert.doesNotMatch(copy, /\/F3 43 Tf/);
  assert.doesNotMatch(reportText(pdf), /actual age:|estimate: \d/);
});

test('a known actual age with research pending gets a clearly labeled pending card and no invented estimate', () => {
  const model = { title: 'Your Health Age Results', actual: { label: 'Your actual age', value: 42, unit: 'years' }, estimatePending: true, notice: 'Scoring is under review; no estimate has been calculated.' };
  const pdf = createResultPDF('', { model }); const copy = new TextDecoder().decode(pdf); const extracted = reportText(pdf);
  assert.match(extracted, /Pending review/); assert.match(extracted, /42/); assert.match(extracted, /no estimate has been calculated/);
  assert.equal([...copy.matchAll(/\/F3 43 Tf/g)].length, 1);
  assert.doesNotMatch(extracted, /undefined|NaN|32/);
});

test('long free text and long notices paginate within print margins without losing final content', () => {
  const model = fixture();
  model.notice = 'Long fictional notice. '.repeat(170);
  model.recommendations.items = ['Long fictional guidance. '.repeat(160)];
  model.answerGroups[0].answers.push({ question: 'Long answer', answer: 'Invented answer content. '.repeat(200) + 'FINAL ANSWER TOKEN' });
  const pdf = createResultPDF('', { model }); const copy = new TextDecoder().decode(pdf);
  assert.ok(normalize(reportText(pdf)).includes('FINALANSWERTOKEN'));
  assert.ok(Number(copy.match(/\/Type \/Pages \/Count (\d+)/)[1]) > 5);
  for (const match of copy.matchAll(/1 0 0 1 [\d.]+ ([\d.-]+) Tm/g)) assert.ok(Number(match[1]) >= 27 && Number(match[1]) <= 760, match[0]);
});

test('text-only Wellness Snapshot fallback preserves title, answers, source URLs and disclaimer', () => {
  const source = 'Your Wellness Snapshot\n\nOne small step\n\nFood\nA vegetable each day\n\nSource: https://example.test/source\n\nEducational information only.';
  const pdf = createResultPDF(source); const extracted = normalize(reportText(pdf));
  assert.ok(extracted.includes(normalize(source)));
});

test('authorized portrait is embedded as a local JPEG with literal invitation text and no external image URL', () => {
  const model = fixture(); model.portrait = reportPortrait; model.portraitCopy = 'Talk with Mario about your goals and questions.';
  const pdf = createResultPDF('', { model }); const copy = new TextDecoder().decode(pdf);
  assert.match(copy, /\/Subtype \/Image \/Width 640 \/Height 640/);
  assert.match(copy, /\/Filter \[\/ASCIIHexDecode \/DCTDecode\]/);
  assert.match(copy, /\/Portrait Do/);
  assert.match(reportText(pdf), /Talk with Mario about your goals and questions/);
  assert.doesNotMatch(copy, /mario-portrait\.jpg|\/URI|\/Launch/);
});

test('grouped recommendations keep three priorities, every additional lifestyle tip, and separate care topics without duplicate legacy items', () => {
  const model = fixture();
  const primary = ['Try a vegetable at lunch.', 'Choose a comfortable movement break.', 'Keep a regular wake-up cue.'];
  const additional = ['Choose a whole-grain food.', 'Plan a breakfast you enjoy.', 'Consider an unsweetened drink.', 'Explore a small calming routine.', 'Talk with someone you trust.'];
  const care = ['Bring your history questions to your care team.', 'Discuss persistent changes in energy with your care team.'];
  model.recommendations = { title: 'Your next steps', primaryTitle: 'Three practical priorities', additionalTitle: 'Additional relevant lifestyle ideas', careTitle: 'Care discussion topics', primary, additional, care, items: [...primary, ...additional, ...care] };
  const pdf = createResultPDF('', { model }); const rendered = normalize(reportText(pdf));
  for (const text of [...primary, ...additional, ...care]) {
    assert.equal(rendered.split(normalize(text)).length - 1, 1, text);
  }
  for (const title of ['Three practical priorities', 'Additional relevant lifestyle ideas', 'Care discussion topics']) assert.ok(rendered.includes(normalize(title)), title);
  assert.ok(rendered.indexOf(normalize(primary[0])) < rendered.indexOf(normalize(additional[0])));
  assert.ok(rendered.indexOf(normalize(additional[0])) < rendered.indexOf(normalize(care[0])));
  const safetyPosition = rendered.indexOf(normalize(model.readingContext[0]));
  assert.ok(rendered.indexOf(normalize(primary[0])) < safetyPosition);
  assert.ok(safetyPosition < rendered.indexOf(normalize(additional[0])));
});

test('grouped priorities flow into reading guidance while keeping the heading with its first box', () => {
  const model = {
    title: 'Your Health Age Results',
    recommendations: { title: 'Your next steps', primary: ['First priority.', 'Second priority.', 'Third priority.'], additional: [], care: [] },
    readingContext: ['FIRST GUIDANCE BOX: readings are not clinically assessed here.']
  };
  const pdf = createResultPDF('', { model });
  const streams = [...new TextDecoder().decode(pdf).matchAll(/stream\n([\s\S]*?)endstream/g)]
    .map(match => reportText(new TextEncoder().encode(match[1]))).filter(text => text.includes('Your Pure Path'));
  const primaryPage = streams.findIndex(text => text.includes('Third priority.'));
  const guidancePage = streams.findIndex(text => normalize(text).includes(normalize('FIRST GUIDANCE BOX')));
  assert.equal(guidancePage, primaryPage, 'short primary tips must not force a nearly blank page before guidance');
  assert.ok(normalize(streams[guidancePage]).includes(normalize('About the readings you shared')));
});
