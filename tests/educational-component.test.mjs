import test from 'node:test';
import assert from 'node:assert/strict';
import { componentHarness } from './dom-harness.mjs';
import { questions, text, disclosure } from '../components/educational-age/content.js';
import { mountEducationalAge } from '../components/educational-age/component.js';
import { createMockDeliveryAdapter } from '../components/wellness-snapshot/delivery.js';
import { scoringMaps } from '../components/educational-age/scoring.js';

const tick = () => new Promise(resolve => setImmediate(resolve));
function setup(delivery = createMockDeliveryAdapter()) {
  const ui = componentHarness(); ui.languages = [];
  ui.controller = mountEducationalAge(ui.root, { delivery, showDeliveryPreview: true, onLanguage: language => ui.languages.push(language) });
  return ui;
}
function fillNumber(ui, value) { const input = ui.find(node => node.tagName === 'INPUT' && node.type === 'number')[0]; input.value = value; input.emit('input'); }
function fillAll(ui, overrides = {}) {
  const answers = { age: '42', height: '66', weight: '140', sex: 'female', ...Object.fromEntries(Object.entries(scoringMaps).map(([id, map]) => [id, Object.entries(map).sort((a,b) => b[1]-a[1])[0][0]])), ...overrides };
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index]; const value = answers[question.id];
    if (value !== undefined) {
      if (question.type === 'number') fillNumber(ui, value);
      else ui.select(value === 'unknown' ? text.unknown.en : value === 'skip' ? text.skip.en : question.options.find(option => option.id === value).label.en);
    }
    ui.click(index === 21 ? text.finish.en : text.next.en);
  }
}
function allBlank(ui, language = 'en') { for (let index = 0; index < 21; index++) ui.click(text.next[language]); ui.click(text.finish[language]); }
const emailChecks = ui => ui.find(node => node.tagName === 'INPUT' && node.type === 'checkbox' && node.className === 'delivery-consent');

