import { createSnapshotState, buildSnapshot, snapshotEmailText } from './model.js';
import { previewDelivery } from './delivery.js';
import { sources } from './content.js';
import { appendSpiritualSupport, appendNewsletterTopics, newsletterConsentText, newsletterRequestText } from '../support-preferences.js';

let nextInstance = 0;
export function mountWellnessSnapshot(root, { content, delivery }) {
  if (!root || !content || delivery.mode !== 'mock') throw new Error('A root, content, and mock adapter are required.');
  const document = root.ownerDocument;
  const instance = `wellness-${++nextInstance}`;
  let state = createSnapshotState();
  let generation = 0;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(label, action, secondary = false) {
    const node = element('button', label, secondary ? 'secondary-button' : undefined);
    // There is intentionally no HTML form or native submission anywhere.
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }
  function heading(text) {
    const node = element('h2', text);
    node.tabIndex = -1;
    root.append(node);
    return node;
  }
  function beginRender() { generation++; root.replaceChildren(); }
  function focus(node, enabled) { if (enabled) node.focus(); }
  function actions(...buttons) { const row = element('div', undefined, 'snapshot-actions'); row.append(...buttons); return row; }
  function reset(shouldFocus = true) { state = createSnapshotState(); showGate(shouldFocus); }

  function showGate(shouldFocus = false) {
    beginRender();
    const title = heading('Ready to take a moment?');
    root.append(element('p', 'Every question is optional. Your snapshot describes what you share, without points or grades.'));
    const fieldset = element('fieldset');
    fieldset.append(element('legend', 'Are you 18 or older?'));
    const status = element('p');
    status.setAttribute('role', 'status');
    for (const [value, label] of [[true, 'Yes'], [false, 'No']]) {
      const option = element('label', undefined, 'snapshot-option');
      const input = element('input');
      input.type = 'radio'; input.name = `${instance}-adult`; input.value = String(value); input.checked = state.adult === value;
      input.addEventListener('change', () => {
        state.adult = value;
        status.textContent = value ? '' : 'This questionnaire is for adults 18 and older. You can return to the homepage.';
      });
      option.append(input, element('span', label)); fieldset.append(option);
    }
    root.append(fieldset, status, actions(button('Start my snapshot', () => {
      if (state.adult !== true) {
        status.className = 'snapshot-error';
        status.textContent = state.adult === false ? 'This questionnaire is for adults 18 and older. You can return to the homepage.' : 'Choose Yes or No before continuing.';
        return;
      }
      showQuestion(true);
    })));
    focus(title, shouldFocus);
  }

  function showQuestion(shouldFocus = false) {
    beginRender();
    const question = content.questions[state.step];
    root.append(element('p', `Question ${state.step + 1} of ${content.questions.length}`, 'eyebrow'));
    const title = heading('Your everyday habits');
    root.append(element('p', 'Choose an answer, or skip. Leaving a question blank is okay.', 'snapshot-small'));
    const fieldset = element('fieldset');
    const legend = element('legend', question.prompt);
    fieldset.append(legend);
    if (question.help) {
      const help = element('p', question.help, 'question-help');
      help.id = `${instance}-help-${question.id}`;
      fieldset.setAttribute('aria-describedby', help.id); fieldset.append(help);
    }
    for (const option of question.options) {
      const label = element('label', undefined, 'snapshot-option');
      const input = element('input');
      input.type = 'radio'; input.name = `${instance}-${question.id}`; input.value = option.id; input.checked = state.answers[question.id] === option.id;
      input.addEventListener('change', () => { state.answers[question.id] = option.id; });
      label.append(input, element('span', option.label)); fieldset.append(label);
    }
    root.append(fieldset, actions(
      button(state.step === content.questions.length - 1 ? 'See my snapshot' : 'Next', () => {
        if (state.step === content.questions.length - 1) { state.resultsVisible = true; showResults(true); }
        else { state.step++; showQuestion(true); }
      }),
      button('Back', () => { if (state.step === 0) showGate(true); else { state.step--; showQuestion(true); } }, true),
      button('Clear this answer', () => { delete state.answers[question.id]; showQuestion(true); }, true),
      button('Start over', () => reset(), true)
    ));
    focus(title, shouldFocus);
  }

  function showResults(shouldFocus = false) {
    beginRender();
    const snapshot = buildSnapshot(content, state.answers);
    const title = heading('Your Wellness Snapshot');
    root.append(element('p', snapshot.allMissing ? "You haven't shared any answers. You can go back, or read the general tips below." : 'Here is what you shared, with a few ideas to consider.'));
    root.append(element('h3', 'One or two small steps'));
    const steps = element('ul'); for (const step of snapshot.steps) steps.append(element('li', step)); root.append(steps);
    for (const card of snapshot.cards) {
      const section = element('section', undefined, 'result-item');
      section.setAttribute('aria-labelledby', `${instance}-result-${card.id}`);
      const cardTitle = element('h3', card.title); cardTitle.id = `${instance}-result-${card.id}`; section.append(cardTitle);
      for (const answer of card.answers) {
        const paragraph = element('p', undefined, 'result-answer');
        paragraph.append(element('span', answer.question), element('br'), element('strong', answer.answer)); section.append(paragraph);
      }
      // Answer-based steps appear once above; domain cards retain the answer summary.
      const links = element('ul', undefined, 'result-sources');
      for (const source of card.sources) {
        const item = element('li'); const link = element('a', source.title);
        link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; item.append(link); links.append(item);
      }
      section.append(links); root.append(section);
    }
    root.append(element('p', snapshot.disclaimer, 'snapshot-small'), actions(
      button('Edit my answers', () => {
        state.step = 0; state.resultsVisible = false; state.email = ''; state.resultEmailConsent = false; state.mailingListConsent = false; state.newsletterTopics = []; state.spiritualSupport = ''; showQuestion(true);
      }, true),
      button('Start over', () => reset(), true)
    ));
    appendSpiritualSupport(root, { document, state, instance });
    root.append(emailOptions(snapshot));
    focus(title, shouldFocus);
  }

  function emailOptions(snapshot) {
    const section = element('section', undefined, 'optional-delivery');
    section.setAttribute('aria-label', 'Optional email choices');
    section.append(element('h3', 'Want a copy by email?'), element('p', 'Local mock only. Nothing will be sent, saved to a mailing list, or copied to a counselor.', 'snapshot-small'));
    const emailLabel = element('label', 'Email (optional)');
    const email = element('input');
    email.type = 'email'; email.id = `${instance}-email`; email.autocomplete = 'off'; email.maxLength = 254; email.value = state.email;
    emailLabel.htmlFor = email.id; section.append(emailLabel, email);
    let verificationPending = false;
    let requestVersion = 0; let listCheck; let listCopy; let newsletterPreview;
    function refreshChoices() {
      if (listCopy) listCopy.textContent = newsletterConsentText(state.newsletterTopics);
      if (newsletterPreview) newsletterPreview.textContent = newsletterRequestText({ email: state.email, consent: state.mailingListConsent, topics: state.newsletterTopics });
    }
    const status = element('p', undefined, 'snapshot-small'); status.setAttribute('role', 'status');
    const simulate = button('Simulate verified address and preview delivery', () => runPreview(true), true); simulate.hidden = true;
    const changed = () => { requestVersion++; verificationPending = false; simulate.hidden = true; status.textContent = ''; status.className = 'snapshot-small'; };
    email.addEventListener('input', () => { state.email = email.value.trim(); changed(); refreshChoices(); });
    for (const [key, label] of [
      ['resultEmailConsent', 'Yes, email this snapshot to me.'],
      ['mailingListConsent', 'Yes, send me wellness tips and news from Your Pure Path. I can unsubscribe at any time.']
    ]) {
      const option = element('label', undefined, 'consent-option');
      const input = element('input'); input.type = 'checkbox'; input.className = 'delivery-consent'; input.checked = state[key];
      const copy = element('span', key === 'mailingListConsent' ? newsletterConsentText(state.newsletterTopics) : label);
      if (key === 'mailingListConsent') { listCheck = input; listCopy = copy; }
      input.addEventListener('change', () => { state[key] = input.checked; changed(); refreshChoices(); });
      option.append(input, copy); section.append(option);
    }
    appendNewsletterTopics(section, { document, state, onChange() { state.mailingListConsent = false; listCheck.checked = false; changed(); refreshChoices(); } });
    section.append(element('h4', 'Newsletter request preview')); newsletterPreview = element('pre', '', 'email-preview'); section.append(newsletterPreview); refreshChoices();
    const preview = element('details');
    preview.open = true;
    preview.append(element('summary', 'See the exact snapshot email preview'));
    const text = snapshotEmailText(snapshot);
    preview.append(element('pre', text, 'email-preview')); section.append(preview);
    const submit = button('Preview my email choices', () => runPreview(false));
    section.append(actions(submit, simulate), status);
    const privacyLink = element('a', sources.privacy.title); privacyLink.href = sources.privacy.url; privacyLink.target = '_blank'; privacyLink.rel = 'noopener noreferrer';
    const privacy = element('p', undefined, 'snapshot-small'); privacy.append(privacyLink); section.append(privacy);
    async function runPreview(verified) {
      if (verified && !verificationPending) return;
      const renderVersion = generation;
      const version = ++requestVersion;
      submit.disabled = true; simulate.disabled = true;
      try {
        const response = await previewDelivery({ adapter: delivery, email: state.email, resultEmailConsent: state.resultEmailConsent, mailingListConsent: state.mailingListConsent, newsletterTopics: [...state.newsletterTopics], snapshot: text, verified });
        if (renderVersion !== generation || version !== requestVersion) return;
        if (response.verification) {
          verificationPending = true; simulate.hidden = false;
          status.textContent = `Not sent. Neutral address-verification preview: ${response.verification.message} Use the simulation button to continue this mock.`;
        } else {
          verificationPending = false; simulate.hidden = true;
          status.textContent = `Not sent. Mock preview completed for: ${response.outcomes.map(outcome => outcome.purpose === 'result-email' ? 'snapshot email' : 'mailing-list request').join(' and ')}. No email or subscription was created.`;
        }
        status.className = 'snapshot-small';
      } catch (error) {
        if (renderVersion !== generation || version !== requestVersion) return;
        status.textContent = error.message; status.className = 'snapshot-error';
      } finally { submit.disabled = false; simulate.disabled = false; }
    }
    return section;
  }

  showGate();
  return Object.freeze({ reset, dispose() { generation++; state = createSnapshotState(); root.replaceChildren(); } });
}
