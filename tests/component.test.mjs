import test from 'node:test';
import assert from 'node:assert/strict';
import { mountWellnessSnapshot } from '../components/wellness-snapshot/component.js';
import { snapshotContent } from '../components/wellness-snapshot/content.js';
import { createMockDeliveryAdapter } from '../components/wellness-snapshot/delivery.js';
import { componentHarness } from './dom-harness.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
const resultConsent = 'Yes, email this snapshot to me.';
const listConsent = 'Yes, send me wellness tips and news from Your Pure Path. I can unsubscribe at any time.';
function setup(delivery = createMockDeliveryAdapter()) {
  const ui = componentHarness();
  ui.controller = mountWellnessSnapshot(ui.root, { content: snapshotContent, delivery });
  return ui;
}
function start(ui) { ui.select('Yes'); ui.click('Start my snapshot'); }
function finish(ui) { for (let index = 0; index < 7; index++) ui.click('Next'); ui.click('See my snapshot'); }

test('adult gate starts unselected, blocks blank/no, then allows synthetic adult response', () => {
  const ui = setup();
  assert.equal(ui.nodes().some(node => node.checked), false);
  ui.click('Start my snapshot'); assert.match(ui.root.textContent, /Choose Yes or No/);
  ui.select('No'); ui.click('Start my snapshot'); assert.match(ui.root.textContent, /for adults 18 and older/);
  assert.doesNotMatch(ui.root.textContent, /Question 1 of/);
  start(ui); assert.match(ui.root.textContent, /Question 1 of 8/);
  assert.equal(ui.nodes().some(node => node.checked), false);
  assert.equal(ui.document.activeElement.tagName, 'H2');
});

test('back, explicit skip, clear, and edit preserve intended answers without defaults', () => {
  const ui = setup(); start(ui);
  ui.select('Every day'); ui.click('Next'); ui.select('Skip'); ui.click('Back');
  assert.equal(ui.inputByLabel('Every day').checked, true);
  ui.click('Next'); assert.equal(ui.inputByLabel('Skip').checked, true);
  ui.click('Clear this answer'); assert.equal(ui.nodes().some(node => node.checked), false);
  ui.select('Not sure');
  for (let index = 1; index < 7; index++) ui.click('Next');
  ui.select('I have never done either'); ui.click('See my snapshot');
  assert.match(ui.root.textContent, /Food/); assert.match(ui.root.textContent, /Not sure/);
  assert.doesNotMatch(ui.root.textContent, /support for quitting/);
  ui.click('Edit my answers'); assert.equal(ui.inputByLabel('Every day').checked, true);
  ui.click('Next'); assert.equal(ui.inputByLabel('Not sure').checked, true);
});

test('all blanks show results without email and start over clears answers and both consents', () => {
  const ui = setup(); start(ui); finish(ui);
  assert.match(ui.root.textContent, /You haven't shared any answers/);
  assert.equal(ui.inputByLabel(resultConsent).checked, false);
  assert.equal(ui.inputByLabel(listConsent).checked, false);
  assert.equal(ui.nodes().find(node => node.tagName === 'DETAILS').open, true);
  ui.fillEmail('synthetic@example.test'); ui.select(resultConsent); ui.select(listConsent);
  ui.click('Start over'); assert.equal(ui.nodes().some(node => node.checked), false);
  start(ui); finish(ui);
  assert.equal(ui.inputByLabel(resultConsent).checked, false);
  assert.equal(ui.inputByLabel(listConsent).checked, false);
  assert.equal(ui.nodes().find(node => node.type === 'email').value, '');
});

test('component rejects no consent and invalid email, then independently previews newsletter', async () => {
  const ui = setup(); start(ui); finish(ui);
  ui.click('Preview my email choices'); await tick(); assert.match(ui.root.textContent, /Choose an optional email purpose/);
  ui.select(listConsent); ui.fillEmail('invalid');
  ui.click('Preview my email choices'); await tick(); assert.match(ui.root.textContent, /valid email/);
  ui.fillEmail('synthetic@example.test'); ui.click('Preview my email choices'); await tick();
  assert.match(ui.root.textContent, /Not sent\. Mock preview completed for: mailing-list request/);
  assert.equal(ui.inputByLabel(resultConsent).checked, false);
});

test('snapshot mock requires neutral verification, changed address resets it, then simulates only chosen purpose', async () => {
  const ui = setup(); start(ui); finish(ui);
  ui.select(resultConsent); ui.fillEmail('synthetic@example.test'); ui.click('Preview my email choices'); await tick();
  assert.match(ui.root.textContent, /Not sent\. Neutral address-verification preview/);
  ui.fillEmail('second-synthetic@example.test');
  assert.equal(ui.find(node => node.tagName === 'BUTTON' && node.textContent === 'Simulate verified address and preview delivery').length, 0);
  ui.click('Preview my email choices'); await tick();
  ui.click('Simulate verified address and preview delivery'); await tick();
  assert.match(ui.root.textContent, /Not sent\. Mock preview completed for: snapshot email/);
  assert.equal(ui.inputByLabel(listConsent).checked, false);
  ui.click('Edit my answers'); finish(ui);
  assert.equal(ui.inputByLabel(resultConsent).checked, false);
  assert.equal(ui.inputByLabel(listConsent).checked, false);
});

test('late mock response cannot repopulate reset state', async () => {
  let resolveVerification;
  const adapter = { ...createMockDeliveryAdapter(), requestAddressVerification() { return new Promise(resolve => { resolveVerification = resolve; }); } };
  const ui = setup(adapter); start(ui); finish(ui);
  ui.select(resultConsent); ui.fillEmail('synthetic@example.test'); ui.click('Preview my email choices');
  ui.click('Start over'); resolveVerification({ status: 'mock-verification-pending', message: 'Neutral synthetic message' }); await tick();
  assert.match(ui.root.textContent, /Ready to take a moment/);
  assert.doesNotMatch(ui.root.textContent, /synthetic|Neutral synthetic|Wellness Snapshot/);
  ui.controller.dispose(); assert.equal(ui.root.textContent, '');
});
