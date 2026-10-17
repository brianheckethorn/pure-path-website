import test from 'node:test';
import assert from 'node:assert/strict';
import { createResultPDF, findUnsupportedPDFCharacters } from '../components/result-pdf.js';
import { appendResultTools, canSharePDF, connectionFormURL, downloadResultPDF, printResultText } from '../components/result-tools.js';
import { componentHarness } from './dom-harness.mjs';

const tick = () => new Promise(resolve => setImmediate(resolve));
function setup(navigator = {}) {
  const ui = componentHarness(); const downloads = []; const timers = [];
  const create = ui.document.createElement.bind(ui.document);
  ui.document.createElement = tag => {
    const node = create(tag); node.style = {};
    node.remove = () => { node.removed = true; };
    node.click = () => { downloads.push(node); };
    return node;
  };
  ui.document.body = ui.document.createElement('body');
  ui.document.defaultView = {
    Blob, File, navigator,
    URL: { createObjectURL(blob) { downloads.blob = blob; return 'blob:local-report'; }, revokeObjectURL(url) { downloads.revoked = url; } },
    setTimeout(callback) { timers.push(callback); }
  };
  return { ...ui, downloads, timers };
}

test('PDF has valid cross-reference offsets, page count, local resources and Spanish glyph mappings', () => {
  const pdf = createResultPDF('Mi informe\n\nEdad real: 45 años\n\nSueño, corazón, presión, alimentación. ¿Qué cambiarías? ¡Sí!\n\n' + 'Pregunta\nRespuesta\n\n'.repeat(80), { language: 'es' });
  assert.ok(pdf instanceof Uint8Array);
  const copy = new TextDecoder().decode(pdf);
  assert.match(copy, /^%PDF-1.4/); assert.match(copy, /\/Encoding \/WinAnsiEncoding/); assert.match(copy, /\/Lang \(es\)/);
  for (const [byte, codepoint] of [['F1', '00F1'], ['F3', '00F3'], ['BF', '00BF'], ['A1', '00A1']]) assert.match(copy, new RegExp(`<${byte}> <${codepoint}>`));
  const objects = [...copy.matchAll(/^(\d+) 0 obj$/gm)];
  const rows = copy.split('xref\n')[1].split('trailer')[0].trim().split('\n').slice(2);
  for (const [index, row] of rows.entries()) assert.equal(Number(row.slice(0, 10)), objects[index].index);
  assert.equal(Number(copy.match(/startxref\n(\d+)/)[1]), copy.indexOf('xref\n'));
  assert.ok(Number(copy.match(/\/Type \/Pages \/Count (\d+)/)[1]) > 1);
  assert.doesNotMatch(copy, /\/JavaScript|\/Launch|\/OpenAction|\/URI|\/EmbeddedFile/);
});

test('download PDF is a local application/pdf Blob and releases the object URL', async () => {
  const ui = setup(); const bytes = createResultPDF('Synthetic report');
  downloadResultPDF(ui.document, bytes);
  assert.equal(ui.downloads.blob.type, 'application/pdf');
  assert.deepEqual(new Uint8Array(await ui.downloads.blob.arrayBuffer()), bytes);
  assert.equal(ui.downloads[0].download, 'your-pure-path-results.pdf');
  assert.equal(ui.downloads[0].href, 'blob:local-report'); assert.ok(ui.downloads[0].removed);
  ui.timers[0](); assert.equal(ui.downloads.revoked, 'blob:local-report');
});

test('unsupported symbols are disclosed and cannot corrupt ordinary question marks or Spanish accents', () => {
  const report = '¿Sueño? Sí, mañana. 測 😀';
  assert.deepEqual(findUnsupportedPDFCharacters(report), ['測', '😀']);
  assert.deepEqual(findUnsupportedPDFCharacters('¿Qué? ¡ÁÉÍÓÚÜÑ áéíóúüñ!\nPregunta'), []);
  const pdf = new TextDecoder().decode(createResultPDF(report));
  assert.match(pdf, /<3F> <003F>/); assert.doesNotMatch(pdf, /<3F> <6E2C>/);
  const ui = setup(); appendResultTools(ui.root, { document: ui.document, text: report });
  assert.match(ui.root.textContent, /Some characters are not supported/);
  ui.click('Save PDF'); assert.match(ui.root.textContent, /Use Print report for the original text/);
});

