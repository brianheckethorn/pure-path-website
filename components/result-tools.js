import { createResultPDF, findUnsupportedPDFCharacters } from './result-pdf.js';

export const connectionFormURL = 'https://forms.gle/Zcc9QZbo9N7NTQcj6';

function downloadBlob(document, blob, filename) {
  const view = document.defaultView;
  const url = view.URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  view.setTimeout(() => view.URL.revokeObjectURL(url), 1000);
}
export function downloadResultText(document, text, filename) {
  downloadBlob(document, new document.defaultView.Blob([text], { type: 'text/plain;charset=utf-8' }), filename);
}
export function downloadResultPDF(document, bytes, filename = 'your-pure-path-results.pdf') {
  downloadBlob(document, new document.defaultView.Blob([bytes], { type: 'application/pdf' }), filename);
}
export function canSharePDF(view, file) {
  try { return Boolean(view?.navigator?.share && view.navigator.canShare?.({ files: [file] })); }
  catch { return false; }
}
// Print only the report, with literal text nodes. Answers never become HTML or URLs.
export function printResultText(document, text, language = 'en', container = document.body) {
  const frame = document.createElement('iframe');
  frame.title = language === 'es' ? 'Imprimir informe local' : 'Print local report';
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0;';
  // Tying the frame to the current results also clears it when answers reset,
  // including browsers that omit afterprint.
  container.append(frame);
  try {
    const report = frame.contentDocument; const view = frame.contentWindow;
    report.documentElement.lang = language;
    report.title = language === 'es' ? 'Informe de Your Pure Path' : 'Your Pure Path report';
    const style = report.createElement('style');
    style.textContent = '@page{size:auto;margin:18mm}body{font:11pt/1.5 Arial,sans-serif;color:#26301a}h1{font-size:20pt;border-bottom:2pt solid #b9cf5c;padding-bottom:8pt}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}';
    const heading = report.createElement('h1'); heading.textContent = 'Your Pure Path';
    const copy = report.createElement('pre'); copy.textContent = text;
    report.head.append(style); report.body.append(heading, copy);
    view.addEventListener('afterprint', () => frame.remove(), { once: true });
    view.focus(); view.print();
  } catch (error) { frame.remove(); throw error; }
}

