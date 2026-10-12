import { validateNewsletterTopics } from '../support-preferences.js';
export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// No provider, credentials, network, storage, console logging, or retained inbox.
// Each purpose has its own method and requires its own affirmative consent.
export function createMockDeliveryAdapter() {
  return Object.freeze({
    mode: 'mock',
    async requestAddressVerification({ email, consent }) {
      if (consent !== true || !isValidEmail(email)) throw new Error('Consent and a valid email are required.');
      return { status: 'mock-verification-pending', message: 'Please verify your email address for a request you made on Your Pure Path. This verification message contains no questionnaire answers.' };
    },
    async requestResultEmail({ email, consent, verified, snapshot }) {
      if (consent !== true || verified !== true || !isValidEmail(email) || typeof snapshot !== 'string') throw new Error('Result-email consent, address verification, and a valid email are required.');
      return { status: 'mock-only', purpose: 'result-email' };
    },
    async requestMailingList({ email, consent, topics = [] }) {
      if (consent !== true || !isValidEmail(email)) throw new Error('Mailing-list consent and a valid email are required.');
      validateNewsletterTopics(topics);
      return { status: 'mock-only', purpose: 'mailing-list' };
    }
  });
}

export async function previewDelivery({ adapter, email, resultEmailConsent, mailingListConsent, snapshot, verified = false, newsletterTopics = [] }) {
  if (adapter.mode !== 'mock') throw new Error('External delivery is not enabled.');
  if (!resultEmailConsent && !mailingListConsent) throw new Error('Choose an optional email purpose first.');
  if (!isValidEmail(email)) throw new Error('Enter a valid email address for the preview.');
  const outcomes = [];
  if (resultEmailConsent === true && verified !== true) {
    const verification = await adapter.requestAddressVerification({ email, consent: true });
    return { verification, outcomes: [] };
  }
  if (resultEmailConsent === true) outcomes.push(await adapter.requestResultEmail({ email, consent: true, verified: true, snapshot }));
  // Only explicitly selected topic IDs accompany email/consent. No answers, result, support response, or inferred tags.
  if (mailingListConsent === true) outcomes.push(await adapter.requestMailingList({ email, consent: true, topics: validateNewsletterTopics(newsletterTopics) }));
  return { outcomes };
}
