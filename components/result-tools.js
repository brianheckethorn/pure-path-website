export const connectionFormURL = 'https://forms.gle/Zcc9QZbo9N7NTQcj6';
export function downloadResultText(document, text, filename) {
  const view = document.defaultView;
  const url = view.URL.createObjectURL(new view.Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  view.setTimeout(() => view.URL.revokeObjectURL(url), 1000);
}
export function appendResultTools(parent, { document, text, language = 'en', onDownload }) {
  const section = document.createElement('section'); section.className = 'result-tools';
  const row = document.createElement('div'); row.className = 'snapshot-actions';
  const download = document.createElement('button'); download.type = 'button';
  download.textContent = language === 'es' ? 'Descargar mis resultados (.txt)' : 'Download my results (.txt)';
  download.addEventListener('click', () => (onDownload || ((copy, name) => downloadResultText(document, copy, name)))(text, 'your-pure-path-results.txt'));
  row.append(download);
  const heading = document.createElement('h3'); heading.textContent = language === 'es' ? 'Opcional: mantener el contacto' : 'Optional: stay in touch';
  const description = document.createElement('p'); description.className = 'snapshot-small';
  description.textContent = language === 'es'
    ? 'Health & Wellness Connection es un formulario separado de Google para datos de contacto, eventos y opciones de boletín. Se abre en otra pestaña. No recibe tus respuestas, resultados ni elección espiritual de este cuestionario. Completarlo es voluntario.'
    : 'Health & Wellness Connection is a separate Google Form for contact details, events, and newsletter choices. It opens in another tab. It receives none of your quiz answers, results, or spiritual-support choice from this page. Completing it is voluntary.';
  const link = document.createElement('a'); link.href = connectionFormURL; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
  link.textContent = language === 'es' ? 'Abrir Health & Wellness Connection (Google Form)' : 'Open Health & Wellness Connection (Google Form)';
  section.append(row, heading, description, link); parent.append(section);
}
