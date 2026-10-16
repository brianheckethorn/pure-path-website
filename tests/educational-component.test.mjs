import test from 'node:test';
import assert from 'node:assert/strict';
import { componentHarness } from './dom-harness.mjs';
import { answerAssessmentWithoutDisclosure, finishAssessmentWithExplicitResponses } from './assessment-harness.mjs';
import { questions, text, disclosure } from '../components/educational-age/content.js';
import { mountEducationalAge } from '../components/educational-age/component.js';
import { createMockDeliveryAdapter } from '../components/wellness-snapshot/delivery.js';

const tick = () => new Promise(resolve => setImmediate(resolve));
const question = id => questions.find(q => q.id === id);
const questionIndex = id => questions.findIndex(q => q.id === id);
const title = ui => ui.find(n => n.tagName === 'H2')[0]?.textContent;
const emailChecks = ui => ui.find(n => n.type === 'checkbox' && n.className === 'delivery-consent');
const visibleButton = (ui, copy) => ui.find(n => n.tagName === 'BUTTON' && n.textContent === copy);
function setup(delivery = createMockDeliveryAdapter()) {
  const ui = componentHarness(); ui.languages = [];
  ui.controller = mountEducationalAge(ui.root, { delivery, showDeliveryPreview: true, onLanguage: language => ui.languages.push(language) }); return ui;
}
function field(ui, id) {
  const input = ui.find(n => ['INPUT', 'SELECT'].includes(n.tagName) && n.id?.endsWith(`-${id}`))[0];
  assert.ok(input, `Field available: ${id}`); return input;
}
function enter(ui, id, value) { const input = field(ui, id); input.value = value; input.emit(input.tagName === 'SELECT' ? 'change' : 'input'); }
function respond(ui, current, answers, language = 'en') {
  if (!Object.hasOwn(answers, current.id)) return answerAssessmentWithoutDisclosure(ui, current, language);
  const value = answers[current.id];
  if (current.type === 'number') enter(ui, current.id, value);
  else ui.select(current.options.find(option => option.id === value).label[language]);
}
function finishKnown(ui) {
  const answers = { age: '42', sex: 'female', exercise: 'rarely', sleepQuality: 'poor', stress: 'high' };
  for (const [index, current] of questions.entries()) {
    assert.equal(title(ui), current.prompt.en); respond(ui, current, answers);
    ui.click(text[index === questions.length - 1 ? 'finish' : 'next'].en);
  }
}
function reach(ui, id) {
  for (let index = 0; index < questionIndex(id); index++) { answerAssessmentWithoutDisclosure(ui, questions[index]); ui.click(text.next.en); }
  assert.equal(title(ui), question(id).prompt.en);
}
function blocked(ui, id, language = 'en') {
  assert.equal(title(ui), question(id).prompt[language]);
  assert.ok(ui.find(n => n.className === 'snapshot-error' && n.textContent).length);
  assert.equal(ui.find(n => n.tagName === 'DL').length, 0);
}

test('blank name and age 17 cannot advance; declined and unknown answers can', () => {
  const ui = setup(); assert.equal(field(ui, 'fullName').value, '');
  ui.click(text.next.en); blocked(ui, 'fullName');
  ui.click('Español'); ui.click(text.next.es); blocked(ui, 'fullName', 'es'); assert.match(ui.root.textContent, /nombre|Prefiero/);
  ui.click(text.preferNot.es); ui.click(text.next.es); assert.equal(title(ui), question('age').prompt.es);
  enter(ui, 'age', '17'); ui.click(text.next.es); blocked(ui, 'age', 'es'); assert.match(ui.root.textContent, /18.*100/);
  ui.click('English'); assert.equal(field(ui, 'age').value, '17');
  ui.click(text.unknown.en); ui.click(text.next.en); assert.equal(title(ui), question('sex').prompt.en);
  ui.click(text.next.en); blocked(ui, 'sex'); ui.select(text.unknown.en); ui.click(text.next.en);
  finishAssessmentWithExplicitResponses(ui, 'en', questionIndex('height'));
  assert.ok(ui.root.textContent.includes(text.researchPending.en)); assert.equal(ui.find(n => n.className === 'age-number').length, 0);
});

