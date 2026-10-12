import { questions, sections, text, disclosure } from './content.js';
import { calculateIllustrativeAge, inputBounds } from './scoring.js';
import { discussionIdeas, answerText, resultEmailText } from './results.js';
import { previewDelivery, isValidEmail } from '../wellness-snapshot/delivery.js';
import { appendResultTools } from '../result-tools.js';
import { appendSpiritualSupport, appendNewsletterTopics, newsletterConsentText, newsletterRequestText } from '../support-preferences.js';

let nextInstance = 0;
export function mountEducationalAge(root, { delivery, onLanguage = () => {}, showDeliveryPreview = false, onDownload }) {
  if (!root || delivery.mode !== 'mock') throw new Error('A root and mock adapter are required.');
  const document = root.ownerDocument;
  const instance = `educational-age-${++nextInstance}`;
  let state = fresh('en');
  let generation = 0;
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
  function begin() { generation++; root.replaceChildren(); }
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
  function showQuestion(focus = false) {
    state.view = 'questions';
    begin(); languageToggle();
    const question = questions[state.step];
    root.append(node('p', `${sections[question.section][state.language]} · ${state.step + 1}/22`, 'eyebrow'));
    const title = heading(question.prompt[state.language]);
    const error = state.result?.errors?.find(entry => entry.id === question.id);
    if (question.help) root.append(node('p', question.help[state.language], 'question-help'));
    root.append(node('p', t('adult'), 'snapshot-small'));
    if (question.type === 'number') {
      const label = node('label', question.prompt[state.language]);
      const input = node('input'); input.id = `${instance}-${question.id}`; input.type = 'number'; input.autocomplete = 'off';
      input.min = String(inputBounds[question.id].min); input.max = String(inputBounds[question.id].max); input.step = inputBounds[question.id].integer ? '1' : 'any'; input.inputMode = inputBounds[question.id].integer ? 'numeric' : 'decimal';
      input.value = ['unknown', 'skip'].includes(state.answers[question.id]) ? '' : state.answers[question.id] ?? '';
      label.htmlFor = input.id;
      input.setAttribute('aria-describedby', `${instance}-status`);
      if (error) input.setAttribute('aria-invalid', 'true');
      input.addEventListener('input', () => { state.answers[question.id] = input.value; state.result = null; });
      root.append(label, input);
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
    root.append(actions(button(state.step === 21 ? t('finish') : t('next'), () => {
      if (state.step === 21) { clearDelivery(); state.result = calculateIllustrativeAge(state.answers); showResults(true); }
      else { state.step++; showQuestion(true); }
    }), button(t('back'), () => { if (state.step > 0) state.step--; showQuestion(true); }, true), button(t('clear'), () => { delete state.answers[question.id]; state.result = null; showQuestion(true); }, true), button(t('reset'), () => reset(), true)));
    if (focus) title.focus();
  }
  function showResults(focus = false) {
    state.view = 'results';
    begin(); languageToggle();
    const result = state.result;
    const title = heading(t('resultTitle'));
    // The requested note is adjacent to the number, never hidden in a footer.
    root.append(node('p', disclosure[state.language], 'heuristic-disclosure'));
    if (result.status === 'complete') {
      const comparison = node('dl', undefined, 'age-comparison');
      for (const [label, value] of [[t('actual'), result.actualAge], [t('estimate'), result.quizAge], [t('difference'), `${result.difference > 0 ? '+' : ''}${result.difference}`]]) {
        const row = node('div'); row.append(node('dt', label), node('dd', `${value} ${t('years')}`)); comparison.append(row);
      }
      root.append(comparison, node('p', t('comparisonNote'), 'snapshot-small'), node('p', `${t('bmi')}: ${result.bmi.toFixed(1)}`, 'snapshot-small'), node('p', t('bmiNote'), 'snapshot-small'));
      const bmiLink = node('a', state.language === 'en' ? 'CDC: about BMI' : 'CDC: información sobre el IMC'); bmiLink.href = 'https://www.cdc.gov/bmi/about/index.html'; bmiLink.target = '_blank'; bmiLink.rel = 'noopener noreferrer'; root.append(bmiLink);
    } else {
      root.append(node('h3', t('withheld')), node('p', t('withheldWhy')));
      const errors = node('ul', undefined, 'missing-list');
      for (const error of result.errors) {
        const question = questions.find(question => question.id === error.id);
        const item = node('li'); item.append(button(question.prompt[state.language], () => { clearDelivery(); state.step = questions.findIndex(candidate => candidate.id === error.id); showQuestion(true); }, true)); errors.append(item);
      }
      root.append(errors);
    }
    root.append(node('p', t('care'), 'snapshot-small'), node('h3', t('suggestions')));
    const ideas = discussionIdeas(state.answers); const list = node('ul');
    for (const idea of ideas) list.append(node('li', idea[state.language]));
    root.append(ideas.length ? list : node('p', t('none')));
    root.append(actions(button(t('edit'), () => { clearDelivery(); state.step = 0; showQuestion(true); }, true), button(t('reset'), () => reset(), true)));
    const summary = node('details'); summary.append(node('summary', t('review')));
    for (const question of questions) { const paragraph = node('p', undefined, 'result-answer'); paragraph.append(node('span', question.prompt[state.language]), node('br'), node('strong', answerText(question, state.answers[question.id], state.language))); summary.append(paragraph); }
    root.append(summary);
    appendSpiritualSupport(root, { document, state, instance, language: state.language });
    appendResultTools(root, { document, text: resultEmailText(state.result, state.answers, state.language), language: state.language, onDownload });
    if (showDeliveryPreview) root.append(emailOptions());
    if (focus) title.focus();
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
