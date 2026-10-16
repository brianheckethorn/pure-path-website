import { questions, sections, text, disclosure } from './content.js';
import { calculateIllustrativeAge, inputBounds, numericValue } from './scoring.js';
import { discussionIdeas, answerText, reportAnswer, resultEmailText, readingSources } from './results.js';
import { previewDelivery, isValidEmail } from '../wellness-snapshot/delivery.js';
import { appendResultTools } from '../result-tools.js';
import { appendSpiritualSupport, appendNewsletterTopics, newsletterConsentText, newsletterRequestText } from '../support-preferences.js';
import { unitBounds } from './measurements.js';
import { hasReadingContext, readingEntryIssues } from './reading-context.js';

let nextInstance = 0;
export function mountEducationalAge(root, { delivery, onLanguage = () => {}, showDeliveryPreview = false, onDownload }) {
  if (!root || delivery.mode !== 'mock') throw new Error('A root and mock adapter are required.');
  const document = root.ownerDocument;
  const instance = `educational-age-${++nextInstance}`;
  let state = fresh('en');
  let generation = 0;
  let updateEntryFeedback = () => {};
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
  function begin() { generation++; updateEntryFeedback = () => {}; root.replaceChildren(); }
  function heading(copy) { const element = node('h2', copy); element.tabIndex = -1; root.append(element); return element; }
  function reset(focus = true) { state = fresh(state.language); showQuestion(focus); }
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
  function setAnswer(id, value) { state.answers[id] = value; state.result = null; updateEntryFeedback(); }
  function sourceLink(source) {
    const link = node('a', source[state.language]); link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; return link;
  }
  function appendReadingContext() {
    if (!hasReadingContext(state.answers)) return;
    const section = node('section', undefined, 'reading-context');
    section.append(node('p', t('readingNotice'), 'heuristic-disclosure'));
    const issues = readingEntryIssues(state.answers, state.language);
    if (issues.length) {
      section.append(node('h3', t('readingIssues')));
      for (const issue of issues) section.append(node('p', issue.message, 'snapshot-error'), button(questions.find(question => question.id === issue.id).prompt[state.language], () => { clearDelivery(); state.step = questions.findIndex(question => question.id === issue.id); showQuestion(true); }, true));
    }
    for (const source of readingSources) if (hasReadingContext({ [source.id]: state.answers[source.id] })) section.append(node('p', t(source.id === 'bloodPressureReading' ? 'bpSafety' : 'glucoseSafety'), 'snapshot-small'), sourceLink(source));
    root.append(section);
  }
  function inputField(field, value, changed) {
    const label = node('label', field.label[state.language]);
    const input = node(field.type === 'select' ? 'select' : 'input');
    input.id = `${instance}-${field.id}`; label.htmlFor = input.id;
    if (field.type === 'select') {
      const blank = node('option', optionalCopy('Choose (optional)', 'Elegir (opcional)')); blank.value = ''; input.append(blank);
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
      for (const field of question.fields) root.append(...inputField(field, value && typeof value === 'object' ? value[field.id] : '', next => {
        const previous = state.answers[question.id]; setAnswer(question.id, { ...(previous && typeof previous === 'object' ? previous : {}), [field.id]: next });
      }));
    } else if (question.type === 'text') {
      root.append(...inputField({ ...question, label: question.prompt }, state.answers[question.id], value => setAnswer(question.id, value)));
    } else {
      const group = node('fieldset'); group.append(node('legend', question.prompt[state.language]));
      for (const option of question.options) {
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
    root.append(actions(button(t('unknown'), () => { setAnswer(question.id, 'unknown'); showQuestion(true); }, true), button(t('skip'), () => { setAnswer(question.id, 'skip'); showQuestion(true); }, true)));
    if (['unknown', 'skip'].includes(state.answers[question.id])) root.append(node('p', answerText(question, state.answers[question.id], state.language), 'snapshot-small'));
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
    const question = questions[state.step];
    root.append(node('p', `${sections[question.section][state.language]} · ${state.step + 1}/${questions.length}`, 'eyebrow'));
    const title = heading(question.prompt[state.language]);
    const error = state.result?.errors?.find(entry => entry.id === question.id);
    if (question.help) root.append(node('p', question.help[state.language], 'question-help'));
    if (['waistMeasurement', 'bloodPressureReading', 'bloodGlucoseReading'].includes(question.id)) {
      root.append(node('p', optionalCopy('Copy the existing reading exactly as displayed. Use a positive number; leave it blank or skip if you are unsure. No clinical assessment is made here.', 'Copia la lectura existente tal como aparece. Usa un número positivo; déjalo en blanco u omítelo si no sabes. Aquí no se hace una evaluación clínica.'), 'snapshot-small'));
      const source = readingSources.find(source => source.id === question.id);
      if (source) root.append(node('p', t(question.id === 'bloodPressureReading' ? 'bpSafety' : 'glucoseSafety'), 'snapshot-small'), sourceLink(source));
    }
    root.append(node('p', question.supplemental ? optionalCopy('Optional. These details do not add or subtract health-age years.', 'Opcional. Estos detalles no suman ni restan años de edad de salud.') : t('adult'), 'snapshot-small'));
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
      input.value = ['unknown', 'skip'].includes(state.answers[question.id]) ? '' : state.answers[question.id] ?? '';
      label.htmlFor = input.id;
      input.setAttribute('aria-describedby', `${instance}-status`);
      if (error) input.setAttribute('aria-invalid', 'true');
      input.addEventListener('input', () => { state.answers[question.id] = input.value; state.result = null; });
      root.append(label, input);
      }
      if (['unknown', 'skip'].includes(state.answers[question.id])) root.append(node('p', answerText(question, state.answers[question.id], state.language), 'snapshot-small'));
      root.append(actions(button(t('unknown'), () => { state.answers[question.id] = 'unknown'; showQuestion(true); }, true), button(t('skip'), () => { state.answers[question.id] = 'skip'; showQuestion(true); }, true)));
    } else {
      const group = node('fieldset'); group.append(node('legend', question.prompt[state.language]));
      if (error) group.setAttribute('aria-invalid', 'true');
      group.setAttribute('aria-describedby', `${instance}-status`);
      for (const option of [...question.options, { id: 'unknown', label: text.unknown }, { id: 'skip', label: text.skip }]) {
        const label = node('label', undefined, 'snapshot-option'); const input = node('input');
        input.type = 'radio'; input.name = `${instance}-${question.id}`; input.value = option.id; input.checked = state.answers[question.id] === option.id;
        input.addEventListener('change', () => { state.answers[question.id] = option.id; state.result = null; });
        label.append(input, node('span', option.label[state.language])); group.append(label);
      }
      root.append(group);
    }
    const status = node('p', error ? t(error.code === 'bounds' ? 'boundsError' : question.type === 'number' ? 'numberNeeded' : 'choiceNeeded') : '', error ? 'snapshot-error' : 'snapshot-small'); status.id = `${instance}-status`; status.setAttribute('role', 'status'); root.append(status);
    root.append(actions(button(state.step === questions.length - 1 ? t('finish') : t('next'), () => {
      if (state.step === questions.length - 1) { clearDelivery(); state.result = calculateIllustrativeAge(state.answers); showResults(true); }
      else { state.step++; showQuestion(true); }
    }), button(t('back'), () => { if (state.step > 0) state.step--; showQuestion(true); }, true), button(t('clear'), () => { delete state.answers[question.id]; if (question.id === 'height') { delete state.answers.heightFeet; delete state.answers.heightInches; } state.result = null; showQuestion(true); }, true), button(t('reset'), () => reset(), true)));
    if (question.supplemental && state.step !== questions.length - 1) root.append(actions(button(optionalCopy('Skip remaining optional details and see results', 'Omitir los detalles opcionales restantes y ver resultados'), () => { clearDelivery(); state.result = calculateIllustrativeAge(state.answers); showResults(true); }, true)));
    if (focus) title.focus();
  }
  function showResults(focus = false) {
    state.view = 'results';
    begin(); languageToggle();
    const result = state.result;
    const title = heading(t('resultTitle'));
    if (result.status === 'complete') {
      const comparison = node('dl', undefined, 'age-comparison');
      for (const [label, value] of [[t('actual'), result.actualAge], [t('estimate'), result.quizAge]]) {
        const row = node('div'); const age = node('dd');
        age.append(node('strong', String(value), 'age-number'), node('span', ` ${t('years')}`, 'age-unit'));
        row.append(node('dt', label), age); comparison.append(row);
      }
      root.append(comparison);
    } else {
      const age = numericValue(state.answers.age);
      if (age !== null && Number.isInteger(age) && age >= 18 && age <= 100) root.append(node('p', `${t('actual')}: ${age} ${t('years')}`, 'actual-age-known'));
      root.append(node('h3', t('withheld')), node('p', t('withheldWhy')));
      const errors = node('ul', undefined, 'missing-list');
      for (const error of result.errors) {
        const question = questions.find(question => question.id === error.id);
        const item = node('li'); item.append(button(question.prompt[state.language], () => { clearDelivery(); state.step = questions.findIndex(candidate => candidate.id === error.id); showQuestion(true); }, true)); errors.append(item);
      }
      root.append(errors);
    }
    // Keep the unvalidated-estimate disclosure immediately below the age pair.
    root.append(node('p', disclosure[state.language], 'heuristic-disclosure'));
    appendReadingContext();
    root.append(node('h3', t('suggestions')), node('p', t('care'), 'snapshot-small'));
    const ideas = discussionIdeas(state.answers); const list = node('ol', undefined, 'health-next-steps');
    for (const idea of ideas) list.append(node('li', idea[state.language]));
    root.append(ideas.length ? list : node('p', t('none')));
    if (result.status === 'complete') {
      const details = node('details', undefined, 'comparison-details'); details.append(node('summary', t('calculationDetails')));
      details.append(node('p', `${t('difference')}: ${result.difference > 0 ? '+' : ''}${result.difference} ${t('years')}`, 'snapshot-small'), node('p', t('comparisonNote'), 'snapshot-small'), node('p', `${t('bmi')}: ${result.bmi.toFixed(1)}`, 'snapshot-small'), node('p', t('bmiNote'), 'snapshot-small'));
      const bmiLink = node('a', state.language === 'en' ? 'CDC: about BMI' : 'CDC: información sobre el IMC'); bmiLink.href = 'https://www.cdc.gov/bmi/about/index.html'; bmiLink.target = '_blank'; bmiLink.rel = 'noopener noreferrer'; details.append(bmiLink); root.append(details);
    }
    root.append(actions(button(t('edit'), () => { clearDelivery(); state.step = 0; showQuestion(true); }, true), button(t('reset'), () => reset(), true)));
    const summary = node('details'); summary.append(node('summary', t('review')));
    for (const question of questions) { const paragraph = node('p', undefined, 'result-answer'); paragraph.append(node('span', question.prompt[state.language]), node('br'), node('strong', reportAnswer(question, state.answers, state.language))); summary.append(paragraph); }
    root.append(summary);
    appendSpiritualSupport(root, { document, state, instance, language: state.language });
    appendResultTools(root, { document, text: resultEmailText(state.result, state.answers, state.language), language: state.language, onDownload });
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
