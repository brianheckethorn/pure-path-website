import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { snapshotContent } from '../components/wellness-snapshot/content.js';
import { createSnapshotState, buildSnapshot, snapshotEmailText } from '../components/wellness-snapshot/model.js';
import { createMockDeliveryAdapter, previewDelivery } from '../components/wellness-snapshot/delivery.js';
import { homepageFromDesign } from '../scripts/build-home.mjs';

test('eight initially optional questions, separate unanswered gate and consents', () => {
  assert.equal(snapshotContent.questions.length, 8);
  assert.deepEqual(createSnapshotState(), { adult: null, answers: {}, step: 0, resultsVisible: false, email: '', resultEmailConsent: false, mailingListConsent: false, newsletterTopics: [], spiritualSupport: '' });
  for (const question of snapshotContent.questions) {
    assert.equal(question.options.some(option => option.id === 'skip'), true);
    assert.equal(question.options.some(option => option.id === 'unsure'), true);
  }
});

test('blank, skipped, unsure, and no days remain distinct with no grade', () => {
  const snapshot = buildSnapshot(snapshotContent, { fruit: 'skip', vegetables: 'unsure', wholeGrains: 'none' });
  assert.deepEqual(snapshot.cards[0].answers.map(answer => answer.answer), ['Skipped', 'Not sure', 'No days']);
  assert.equal(snapshot.cards[1].answers[0].answer, 'Not answered');
  assert.equal(snapshot.allMissing, false);
  assert.deepEqual(Object.keys(snapshot), ['allMissing', 'cards', 'steps', 'disclaimer']);
  assert.throws(() => buildSnapshot(snapshotContent, { fruit: 'unknown' }), /Unknown answer/);
});

test('all missing can show general tips without assuming no days', () => {
  for (const answers of [{}, Object.fromEntries(snapshotContent.questions.map(question => [question.id, 'skip']))]) {
    const snapshot = buildSnapshot(snapshotContent, answers);
    assert.equal(snapshot.allMissing, true);
    assert.match(snapshotEmailText(snapshot), /You haven't shared any answers/);
    assert.doesNotMatch(snapshotEmailText(snapshot), /No days/);
  }
});

test('food variety, sleep support, and tobacco suggestions follow supplied specification', () => {
  const snapshot = buildSnapshot(snapshotContent, { fruit: 'daily', vegetables: 'daily', rested: 'hardly', tobacco: 'never' });
  assert.match(snapshot.cards[0].guidance, /variety/);
  assert.match(snapshot.cards[2].guidance, /health professional/);
  assert.equal(snapshot.cards[3].guidance, '');
  for (const tobacco of ['most', 'some', 'former']) {
    assert.match(buildSnapshot(snapshotContent, { tobacco }).cards[3].guidance, /health professional/);
  }
  for (const movement of ['none', 'some', 'often', 'most']) {
    const text = buildSnapshot(snapshotContent, { movement, muscles: 'twoPlus' }).cards[1].guidance;
    assert.equal(text, 'Small amounts of movement can help. Choose something you enjoy that feels safe for your body.');
    assert.doesNotMatch(text, /meet|150|guideline|risk|score/i);
  }
});

test('all consent combinations remain independent and newsletter never gets answers', async () => {
  for (const resultEmailConsent of [false, true]) {
    for (const mailingListConsent of [false, true]) {
      const calls = [];
      const adapter = {
        mode: 'mock',
        async requestAddressVerification(payload) { calls.push(['verification', payload]); return { status: 'mock-verification-pending' }; },
        async requestResultEmail(payload) { calls.push(['results', payload]); return { purpose: 'result-email' }; },
        async requestMailingList(payload) { calls.push(['newsletter', payload]); return { purpose: 'mailing-list' }; }
      };
      const request = { adapter, email: 'synthetic@example.test', resultEmailConsent, mailingListConsent, snapshot: 'Synthetic snapshot only.' };
      if (!resultEmailConsent && !mailingListConsent) { await assert.rejects(previewDelivery(request), /Choose an optional/); assert.deepEqual(calls, []); continue; }
      if (resultEmailConsent) {
        const response = await previewDelivery(request);
        assert.equal(response.verification.status, 'mock-verification-pending');
        assert.deepEqual(calls.map(call => call[0]), ['verification']);
        assert.deepEqual(Object.keys(calls[0][1]).sort(), ['consent', 'email']);
        calls.length = 0;
      }
      await previewDelivery({ ...request, verified: true });
      assert.equal(calls.some(call => call[0] === 'results'), resultEmailConsent);
      assert.equal(calls.some(call => call[0] === 'newsletter'), mailingListConsent);
      const newsletter = calls.find(call => call[0] === 'newsletter');
      if (newsletter) assert.deepEqual(newsletter[1], { email: 'synthetic@example.test', consent: true, topics: [] });
    }
  }
});

test('mock rejects malformed email, absent consent, unverified results, and external adapters', async () => {
  const adapter = createMockDeliveryAdapter();
  for (const email of ['', 'broken', 'x@y', 'x y@example.test']) {
    await assert.rejects(previewDelivery({ adapter, email, resultEmailConsent: true, snapshot: 'Synthetic' }), /valid email/);
  }
  await assert.rejects(adapter.requestResultEmail({ email: 'synthetic@example.test', consent: true, snapshot: 'Synthetic' }), /verification/);
  await assert.rejects(adapter.requestMailingList({ email: 'synthetic@example.test', consent: false }), /consent/);
  await assert.rejects(previewDelivery({ adapter: { mode: 'live' }, email: 'synthetic@example.test', resultEmailConsent: true }), /External delivery/);
});

test('assessment has no native form, network submission, storage, or answer URL encoding', () => {
  const paths = ['wellness-snapshot/index.html', 'wellness-snapshot/page.js', 'components/wellness-snapshot/component.js', 'components/wellness-snapshot/model.js', 'components/wellness-snapshot/content.js', 'components/wellness-snapshot/delivery.js'];
  for (const path of paths) {
    const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /<form\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|URLSearchParams|location\.(?:search|hash)\s*=/i, path);
  }
  const page = readFileSync(new URL('../wellness-snapshot/index.html', import.meta.url), 'utf8');
  assert.match(page, /<noscript>/);
  assert.match(page, /assets\/fonts\/fonts\.css/);
  assert.doesNotMatch(page, /<input\b|<button\b/);
});

test('local homepage precisely reproduces generated artboard and links stable route', () => {
  const source = readFileSync(new URL('../Neighbor.dc.html', import.meta.url), 'utf8');
  const home = readFileSync(new URL('../wellness-snapshot-home.html', import.meta.url), 'utf8');
  assert.equal(home, homepageFromDesign(source));
  assert.equal((home.match(/href="\.\/wellness-snapshot\/"/g) || []).length, 2);
  assert.doesNotMatch(home, /Health Age|{{lime}}|<x-dc>/);
  assert.doesNotMatch(home, /fonts\.googleapis/);
  const sample = home.match(/<section id="quiz"[\s\S]*?<\/section>/)[0];
  for (const label of ['No days', '1–3 days', '4–6 days', 'Every day']) assert.ok(sample.includes(label));
  assert.doesNotMatch(sample, /6[-–]7|7[-–]9|hours|Health Age/);
  for (const id of ['story', 'help', 'talk']) {
    const pattern = new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`);
    assert.equal(home.match(pattern)[0], source.match(pattern)[0].replaceAll('{{lime}}', '#B9CF5C'));
  }
});
