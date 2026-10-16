import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { once } from 'node:events';
import { createPreviewServer } from '../scripts/serve.mjs';

const html = readFileSync(new URL('../wellness-snapshot/index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../wellness-snapshot/page.js', import.meta.url), 'utf8');

test('old Snapshot page redirects without JavaScript and retains an always-visible fallback link', () => {
  assert.match(html, /<meta http-equiv="refresh" content="0; url=\.\.\/health-age-assessment\/">/);
  assert.match(html, /<link rel="canonical" href="\.\.\/health-age-assessment\/">/);
  const noScriptHTML = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  assert.match(noScriptHTML, /<a[^>]+href="\.\.\/health-age-assessment\/"[^>]*>Continue to the Health Age Assessment<\/a>/);
  assert.doesNotMatch(noScriptHTML, /<noscript[\s\S]*Continue to the Health Age Assessment[\s\S]*<\/noscript>/i);
  assert.doesNotMatch(html, /<form\b|<input\b|<button\b|Answer 8|8 simple questions|No email needed|Results without email/i);
});

test('redirect replaces history and never forwards query/hash or mounts a second assessment', () => {
  for (const [origin, expected] of [
    ['https://yourpurepath.com/wellness-snapshot/?private=synthetic#old-results', 'https://yourpurepath.com/health-age-assessment/'],
    ['http://localhost:4173/docs/wellness-snapshot/index.html?private=synthetic#old-results', 'http://localhost:4173/docs/health-age-assessment/']
  ]) {
    const calls = [];
    const window = { location: { href: origin, replace: value => calls.push(value) } };
    vm.runInNewContext(script, { window, URL });
    assert.deepEqual(calls, [expected]);
    assert.equal(new URL(calls[0]).origin, new URL(origin).origin);
    assert.equal(new URL(calls[0]).search, '');
    assert.equal(new URL(calls[0]).hash, '');
  }
  assert.doesNotMatch(script, /\bimport\b|mountWellnessSnapshot|createMockDeliveryAdapter|fetch\(|localStorage|sessionStorage|sendBeacon|URLSearchParams/);
});

test('legacy route and module still serve as bookmarks, while non-slash legacy route retains normalization', async () => {
  const server = createPreviewServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(`${base}/wellness-snapshot/`);
    assert.equal(page.status, 200); assert.equal(await page.text(), html);
    const module = await fetch(`${base}/wellness-snapshot/page.js`);
    assert.equal(module.status, 200); assert.equal(await module.text(), script);
    const normalization = await fetch(`${base}/wellness-snapshot`, { redirect: 'manual' });
    assert.equal(normalization.status, 308); assert.equal(normalization.headers.get('location'), '/wellness-snapshot/'); await normalization.text();
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