test('actual age is distinct from pending estimate; language, edit, back and reset preserve intended state', () => {
  const ui = setup(); finishKnown(ui);
  assert.ok(ui.root.textContent.includes(disclosure.en)); assert.ok(ui.root.textContent.includes(text.researchPending.en));
  const comparison = ui.find(n => n.className === 'age-comparison')[0];
  assert.deepEqual(comparison.children.map(card => card.children[0].textContent), [text.actual.en, text.estimate.en]);
  assert.deepEqual(comparison.children.map(card => card.children[1].children[0].textContent), ['42', text.pendingLabel.en]);
  assert.equal(comparison.children[0].children[1].children[1].textContent, text.years.en);
  assert.equal(ui.find(n => n.className === 'age-number').length, 1);
  assert.ok(ui.find(n => n.className === 'comparison-details')[0].textContent.includes(text.researchWhy.en));
  const disclosureNode = ui.find(n => n.className === 'heuristic-disclosure')[0];
  const siblings = comparison.parentNode.children; const disclosureIndex = siblings.indexOf(disclosureNode);
  assert.equal(siblings.indexOf(comparison) + 1, disclosureIndex);
  assert.ok(siblings[disclosureIndex + 1].textContent.includes(text.scoringReview.en));
  assert.equal(ui.document.activeElement.textContent, text.resultTitle.en); assert.equal(ui.document.lastScroll.node, ui.document.activeElement);
  assert.deepEqual(ui.document.lastScroll.options, { block: 'start', behavior: 'auto' });
  assert.equal(ui.find(n => n.className === 'health-next-steps')[0].children.length, 3);
  const preview = ui.find(n => n.tagName === 'PRE' && n.textContent.startsWith(text.resultTitle.en))[0].textContent;
  assert.ok(preview.includes(text.researchPending.en)); assert.equal(preview.split('\n').some(line => line.startsWith(`${text.estimate.en}:`)), false);
  ui.click('Español');
  const cards = ui.find(n => n.className === 'age-comparison')[0].children;
  assert.deepEqual(cards.map(card => card.children[0].textContent), [text.actual.es, text.estimate.es]);
  assert.deepEqual(cards.map(card => card.children[1].children[0].textContent), ['42', text.pendingLabel.es]);
  assert.equal(cards[0].children[1].children[1].textContent, text.years.es);
  assert.ok(ui.root.textContent.includes(disclosure.es)); assert.ok(ui.root.textContent.includes(text.researchPending.es));
  assert.deepEqual(emailChecks(ui).map(n => n.checked), [false, false]);
  ui.click(text.edit.es); assert.equal(title(ui), question('fullName').prompt.es); assert.equal(ui.find(n => n.tagName === 'DL').length, 0);
  ui.click(text.next.es); assert.equal(field(ui, 'age').value, '42');
  ui.click(text.next.es); assert.equal(ui.inputByLabel(question('sex').options.find(option => option.id === 'female').label.es).checked, true);
  ui.click(text.back.es); assert.equal(field(ui, 'age').value, '42');
  ui.click(text.reset.es); assert.equal(title(ui), question('fullName').prompt.es); assert.equal(field(ui, 'fullName').value, ''); assert.equal(ui.languages.at(-1), 'es');
  finishAssessmentWithExplicitResponses(ui, 'es');
  assert.ok(ui.root.textContent.includes(text.researchPending.es)); assert.equal(ui.find(n => n.className === 'age-number').length, 0);
  assert.deepEqual(emailChecks(ui).map(n => n.checked), [false, false]);
});

