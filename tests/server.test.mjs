import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createPreviewServer } from '../scripts/serve.mjs';

test('local server serves homepage, direct route, modules, fonts and trailing-slash redirect', async () => {
  const server = createPreviewServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [route, contentType, sample] of [
      ['/', 'text/html', 'Health Age Assessment'],
      ['/wellness-snapshot/', 'text/html', 'Continue to the Health Age Assessment'],
      ['/health-age-assessment/', 'text/html', 'scoring model uses custom educational choices'],
      ['/health-age-assessment/page.js', 'text/javascript', 'mountEducationalAge'],
      ['/components/educational-age/scoring.js', 'text/javascript', 'calculateIllustrativeAge'],
      ['/wellness-snapshot/page.js', 'text/javascript', 'location.replace'],
      ['/components/wellness-snapshot/snapshot.css', 'text/css', '#26301A'],
      ['/assets/fonts/fonts.css', 'text/css', 'Karla'],
      ['/assets/fonts/karla-regular.ttf', 'font/ttf', null]
    ]) {
      const response = await fetch(`${base}${route}`);
      assert.equal(response.status, 200, route);
      assert.match(response.headers.get('content-type'), new RegExp(contentType));
      const bytes = await response.arrayBuffer();
      assert.ok(bytes.byteLength > 0);
      if (sample) assert.match(new TextDecoder().decode(bytes), new RegExp(sample));
    }
    const redirect = await fetch(`${base}/wellness-snapshot`, { redirect: 'manual' });
    assert.equal(redirect.status, 308); assert.equal(redirect.headers.get('location'), '/wellness-snapshot/'); await redirect.text();
    const newRedirect = await fetch(`${base}/health-age-assessment`, { redirect: 'manual' });
    assert.equal(newRedirect.status, 308); assert.equal(newRedirect.headers.get('location'), '/health-age-assessment/'); await newRedirect.text();
    const traversal = await fetch(`${base}/..%2f..%2foutside-synthetic-file`); assert.equal(traversal.status, 404); await traversal.text();
    const absent = await fetch(`${base}/unknown-synthetic-route`); assert.equal(absent.status, 404); await absent.text();
    const submission = await fetch(`${base}/wellness-snapshot/`, { method: 'POST', body: 'synthetic-test-only' }); assert.equal(submission.status, 405); await submission.text();
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