test('unsupported sharing downloads only after click, keeps signup ready immediately and explains attachment', () => {
  const ui = setup(); appendResultTools(ui.root, { document: ui.document, text: 'Synthetic report' });
  assert.equal(ui.downloads.length, 0);
  const link = ui.nodes().find(node => node.href === connectionFormURL);
  assert.ok(link); assert.equal(link.hidden, false); assert.equal(link.referrerPolicy, 'no-referrer');
  assert.equal(link.href, 'https://forms.gle/Zcc9QZbo9N7NTQcj6');
  assert.match(link.className, /result-followup-button/);
  ui.click('Download PDF to attach to email');
  assert.equal(ui.downloads.length, 1); assert.match(ui.root.textContent, /attach it manually/);
  assert.match(ui.root.textContent, /save the PDF and attach it manually in your email app/);
  assert.match(ui.root.textContent, /does not send email or keep a recipient address/);
  assert.equal(link.hidden, false);
});

test('supported sharing sends exactly a local PDF to the device picker on user action, without claiming email delivery', async () => {
  const shares = []; const ui = setup({ canShare: data => data.files[0].type === 'application/pdf', share: data => { shares.push(data); return Promise.resolve(); } });
  appendResultTools(ui.root, { document: ui.document, text: 'Edad real: 45 años', language: 'es' });
  assert.equal(shares.length, 0); assert.equal(ui.downloads.length, 0);
  ui.click('Compartir PDF con mis apps');
  assert.equal(shares.length, 1); assert.equal(shares[0].files.length, 1);
  assert.equal(shares[0].files[0].type, 'application/pdf'); assert.equal(shares[0].files[0].name, 'your-pure-path-results.pdf');
  assert.match(await shares[0].files[0].text(), /^%PDF-1.4/);
  await tick(); assert.match(ui.root.textContent, /no puede confirmar un envío por correo/);
  assert.equal(ui.downloads.length, 0);
});

test('canceled sharing does not download or claim delivery, and failed capability check falls back safely', async () => {
  const ui = setup({ canShare: () => true, share: () => Promise.reject(Object.assign(new Error(), { name: 'AbortError' })) });
  appendResultTools(ui.root, { document: ui.document, text: 'Synthetic report' }); ui.click('Share PDF with my apps'); await tick();
  assert.match(ui.root.textContent, /Sharing was canceled/); assert.equal(ui.downloads.length, 0);
  ui.document.defaultView.navigator.canShare = () => { throw new Error('Unsupported file'); };
  ui.click('Share PDF with my apps'); await tick(); assert.equal(ui.downloads.length, 1);
  assert.equal(canSharePDF(undefined, {}), false);
});

test('printing uses literal local report text and removes its frame after printing', () => {
  const ui = setup(); const report = setup().document; report.documentElement = {}; report.head = report.createElement('head');
  let afterPrint; let printed = false;
  const frame = ui.document.createElement('iframe'); frame.contentDocument = report;
  frame.contentWindow = { addEventListener(type, callback) { assert.equal(type, 'afterprint'); afterPrint = callback; }, focus() {}, print() { printed = true; } };
  ui.document.createElement = () => frame;
  printResultText(ui.document, '<script>never execute</script>\nSueño y presión', 'es');
  assert.equal(report.documentElement.lang, 'es'); assert.ok(printed); assert.equal(frame.removed, undefined);
  assert.equal(report.body.children[1].tagName, 'PRE'); assert.equal(report.body.children[1].textContent, '<script>never execute</script>\nSueño y presión');
  afterPrint(); assert.ok(frame.removed);
});