test('waist and measured blood pressure require complete entries before advancing', () => {
  const ui = setup(); reach(ui, 'waistMeasurement');
  enter(ui, 'value', '32'); ui.click(text.next.en); blocked(ui, 'waistMeasurement');
  enter(ui, 'unit', 'in'); ui.click(text.next.en); assert.equal(title(ui), question('bloodPressureReading').prompt.en);
  ui.click(text.next.en); blocked(ui, 'bloodPressureReading');
  enter(ui, 'readingStatus', 'measured'); enter(ui, 'history', 'unknown'); enter(ui, 'systolic', '120');
  ui.click(text.next.en); blocked(ui, 'bloodPressureReading');
  enter(ui, 'diastolic', '80'); ui.click(text.next.en); assert.equal(title(ui), question('bloodGlucoseReading').prompt.en);
  ui.click(text.back.en); assert.equal(field(ui, 'systolic').value, '120'); assert.equal(field(ui, 'diastolic').value, '80');
});

test('not-measured readings require explicit history and remove stale numeric entries', () => {
  const ui = setup(); reach(ui, 'bloodPressureReading');
  enter(ui, 'readingStatus', 'notMeasured'); ui.click(text.next.en); blocked(ui, 'bloodPressureReading');
  enter(ui, 'history', 'unknown'); ui.click(text.next.en); assert.equal(title(ui), question('bloodGlucoseReading').prompt.en);
  enter(ui, 'readingStatus', 'measured'); enter(ui, 'history', 'borderline'); enter(ui, 'value', '100'); enter(ui, 'timing', 'fasting');
  ui.click(text.next.en); blocked(ui, 'bloodGlucoseReading');
  enter(ui, 'unit', 'mgDl'); enter(ui, 'readingStatus', 'notMeasured');
  assert.equal(ui.find(n => n.id?.endsWith('-value')).length, 0); assert.equal(ui.find(n => n.id?.endsWith('-unit')).length, 0);
  ui.click(text.next.en); assert.equal(title(ui), question('cholesterol').prompt.en);
  ui.click(text.back.en); assert.equal(field(ui, 'history').value, 'borderline');
  enter(ui, 'readingStatus', 'measured'); assert.equal(field(ui, 'value').value, ''); assert.equal(field(ui, 'unit').value, '');
  ui.click(text.next.en); blocked(ui, 'bloodGlucoseReading');
  ui.click(text.unknown.en); ui.click(text.next.en); finishAssessmentWithExplicitResponses(ui, 'en', questionIndex('cholesterol'));
  assert.ok(ui.root.textContent.includes(text.researchPending.en)); assert.equal(ui.find(n => n.className === 'age-number').length, 0);
});

test('delivery consents are independent; newsletter has only email, consent and explicit topics', async () => {
  for (const resultConsent of [false, true]) for (const listConsent of [false, true]) {
    const calls = [];
    const delivery = { mode: 'mock',
      async requestAddressVerification(payload) { calls.push(['verification', payload]); return { status: 'mock-verification-pending' }; },
      async requestResultEmail(payload) { calls.push(['result', payload]); return { purpose: 'result-email' }; },
      async requestMailingList(payload) { calls.push(['list', payload]); return { purpose: 'mailing-list' }; }
    };
    const ui = setup(delivery); finishAssessmentWithExplicitResponses(ui); ui.fillEmail('synthetic@example.test');
    assert.equal(ui.find(n => n.tagName === 'DETAILS' && n.open === true).length, 1);
    if (resultConsent) ui.select(text.resultConsent.en); if (listConsent) ui.select(text.listConsent.en);
    ui.click(text.preview.en); await tick();
    if (!resultConsent && !listConsent) { assert.ok(ui.root.textContent.includes(text.consentError.en)); assert.deepEqual(calls, []); continue; }
    if (resultConsent) {
      assert.deepEqual(calls.map(call => call[0]), ['verification']); assert.deepEqual(calls[0][1], { email: 'synthetic@example.test', consent: true });
      assert.ok(ui.root.textContent.includes(text.neutral.en)); ui.click(text.verifyButton.en); await tick();
    }
    assert.equal(calls.some(call => call[0] === 'result'), resultConsent); assert.equal(calls.some(call => call[0] === 'list'), listConsent);
    const newsletter = calls.find(call => call[0] === 'list');
    if (newsletter) assert.deepEqual(newsletter[1], { email: 'synthetic@example.test', consent: true, topics: [] });
    const report = calls.find(call => call[0] === 'result');
    if (report) {
      assert.deepEqual(Object.keys(report[1]).sort(), ['consent', 'email', 'snapshot', 'verified']);
      assert.ok(report[1].snapshot.includes(text.researchPending.en)); assert.doesNotMatch(report[1].snapshot, /faith|Christ|God|spiritual/i);
    }
    assert.ok(ui.root.textContent.includes(text.mockDone.en));
  }
});

