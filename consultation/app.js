import { sections } from './questions.js';
import { createResultPDF, findUnsupportedPDFCharacters } from './pdf.js';
const $ = id => document.getElementById(id);
const fields = [];
function node(tag, text) { const element = document.createElement(tag); if (text !== undefined) element.textContent = text; return element; }
sections.forEach(([title, questions], sectionIndex) => {
  const group = node('fieldset'); group.id = `section-${sectionIndex + 1}`;
  group.append(node('legend', `${sectionIndex + 1}. ${title}`));
  const link = node('a', title); link.href = `#${group.id}`; $('sections').append(link);
  questions.forEach((spec, index) => {
    const [question, options] = Array.isArray(spec) ? spec : [spec];
    const row = node('div'); row.className = 'question';
    const label = node('label', question); const id = `answer-${sectionIndex}-${index}`; label.htmlFor = id;
    const input = node(options ? 'select' : 'textarea'); input.id = id; input.name = id; input.autocomplete = 'off';
    if (options) ['', ...options, 'Unsure', 'Prefer not to answer', 'Not applicable'].forEach(value => { const option = node('option', value || 'Unanswered — choose if you wish'); option.value = value; input.append(option); });
    else { input.rows = 2; input.spellcheck = false; }
    row.append(label, input); group.append(row); fields.push({ title, question, input });
  });
  $('questionnaire').append(group);
});
$('questionnaire').addEventListener('submit', event => event.preventDefault());
const answer = field => field.input.value.trim() || 'Unanswered';
function renderReview() {
  $('notes').replaceChildren();
  for (const [title] of sections) {
    const section = node('section'); section.append(node('h3', title));
    fields.filter(field => field.title === title).forEach(field => { const question = node('p', field.question); question.className = 'note-question'; const copy = node('p', answer(field)); copy.className = 'answer'; section.append(question, copy); });
    $('notes').append(section);
  }
}
function textReport() {
  return ['Prepare for Your Consultation\n', 'Personal consultation notes for a conversation with Mario. Not a diagnosis or an urgent contact channel.', 'Answers stay only in this page’s browser memory and are not sent to or retained by this website. Downloaded and printed copies remain under your control. Share only if you choose.', ...sections.flatMap(([title]) => ['\n' + title, ...fields.filter(field => field.title === title).map(field => `${field.question}\n${answer(field)}\n`)])].join('\n');
}
function download(content, type, filename) {
  const url = URL.createObjectURL(new Blob([content], { type })); const link = node('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('review').onclick = () => { renderReview(); $('editor').hidden = true; $('review-panel').hidden = false; $('export-status').textContent = ''; $('review-heading').focus(); };
$('edit').onclick = () => { $('review-panel').hidden = true; $('notes').replaceChildren(); $('editor').hidden = false; $('review').focus(); };
$('text').onclick = () => { download(textReport(), 'text/plain;charset=utf-8', 'your-pure-path-consultation.txt'); $('export-status').textContent = 'Plain-text download prepared locally.'; };
$('pdf').onclick = () => {
  const text = textReport();
  if (findUnsupportedPDFCharacters(text).length) { $('export-status').textContent = 'The PDF font cannot preserve some characters in your answers. Please use Print (and Save as PDF) or Download plain text to keep every character.'; return; }
  try { download(createResultPDF(text), 'application/pdf', 'your-pure-path-consultation.pdf'); $('export-status').textContent = 'PDF download prepared locally. You choose whether to share it.'; }
  catch { $('export-status').textContent = 'PDF could not be prepared. Please use Print or Download plain text.'; }
};
$('print').onclick = () => { renderReview(); window.print(); };
// Also prepare current notes for the browser's own Print command.
window.addEventListener('beforeprint', renderReview);
$('reset').onclick = () => $('reset-dialog').showModal();
$('cancel-reset').onclick = () => $('reset-dialog').close();
$('confirm-reset').onclick = () => { $('questionnaire').reset(); $('notes').replaceChildren(); $('review-panel').hidden = true; $('editor').hidden = false; $('export-status').textContent = ''; $('reset-dialog').close(); $('status').textContent = 'All answers cleared.'; $('review').focus(); };
// Avoid retaining answers when navigating back through the browser page cache.
window.addEventListener('pagehide', () => { $('questionnaire').reset(); $('notes').replaceChildren(); });
window.addEventListener('pageshow', event => { if (event.persisted) { $('questionnaire').reset(); $('notes').replaceChildren(); $('review-panel').hidden = true; $('editor').hidden = false; } });
