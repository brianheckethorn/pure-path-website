// Local-only choices. Support answers never enter age arithmetic or delivery.
const pair = (en, es) => ({ en, es });
export const newsletterTopics = [
  { id: 'healthier-eating', label: pair('Healthier eating', 'Alimentación más saludable') },
  { id: 'movement-life-stage', label: pair('Movement for my stage of life', 'Movimiento para mi etapa de vida') },
  { id: 'closer-to-god', label: pair('Growing closer to God', 'Acercarme más a Dios') }
];
export const spiritualChoices = [
  { id: 'christ', label: pair('Growing closer to Christ', 'Acercarme más a Cristo') },
  { id: 'exploring', label: pair('Exploring faith', 'Explorar la fe') },
  { id: 'not-now', label: pair('Not right now', 'Ahora no') },
  { id: 'prefer-not', label: pair('Prefer not to answer', 'Prefiero no responder') }
];
export function validateNewsletterTopics(topics = []) {
  if (!Array.isArray(topics) || topics.some(id => !newsletterTopics.some(topic => topic.id === id)) || new Set(topics).size !== topics.length) throw new Error('Choose only the listed newsletter topics.');
  return newsletterTopics.filter(topic => topics.includes(topic.id)).map(topic => topic.id);
}
export function newsletterConsentText(topics, language = 'en') {
  const labels = validateNewsletterTopics(topics).map(id => newsletterTopics.find(topic => topic.id === id).label[language]);
  if (!labels.length) return language === 'es' ? 'Sí, envíame consejos de bienestar y noticias de Your Pure Path. Puedo cancelar la suscripción cuando quiera.' : 'Yes, send me wellness tips and news from Your Pure Path. I can unsubscribe at any time.';
  return language === 'es' ? `Sí, envíame noticias de Your Pure Path sobre estos temas que elegí: ${labels.join('; ')}. Puedo cancelar la suscripción cuando quiera.` : `Yes, send me news from Your Pure Path about these topics I selected: ${labels.join('; ')}. I can unsubscribe at any time.`;
}
export function newsletterRequestText({ email, consent, topics, language = 'en' }) {
  const selected = validateNewsletterTopics(topics).map(id => newsletterTopics.find(topic => topic.id === id).label[language]);
  return language === 'es'
    ? `No enviado. Solicitud simulada de boletín.\nCorreo: ${email || '(sin dirección)'}\nConsentimiento: ${consent === true ? 'Sí' : 'No'}\nTemas elegidos: ${selected.join('; ') || 'Ninguno; sin preferencias de tema'}.\nSolo correo, consentimiento y temas elegidos. No incluye respuestas de salud ni la respuesta de apoyo espiritual.`
    : `Not sent. Mock newsletter request.\nEmail: ${email || '(no address)'}\nConsent: ${consent === true ? 'Yes' : 'No'}\nSelected topics: ${selected.join('; ') || 'None; no topic preferences'}.\nOnly email, consent, and selected topics. No health answers or spiritual-support answer.`;
}
export function supportIdea(choice, language = 'en') {
  if (choice === 'christ') return language === 'es' ? 'Si te ayuda, elige un momento tranquilo para orar o leer un pasaje de la Biblia. Puedes conversar con alguien de confianza.' : 'If it would help, choose a quiet moment for prayer or reading a Bible passage. You can talk with someone you trust.';
  if (choice === 'exploring') return language === 'es' ? 'Puedes escribir una pregunta que tengas sobre la fe y, si quieres, conversar con alguien de confianza.' : 'You could write down one question you have about faith and, if you wish, discuss it with someone you trust.';
  return '';
}
function node(document, tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
export function appendSpiritualSupport(parent, { document, state, instance, language = 'en' }) {
  const section = node(document, 'section', undefined, 'optional-support');
  const fieldset = node(document, 'fieldset');
  fieldset.append(node(document, 'legend', language === 'es' ? '¿Te gustaría apoyo en tu vida espiritual?' : 'Would you like support with your spiritual life?'));
  section.append(node(document, 'p', language === 'es' ? 'Opcional. Esta elección no cambia el cálculo ni clasifica tus creencias. Queda en esta página y no se añade a los resultados descargados ni al formulario externo.' : 'Optional. This choice does not change the calculation or grade your beliefs. It stays on this page and is not added to downloaded results or the external form.', 'snapshot-small'));
  const feedback = node(document, 'p', supportIdea(state.spiritualSupport, language), 'snapshot-small'); feedback.setAttribute('role', 'status');
  const inputs = [];
  for (const choice of spiritualChoices) {
    const label = node(document, 'label', undefined, 'snapshot-option'); const input = node(document, 'input');
    input.type = 'radio'; input.name = `${instance}-spiritual-support`; input.value = choice.id; input.checked = state.spiritualSupport === choice.id;
    input.addEventListener('change', () => { state.spiritualSupport = choice.id; feedback.textContent = supportIdea(choice.id, language); });
    label.append(input, node(document, 'span', choice.label[language])); fieldset.append(label); inputs.push(input);
  }
  const clear = node(document, 'button', language === 'es' ? 'Borrar mi elección de apoyo' : 'Clear my support choice', 'secondary-button'); clear.type = 'button';
  clear.addEventListener('click', () => { state.spiritualSupport = ''; for (const input of inputs) input.checked = false; feedback.textContent = ''; });
  section.append(fieldset, clear, feedback); parent.append(section);
}
export function appendNewsletterTopics(parent, { document, state, language = 'en', onChange }) {
  const group = node(document, 'fieldset');
  group.append(node(document, 'legend', language === 'es' ? 'Temas del boletín (opcionales)' : 'Newsletter topics (optional)'));
  group.append(node(document, 'p', language === 'es' ? 'Puedes dejar todos sin marcar. Los temas no se deducen de tus respuestas. Elegir un tema no te suscribe. El tema de Dios es una preferencia relacionada con la fe; aparecerá explícitamente en el consentimiento y la vista previa.' : 'You can leave all topics unchecked. Topics are never inferred from your answers. Choosing a topic does not subscribe you. The God topic is a faith-related preference; it appears explicitly in consent and the preview.', 'snapshot-small'));
  const inputs = [];
  for (const topic of newsletterTopics) {
    const label = node(document, 'label', undefined, 'consent-option'); const input = node(document, 'input'); input.type = 'checkbox'; input.value = topic.id; input.checked = state.newsletterTopics.includes(topic.id);
    input.addEventListener('change', () => { state.newsletterTopics = newsletterTopics.filter(candidate => candidate.id === topic.id ? input.checked : state.newsletterTopics.includes(candidate.id)).map(candidate => candidate.id); onChange(); });
    label.append(input, node(document, 'span', topic.label[language])); group.append(label); inputs.push(input);
  }
  const clear = node(document, 'button', language === 'es' ? 'Borrar mis temas del boletín' : 'Clear newsletter topics', 'secondary-button'); clear.type = 'button';
  clear.addEventListener('click', () => { state.newsletterTopics = []; for (const input of inputs) input.checked = false; onChange(); });
  group.append(clear); parent.append(group);
}