export function appendResultTools(parent, { document, text, language = 'en', onDownload }) {
  const spanish = language === 'es'; const view = document.defaultView;
  const section = document.createElement('section'); section.className = 'result-tools';
  const heading = document.createElement('h3'); heading.textContent = spanish ? 'Guarda o comparte tu informe' : 'Keep or share your report';
  const privacy = document.createElement('p'); privacy.className = 'snapshot-small';
  privacy.textContent = spanish
    ? 'El PDF se crea en este dispositivo. El informe permanece aquí hasta que decidas compartirlo. Puede incluir información personal de salud; elige con cuidado dónde lo guardas o compartes.'
    : 'The PDF is created on this device. Your report stays here until you choose to share it. It may contain personal health information; choose carefully where you save or share it.';
  const row = document.createElement('div'); row.className = 'snapshot-actions';
  const status = document.createElement('p'); status.className = 'snapshot-small'; status.setAttribute('role', 'status');
  const hasUnsupportedCharacters = findUnsupportedPDFCharacters(text).length > 0;
  const fontWarning = spanish
    ? 'Algunos caracteres no son compatibles con la fuente del PDF y aparecerán como ?. Usa Imprimir informe para conservar el texto original.'
    : 'Some characters are not supported by the PDF font and will appear as ?. Use Print report for the original text.';
  const warning = document.createElement('p'); warning.className = 'snapshot-small'; warning.hidden = !hasUnsupportedCharacters;
  warning.textContent = hasUnsupportedCharacters ? fontWarning : '';
  const withWarning = copy => hasUnsupportedCharacters ? `${copy} ${fontWarning}` : copy;
  let bytes;
  const pdfBytes = () => bytes ??= createResultPDF(text, { language });
  const pdfFile = () => new view.File([pdfBytes()], 'your-pure-path-results.pdf', { type: 'application/pdf' });
  let shareSupported = false;
  try { shareSupported = canSharePDF(view, new view.File([], 'your-pure-path-results.pdf', { type: 'application/pdf' })); } catch { /* File sharing is optional. */ }
  const attachmentHelp = spanish
    ? 'Se solicitó la descarga del PDF. Busca el archivo en Descargas o Archivos y adjúntalo manualmente a un correo. Este sitio no envía el correo ni puede confirmar que la descarga terminó.'
    : 'PDF download requested. Find the file in Downloads or Files and attach it manually to an email. This site does not send the email or confirm that the download finished.';
  function action(copy, callback, secondary = false) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = copy;
    if (secondary) button.className = 'secondary-button';
    button.addEventListener('click', callback); row.append(button); return button;
  }
  function savePDF() {
    try { downloadResultPDF(document, pdfBytes()); status.textContent = withWarning(attachmentHelp); }
    catch { status.textContent = spanish ? 'No se pudo crear la descarga. Prueba Imprimir informe o descarga el texto.' : 'The download could not be created. Try Print report or download the text.'; }
  }
  action(spanish ? 'Guardar PDF' : 'Save PDF', savePDF);
  action(spanish ? 'Imprimir informe' : 'Print report', () => {
    try { printResultText(document, text, language, section); status.textContent = spanish ? 'Se solicitó imprimir. También puedes guardar el PDF con el botón Guardar PDF.' : 'Print requested. You can also keep a PDF using Save PDF.'; }
    catch { status.textContent = spanish ? 'No se pudo abrir la impresión. Usa Guardar PDF e imprime el archivo.' : 'Printing could not open. Use Save PDF and print the file.'; }
  }, true);
  const share = action(shareSupported ? (spanish ? 'Compartir PDF con mis apps' : 'Share PDF with my apps') : (spanish ? 'Descargar PDF para adjuntarlo a un correo' : 'Download PDF to attach to email'), async () => {
    let file;
    try { file = pdfFile(); } catch { savePDF(); return; }
    if (!canSharePDF(view, file)) { savePDF(); return; }
    share.disabled = true;
    try {
      // Call share before any await: mobile browsers require a deliberate gesture.
      await view.navigator.share({ files: [file], title: spanish ? 'Mi informe de Your Pure Path' : 'My Your Pure Path report' });
      status.textContent = withWarning(spanish ? 'La acción de compartir terminó en tu dispositivo. Este sitio no puede confirmar un envío por correo.' : 'Your device finished the share action. This site cannot confirm email delivery.');
    } catch (error) {
      status.textContent = error?.name === 'AbortError'
        ? (spanish ? 'Se canceló compartir. Puedes guardar o compartir el informe cuando quieras.' : 'Sharing was canceled. You can save or share your report whenever you choose.')
        : (spanish ? 'No se pudo compartir. Usa Guardar PDF y adjunta el archivo manualmente a un correo.' : 'Sharing was unavailable. Use Save PDF and attach the file manually to an email.');
    } finally { share.disabled = false; }
  }, true);
  action(spanish ? 'Descargar mis resultados (.txt)' : 'Download my results (.txt)', () => (onDownload || ((copy, name) => downloadResultText(document, copy, name)))(text, 'your-pure-path-results.txt'), true);
  const email = document.createElement('p'); email.className = 'snapshot-small';
  email.textContent = spanish
    ? 'El envío automático desde healthageresults@yourpurepath.com aún no está disponible. Si tu dispositivo permite compartir archivos, puedes elegir Mail u otra app. Si no, descarga el PDF y adjúntalo tú mismo. Compartir un informe no te inscribe en una lista de correo.'
    : 'Automatic email from healthageresults@yourpurepath.com is not available yet. If your device supports file sharing, you can choose Mail or another app. Otherwise, download the PDF and attach it yourself. Sharing a report does not sign you up for a mailing list.';
  const followupHeading = document.createElement('h3'); followupHeading.textContent = spanish ? 'Opcional: próximos eventos y contacto' : 'Optional: future events and staying in touch';
  const description = document.createElement('p'); description.className = 'snapshot-small';
  description.textContent = spanish
    ? 'Health & Wellness Connection es un formulario separado de Google para datos de contacto, eventos y opciones de boletín. Se abre en otra pestaña. No recibe tus respuestas, resultados ni elección espiritual de este cuestionario. Completarlo es voluntario y no depende de guardar o compartir tu informe.'
    : 'Health & Wellness Connection is a separate Google Form for contact details, events, and newsletter choices. It opens in another tab. It receives none of your quiz answers, results, or spiritual-support choice from this page. Completing it is voluntary and does not depend on saving or sharing your report.';
  const link = document.createElement('a'); link.className = 'result-followup-button'; link.href = connectionFormURL; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
  link.textContent = spanish ? 'Inscribirme para futuros eventos: Health & Wellness Connection' : 'Sign up for future events: Health & Wellness Connection';
  section.append(heading, privacy, warning, row, status, email, followupHeading, description, link); parent.append(section);
}