test('invalid email is localized; edit/reset clear email and both consents', async () => {
  const ui = setup(); finishAssessmentWithExplicitResponses(ui); ui.select(text.resultConsent.en); ui.fillEmail('invalid');
  ui.click(text.preview.en); await tick(); assert.ok(ui.root.textContent.includes(text.emailError.en));
  ui.click('Español'); ui.click(text.preview.es); await tick(); assert.ok(ui.root.textContent.includes(text.emailError.es));
  ui.click(text.edit.es); assert.equal(ui.find(n => n.tagName === 'DL').length, 0); finishAssessmentWithExplicitResponses(ui, 'es');
  assert.equal(ui.find(n => n.type === 'email')[0].value, ''); assert.deepEqual(emailChecks(ui).map(n => n.checked), [false, false]);
  ui.fillEmail('synthetic@example.test'); ui.select(text.resultConsent.es); ui.click(text.reset.es); finishAssessmentWithExplicitResponses(ui, 'es');
  assert.equal(ui.find(n => n.type === 'email')[0].value, ''); assert.deepEqual(emailChecks(ui).map(n => n.checked), [false, false]);
});

for (const change of ['address', 'consent', 'topics', 'edit', 'reset']) {
  test(`late verification cannot restore stale delivery after changing ${change}`, async () => {
    let resolveVerification; const calls = [];
    const delivery = { ...createMockDeliveryAdapter(),
      requestAddressVerification(payload) { calls.push(['verification', payload]); return new Promise(resolve => { resolveVerification = resolve; }); },
      async requestResultEmail(payload) { calls.push(['result', payload]); return { purpose: 'result-email' }; }
    };
    const ui = setup(delivery); finishAssessmentWithExplicitResponses(ui); ui.select(text.resultConsent.en);
    ui.fillEmail('synthetic@example.test'); ui.click(text.preview.en); assert.equal(typeof resolveVerification, 'function');
    if (change === 'address') ui.fillEmail('changed@example.test');
    else if (change === 'consent') ui.select(text.resultConsent.en, false);
    else if (change === 'topics') ui.select('Growing closer to God');
    else ui.click(text[change].en);
    resolveVerification({ status: 'mock-verification-pending' }); await tick();
    assert.equal(visibleButton(ui, text.verifyButton.en).length, 0); assert.equal(ui.root.textContent.includes(text.neutral.en), false);
    assert.deepEqual(calls, [['verification', { email: 'synthetic@example.test', consent: true }]]);
    if (change === 'edit' || change === 'reset') {
      assert.equal(title(ui), question('fullName').prompt.en); finishAssessmentWithExplicitResponses(ui);
      assert.equal(ui.find(n => n.type === 'email')[0].value, ''); assert.deepEqual(emailChecks(ui).map(n => n.checked), [false, false]);
    }
    ui.controller.dispose(); assert.equal(ui.root.textContent, '');
  });
}
