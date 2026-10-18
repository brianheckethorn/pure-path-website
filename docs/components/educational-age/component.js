import { questions, sections, text } from './content.js';
import { inputBounds } from './scoring.js';
import { calculateAssessmentPreview, answerText, resultEmailText, resultPDFModel, readingSources } from './results.js';
import { previewDelivery, isValidEmail } from '../wellness-snapshot/delivery.js';
import { appendResultTools } from '../result-tools.js';
import { appendSpiritualSupport, appendNewsletterTopics, newsletterConsentText, newsletterRequestText } from '../support-preferences.js';
import { unitBounds } from './measurements.js';
import { readingEntryIssues } from './reading-context.js';
import { questionResponseIssue, assessmentResponseIssues } from './response-policy.js';
import { appendResultReport, reportStyles } from '../result-report.js';

let nextInstance = 0;
export function mountEducationalAge(root, { delivery, onLanguage = () => {}, showDeliveryPreview = false, onDownload }) {
  if (!root || delivery.mode !== 'mock') throw new Error('A root and mock adapter are required.');
  const document = root.ownerDocument;
  const instance = `educational-age-${++nextInstance}`;
  let state = fresh('en');
  let generation = 0;
  let updateEntryFeedback = () => {};
  let navigationIssue = null;
  function fresh(language) { return { language, view: 'questions', answers: {}, step: 0, result: null, email: '', resultConsent: false, listConsent: false, newsletterTopics: [], spiritualSupport: '' }; }
  const t = key => text[key][state.language];
  function node(tag, copy, className) {
    const element = document.createElement(tag);
    if (copy !== undefined) element.textContent = copy;
    if (className) element.className = className;
    return element;
  }
  function button(copy, action, secondary = false) {
    const element = node('button', copy, secondary ? 'secondary-button' : undefined); element.type = 'button'; element.addEventListener('click', action); return element;
  }
  function actions(...buttons) { const row = node('div', undefined, 'snapshot-actions'); row.append(...buttons); return row; }
  function begin() { generation++; updateEntryFeedback = () => {}; root.replaceChildren(); root.setAttribute('data-view', state.view); }
  function heading(copy) { const element = node('h2', copy); element.tabIndex = -1; root.append(element); return element; }
  function reset(focus = true) { navigationIssue = null; state = fresh(state.language); showQuestion(focus); }
  function languageToggle() {
    const row = node('div', undefined, 'language-row');
    const control = button(state.language === 'en' ? 'Español' : 'English', () => {
      state.language = state.language === 'en' ? 'es' : 'en';
      onLanguage(state.language);
      // Render saved state; changing language never calculates or bypasses validation.
      if (state.view === 'results') showResults(true); else showQuestion(true);
    }, true);
    control.lang = state.language === 'en' ? 'es' : 'en'; row.append(control); root.append(row);
  }
  function clearDelivery() { state.email = ''; state.resultConsent = false; state.listConsent = false; state.newsletterTopics = []; state.spiritualSupport = ''; }
  function optionalCopy(en, es) { return state.language === 'es' ? es : en; }
  function setAnswer(id, value) { state.answers[id] = value; state.result = null; navigationIssue = null; updateEntryFeedback(); }
  function sourceLink(source) {
    const link = node('a', source[state.language]); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; return link;
  }
  function inputField(field, value, changed) {
    const label = node('label', field.label[state.language]);
    const input = node(field.type === 'select' ? 'select' : 'input');
    input.id = `${instance}-${field.id}`; label.htmlFor = input.id;
    if (field.type === 'select') {
      const blank = node('option', optionalCopy('Choose', 'Elegir')); blank.value = ''; input.append(blank);
      for (const option of field.options) { const choice = node('option', option.label[state.language]); choice.value = option.id; input.append(choice); }
    } else {
      input.type = field.type; input.autocomplete = 'off'; input.maxLength = field.maxLength || 120;
      if (field.type === 'number') { input.step = field.step || 'any'; input.inputMode = 'decimal'; if (field.min !== undefined) input.min = String(field.min); if (field.max !== undefined) input.max = String(field.max); }
    }
    input.value = value ?? '';
    input.addEventListener(field.type === 'select' ? 'change' : 'input', () => changed(input.value));
    return [label, input];
  }
  function supplementalFields(question) {
    if (question.type === 'group') {
      const value = state.answers[question.id];
      for (const field of question.fields.filter(field => !field.whenReading || value?.readingStatus === field.whenReading)) root.append(...inputField(field, value && typeof value === 'object' ? value[field.id] : '', next => {
        const previous = state.answers[question.id]; const updated = { ...(previous && typeof previous === 'object' ? previous : {}), [field.id]: next };
        if (field.id === 'readingStatus' && next !== 'measured') for (const dependent of question.fields.filter(field => field.whenReading)) delete updated[dependent.id];
        setAnswer(question.id, updated);
        if (field.id === 'readingStatus') showQuestion(true);
      }));
    } else if (question.type === 'text') {
      root.append(...inputField({ ...question, label: question.prompt }, ['unknown', 'preferNot', 'skip'].includes(state.answers[question.id]) ? '' : state.answers[question.id], value => setAnswer(question.id, value)));
    } else {
      const group = node('fieldset'); group.append(node('legend', question.prompt[state.language]));
      for (const option of question.options.filter(option => option.id !== 'preferNot')) {
        const label = node('label', undefined, 'snapshot-option'); const input = node('input');
        input.type = question.type === 'multi' ? 'checkbox' : 'radio'; input.name = `${instance}-${question.id}`; input.value = option.id;
        input.checked = question.type === 'multi' ? Array.isArray(state.answers[question.id]) && state.answers[question.id].includes(option.id) : state.answers[question.id] === option.id;
        input.addEventListener('change', () => {
          if (question.type === 'multi') { const previous = Array.isArray(state.answers[question.id]) ? state.answers[question.id] : []; setAnswer(question.id, question.options.filter(choice => choice.id === option.id ? input.checked : previous.includes(choice.id)).map(choice => choice.id)); }
          else setAnswer(question.id, option.id);
        });
        label.append(input, node('span', option.label[state.language])); group.append(label);
      }
      root.append(group);
    }
    const responses = [];
    responses.push(button(t('unknown'), () => { setAnswer(question.id, 'unknown'); showQuestion(true); }, true));
    if (question.type === 'multi') responses.push(button(t('noneSelected'), () => { setAnswer(question.id, 'none'); showQuestion(true); }, true));
    responses.push(button(t('preferNot'), () => { setAnswer(question.id, 'preferNot'); showQuestion(true); }, true));
    root.append(actions(...responses));
    if (['unknown', 'preferNot', 'skip', 'none'].includes(state.answers[question.id])) root.append(node('p', answerText(question, state.answers[question.id], state.language), 'response-choice-note'));
  }
  function measurementUnits(question) {
    const height = question.id === 'height'; const key = height ? 'heightUnit' : 'weightUnit';
    const unit = state.answers[key] || (height ? 'in' : 'lb');
    const choices = height ? [['in', 'Inches', 'Pulgadas'], ['ft-in', 'Feet and inches', 'Pies y pulgadas'], ['cm', 'Centimeters', 'Centímetros']] : [['lb', 'Pounds', 'Libras'], ['kg', 'Kilograms', 'Kilogramos']];
    const group = node('fieldset'); group.append(node('legend', optionalCopy('Measurement units', 'Unidades de medida')));
    for (const [id, en, es] of choices) {
      const label = node('label', undefined, 'snapshot-option'); const radio = node('input'); radio.type = 'radio'; radio.name = `${instance}-${key}`; radio.checked = unit === id;
      radio.addEventListener('change', () => { setAnswer(key, id); delete state.answers[question.id]; if (height) { delete state.answers.heightFeet; delete state.answers.heightInches; } showQuestion(true); });
      label.append(radio, node('span', optionalCopy(en, es))); group.append(label);
    }
    root.append(group);
    return unit;
  }
  function showQuestion(focus = false) {
    state.view = 'questions';
    begin(); languageToggle();
    if (state.step === 0) {
      const signup = node('aside', undefined, 'assessment-signup');
      const link = node('a', optionalCopy('Sign up for health information & classes', 'Inscríbete para recibir información de salud y clases'));
      link.href = 'https://docs.google.com/forms/d/e/1FAIpQLSf-ajVNWx12BAnw7AzLw9BaV0RMhvQgNPoP45kP_Qk4PYSkiA/viewform?usp=send_form';
      link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
      signup.append(link, node('p', optionalCopy('Optional — no assessment needed. Opens a separate Google Form; no assessment answers are sent.', 'Opcional: no necesitas hacer la evaluación. Abre un formulario de Google aparte; no se envían respuestas de la evaluación.')));
      root.append(signup);
    }
    const question = questions[state.step];
    root.append(node('p', `${sections[question.section][state.language]} · ${state.step + 1}/${questions.length}`, 'eyebrow'));
    const progress = node('div', undefined, 'assessment-progress'); progress.setAttribute('role', 'progressbar'); progress.setAttribute('aria-valuemin', '0'); progress.setAttribute('aria-valuemax', String(questions.length)); progress.setAttribute('aria-valuenow', String(state.step + 1)); progress.setAttribute('aria-label', t('progress'));
    const bar = node('span'); bar.style = `width:${(state.step + 1) / questions.length * 100}%`; progress.append(bar); root.append(progress);
    const title = heading(question.prompt[state.language]);
    const error = state.result?.errors?.find(entry => entry.id === question.id);
    if (question.help) root.append(node('p', question.help[state.language], 'question-help'));
    for (const source of question.guidanceSources || []) {
      const link = node('a', `${optionalCopy('Source', 'Fuente')}: ${new URL(source.url).hostname}`, 'question-source'); link.href = source.url; link.title = source.title; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer'; root.append(link);
    }
    if (['waistMeasurement', 'bloodPressureReading', 'bloodGlucoseReading'].includes(question.id)) {
      root.append(node('p', optionalCopy('Copy an existing reading exactly as displayed. If it was not measured or you do not know it, choose that response below. Do not invent a value. No clinical assessment is made here.', 'Copia una lectura existente tal como aparece. Si no se midió o no la conoces, elige esa respuesta abajo. No inventes un valor. Aquí no se hace una evaluación clínica.'), 'snapshot-small'));
      const source = readingSources.find(source => source.id === question.id);
      if (source) root.append(node('p', t(question.id === 'bloodPressureReading' ? 'bpSafety' : 'glucoseSafety'), 'snapshot-small'), sourceLink(source));
    }
    root.append(node('p', t('responseRequired'), 'snapshot-small'));
    if (question.supplemental) {
      supplementalFields(question);
      if (['waistMeasurement', 'bloodPressureReading', 'bloodGlucoseReading'].includes(question.id)) {
        const feedback = node('p', '', 'snapshot-error'); feedback.setAttribute('role', 'status'); root.append(feedback);
        updateEntryFeedback = () => { feedback.textContent = readingEntryIssues(state.answers, state.language).find(issue => issue.id === question.id)?.message || ''; feedback.hidden = !feedback.textContent; };
        updateEntryFeedback();
      }
    }
    else if (question.type === 'number') {
      const unit = ['height', 'weight'].includes(question.id) ? measurementUnits(question) : null;
      if (unit === 'ft-in') {
        for (const field of [{ id: 'heightFeet', type: 'number', min: 0, step: '1', label: { en: 'Feet', es: 'Pies' } }, { id: 'heightInches', type: 'number', min: 0, max: 11.99, label: { en: 'Additional inches (under 12)', es: 'Pulgadas adicionales (menos de 12)' } }]) root.append(...inputField(field, state.answers[field.id], value => { delete state.answers.height; setAnswer(field.id, value); }));
      } else {
      const label = node('label', question.prompt[state.language]);
      const input = node('input'); input.id = `${instance}-${question.id}`; input.type = 'number'; input.autocomplete = 'off';
      const bounds = unit ? unitBounds(question.id, unit) : inputBounds[question.id];
      input.min = String(bounds.min); input.max = String(bounds.max); input.step = inputBounds[question.id].integer ? '1' : 'any'; input.inputMode = inputBounds[question.id].integer ? 'numeric' : 'decimal';
      input.value = ['unknown', 'skip', 'preferNot'].includes(state.answers[question.id]) ? '' : state.answers[question.id] ?? '';
      label.htmlFor = input.id;
      input.setAttribute('aria-describedby', `${instance}-status`);
      if (error) input.setAttribute('aria-invalid', 'true');
      input.addEventListener('input', () => setAnswer(question.id, input.value));
      root.append(label, input);
      }
      if (['unknown', 'skip', 'preferNot'].includes(state.answers[question.id])) root.append(node('p', answerText(question, state.answers[question.id], state.language), 'response-choice-note'));
      root.append(actions(button(t('unknown'), () => { setAnswer(question.id, 'unknown'); showQuestion(true); }, true), button(t('preferNot'), () => { setAnswer(question.id, 'preferNot'); showQuestion(true); }, true)));
    } else {
      const group = node('fieldset'); group.append(node('legend', question.prompt[state.language]));
      if (error) group.setAttribute('aria-invalid', 'true');
      group.setAttribute('aria-describedby', `${instance}-status`);
      for (const option of [...question.options, { id: 'unknown', label: text.unknown }, { id: 'preferNot', label: text.preferNot }]) {
        const label = node('label', undefined, 'snapshot-option'); const input = node('input');
        input.type = 'radio'; input.name = `${instance}-${question.id}`; input.value = option.id; input.checked = state.answers[question.id] === option.id;
        input.addEventListener('change', () => setAnswer(question.id, option.id));
        label.append(input, node('span', option.label[state.language])); group.append(label);
      }
      root.append(group);
    }
    const statusCopy = navigationIssue?.id === question.id ? questionResponseIssue(question, state.answers, state.language) : error ? t(error.code === 'bounds' ? 'boundsError' : question.type === 'number' ? 'numberNeeded' : 'choiceNeeded') : '';
    const status = node('p', statusCopy || '', statusCopy ? 'snapshot-error' : 'snapshot-small'); status.id = `${instance}-status`; status.setAttribute('role', 'status'); root.append(status);
    root.append(actions(button(state.step === questions.length - 1 ? t('finish') : t('next'), () => {
      const issue = questionResponseIssue(question, state.answers, state.language);
      if (issue) { navigationIssue = { id: question.id }; showQuestion(true); return; }
      navigationIssue = null;
      if (state.step === questions.length - 1) {
        const remaining = assessmentResponseIssues(questions, state.answers, state.language);
        if (remaining.length) { state.step = questions.findIndex(question => question.id === remaining[0].id); navigationIssue = { id: remaining[0].id }; showQuestion(true); return; }
        clearDelivery(); state.result = calculateAssessmentPreview(state.answers); showResults(true);
      } else { state.step++; showQuestion(true); }
    }), button(t('back'), () => { navigationIssue = null; if (state.step > 0) state.step--; showQuestion(true); }, true), button(t('clear'), () => { delete state.answers[question.id]; if (question.id === 'height') { delete state.answers.heightFeet; delete state.answers.heightInches; } state.result = null; navigationIssue = null; showQuestion(true); }, true), button(t('reset'), () => reset(), true)));
    if (focus) title.focus();
  }
  function showResults(focus = false) {
    state.view = 'results';
    begin(); languageToggle();
    const result = state.result;
    const model = resultPDFModel(result, state.answers, state.language);
    const style = node('style'); style.textContent = reportStyles; root.append(style);
    const { title } = appendResultReport(root, { document, model, language: state.language });
    root.append(actions(button(t('edit'), () => { clearDelivery(); state.step = 0; showQuestion(true); }, true), button(t('reset'), () => reset(), true)));
    appendSpiritualSupport(root, { document, state, instance, language: state.language });
    appendResultTools(root, { document, text: resultEmailText(state.result, state.answers, state.language), reportModel: model, language: state.language, onDownload });
    if (showDeliveryPreview) root.append(emailOptions());
    if (focus) { title.focus({ preventScroll: true }); title.scrollIntoView({ block: 'start', behavior: 'auto' }); }
  }
  function emailOptions() {
    const section = node('section', undefined, 'optional-delivery'); section.setAttribute('aria-label', t('emailTitle'));
    section.append(node('h3', t('emailTitle')), node('p', t('emailMock'), 'snapshot-small'));
    const label = node('label', t('emailLabel')); const input = node('input'); input.type = 'email'; input.id = `${instance}-email`; input.value = state.email; input.maxLength = 254; input.autocomplete = 'off'; label.htmlFor = input.id; section.append(label, input);
    let pending = false; let requestVersion = 0; let listCheck; let listCopy; let newsletterPreview;
    function refreshChoices() {
      if (listCopy) listCopy.textContent = newsletterConsentText(state.newsletterTopics, state.language);
      if (newsletterPreview) newsletterPreview.textContent = newsletterRequestText({ email: state.email, consent: state.listConsent, topics: state.newsletterTopics, language: state.language });
    }
    const status = node('p', undefined, 'snapshot-small'); status.setAttribute('role', 'status');
    const verify = button(t('verifyButton'), () => request(true), true); verify.hidden = true;
    function changed() { requestVersion++; pending = false; verify.hidden = true; status.textContent = ''; }
    input.addEventListener('input', () => { state.email = input.value.trim(); changed(); refreshChoices(); });
    for (const [key, labelKey] of [['resultConsent', 'resultConsent'], ['listConsent', 'listConsent']]) {
      const option = node('label', undefined, 'consent-option'); const check = node('input'); check.type = 'checkbox'; check.className = 'delivery-consent'; check.checked = state[key];
      const copy = node('span', key === 'listConsent' ? newsletterConsentText(state.newsletterTopics, state.language) : t(labelKey));
      if (key === 'listConsent') { listCheck = check; listCopy = copy; }
      check.addEventListener('change', () => { state[key] = check.checked; changed(); refreshChoices(); }); option.append(check, copy); section.append(option);
    }
    appendNewsletterTopics(section, { document, state, language: state.language, onChange() { state.listConsent = false; listCheck.checked = false; changed(); refreshChoices(); } });
    section.append(node('h4', state.language === 'es' ? 'Vista previa de la solicitud del boletín' : 'Newsletter request preview'));
    newsletterPreview = node('pre', '', 'email-preview'); section.append(newsletterPreview); refreshChoices();
    const message = resultEmailText(state.result, state.answers, state.language);
    const preview = node('details'); preview.open = true; preview.append(node('summary', t('emailPreview')), node('pre', message, 'email-preview')); section.append(preview);
    const submit = button(t('preview'), () => request(false)); section.append(actions(submit, verify), status);
    async function request(verified) {
      if (verified && !pending) return;
      if (!state.resultConsent && !state.listConsent) { status.textContent = t('consentError'); return; }
      if (!isValidEmail(state.email)) { status.textContent = t('emailError'); return; }
      const currentGeneration = generation; const currentRequest = ++requestVersion;
      submit.disabled = true; verify.disabled = true;
      try {
        const response = await previewDelivery({ adapter: delivery, email: state.email, resultEmailConsent: state.resultConsent, mailingListConsent: state.listConsent, newsletterTopics: [...state.newsletterTopics], snapshot: message, verified });
        if (generation !== currentGeneration || requestVersion !== currentRequest) return;
        pending = Boolean(response.verification); verify.hidden = !pending; status.textContent = t(pending ? 'neutral' : 'mockDone');
      } catch { if (generation === currentGeneration && requestVersion === currentRequest) status.textContent = t('emailError'); }
      finally { submit.disabled = false; verify.disabled = false; }
    }
    return section;
  }
  onLanguage(state.language); showQuestion();
  return Object.freeze({ reset, dispose() { generation++; state = fresh(state.language); root.replaceChildren(); } });
}