test('new component starts blank, withholds missing number, and translates missing validation without calculation', () => {
  const ui = setup(); assert.equal(ui.find(node => node.type === 'number')[0].value, '');
  allBlank(ui); assert.match(ui.root.textContent, /No numeric estimate is shown/); assert.equal(ui.find(node => node.tagName === 'DL').length, 0);
  ui.click(questions[0].prompt.en); assert.match(ui.root.textContent, /Enter a number/);
  ui.click('Español'); assert.match(ui.root.textContent, /Escribe un número/); assert.equal(ui.find(node => node.tagName === 'DL').length, 0);
  assert.equal(ui.find(node => node.type === 'number')[0].value, '');
  ui.click('English'); fillNumber(ui, '17');
  for (let index = 0; index < 21; index++) ui.click(text.next.en); ui.click(text.finish.en);
  ui.click(questions[0].prompt.en); assert.match(ui.root.textContent, /Use the original input range/);
  ui.click('Español'); assert.match(ui.root.textContent, /Usa el rango original/);
});
test('complete result has adjacent exact disclaimer, edit/language keeps question view, back preserves answers', () => {
  const ui = setup(); fillAll(ui);
  assert.ok(ui.root.textContent.includes(disclosure.en)); assert.match(ui.root.textContent, /32 years/);
  const disclosureIndex = ui.root.children.findIndex(node => node.className === 'heuristic-disclosure');
  const resultIndex = ui.root.children.findIndex(node => node.tagName === 'DL'); assert.equal(disclosureIndex, resultIndex + 1);
  const comparison = ui.root.children[resultIndex]; assert.equal(comparison.children.length, 2);
  assert.deepEqual(comparison.children.map(card => card.children[0].textContent), [text.actual.en, text.estimate.en]);
  assert.deepEqual(comparison.children.map(card => card.children[1].textContent), ['42 years', '32 years']);
  assert.equal(ui.root.children[disclosureIndex + 1].textContent, text.suggestions.en);
  assert.equal(ui.document.activeElement.textContent, text.resultTitle.en);
  assert.equal(ui.document.lastScroll.node, ui.document.activeElement);
  assert.deepEqual(ui.document.lastScroll.options, { block: 'start', behavior: 'auto' });
  const steps = ui.find(node => node.className === 'health-next-steps')[0]; assert.equal(steps.children.length, 3);
  ui.click('Español');
  const spanishCards = ui.find(node => node.tagName === 'DL')[0].children;
  assert.deepEqual(spanishCards.map(card => card.children[0].textContent), [text.actual.es, text.estimate.es]);
  assert.deepEqual(spanishCards.map(card => card.children[1].textContent), ['42 años', '32 años']);
  assert.ok(ui.root.textContent.includes(disclosure.es)); ui.click('English');
  assert.deepEqual(emailChecks(ui).map(node => node.checked), [false, false]);
  ui.click(text.edit.en); ui.click('Español'); assert.match(ui.root.textContent, /¿Cuántos años tienes/); assert.equal(ui.find(node => node.tagName === 'DL').length, 0);
  assert.equal(ui.find(node => node.type === 'number')[0].value, '42');
  ui.click(text.next.es); assert.equal(ui.inputByLabel('Femenino').checked, true);
  ui.click(text.back.es); assert.equal(ui.find(node => node.type === 'number')[0].value, '42');
  ui.click(text.reset.es); assert.equal(ui.find(node => node.type === 'number')[0].value, ''); assert.equal(ui.languages.at(-1), 'es');
  allBlank(ui, 'es'); assert.match(ui.root.textContent, /No se muestra una estimación numérica/);
  assert.deepEqual(emailChecks(ui).map(node => node.checked), [false, false]);
});
test('clinical unknown is separate from borderline and cannot produce a number', () => {
  for (const id of ['bloodPressure', 'bloodSugar', 'cholesterol']) {
    const ui = setup(); fillAll(ui, { [id]: 'unknown' });
    assert.match(ui.root.textContent, /No numeric estimate is shown/); assert.equal(ui.find(node => node.tagName === 'DL').length, 0);
  }
});
test('new component consent combinations are independent; newsletter has email, consent, and explicit topics only', async () => {
  for (const resultConsent of [false, true]) for (const listConsent of [false, true]) {
    const calls = [];
    const delivery = {
      mode: 'mock',
      async requestAddressVerification(payload) { calls.push(['verification', payload]); return { status: 'mock-verification-pending' }; },
      async requestResultEmail(payload) { calls.push(['result', payload]); return { purpose: 'result-email' }; },
      async requestMailingList(payload) { calls.push(['list', payload]); return { purpose: 'mailing-list' }; }
    };
    const ui = setup(delivery); fillAll(ui); ui.fillEmail('synthetic@example.test');
    assert.equal(ui.find(node => node.tagName === 'DETAILS' && node.open === true).length, 1);
    if (resultConsent) ui.select(text.resultConsent.en);
    if (listConsent) ui.select(text.listConsent.en);
    ui.click(text.preview.en); await tick();
    if (!resultConsent && !listConsent) { assert.match(ui.root.textContent, /Choose an optional email purpose/); assert.deepEqual(calls, []); continue; }
    if (resultConsent) {
      assert.deepEqual(calls.map(call => call[0]), ['verification']);
      assert.deepEqual(Object.keys(calls[0][1]).sort(), ['consent', 'email']);
      assert.match(ui.root.textContent, /Not sent\. A neutral verification/);
      ui.click(text.verifyButton.en); await tick();
    }
    assert.equal(calls.some(call => call[0] === 'result'), resultConsent);
    assert.equal(calls.some(call => call[0] === 'list'), listConsent);
    const newsletter = calls.find(call => call[0] === 'list');
    if (newsletter) assert.deepEqual(newsletter[1], { email: 'synthetic@example.test', consent: true, topics: [] });
    assert.match(ui.root.textContent, /No email or subscription was created/);
  }
});
test('bad email error is localized; reset and edit clear email and consent without stale delivery', async () => {
  const ui = setup(); fillAll(ui); ui.select(text.resultConsent.en); ui.fillEmail('invalid');
  ui.click(text.preview.en); await tick(); assert.match(ui.root.textContent, /valid email/);
  ui.click('Español'); ui.click(text.preview.es); await tick(); assert.match(ui.root.textContent, /correo válida/);
  ui.click(text.edit.es); assert.equal(ui.find(node => node.tagName === 'DL').length, 0); ui.click(text.reset.es);
  allBlank(ui, 'es'); assert.equal(ui.find(node => node.type === 'email')[0].value, ''); assert.deepEqual(emailChecks(ui).map(node => node.checked), [false, false]);
});
test('reset cancels late verification preview without recreating answers or results', async () => {
  let resolveVerification;
  const delivery = { ...createMockDeliveryAdapter(), requestAddressVerification() { return new Promise(resolve => { resolveVerification = resolve; }); } };
  const ui = setup(delivery); fillAll(ui); ui.select(text.resultConsent.en); ui.fillEmail('synthetic@example.test'); ui.click(text.preview.en);
  ui.click(text.reset.en); resolveVerification({ status: 'mock-verification-pending' }); await tick();
  assert.equal(ui.find(node => node.type === 'number')[0].value, ''); assert.doesNotMatch(ui.root.textContent, /neutral verification|synthetic/);
  ui.controller.dispose(); assert.equal(ui.root.textContent, '');
});
