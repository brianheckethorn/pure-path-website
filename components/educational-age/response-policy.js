import { inputBounds, numericValue } from './scoring.js';
import { normalizeBaseMeasurements } from './measurements.js';
import { readingEntryIssues } from './reading-context.js';

// Completion policy is separate from scoring. An explicit declined/unknown
// answer satisfies this policy without supplying a missing score or consent.
const copy = {
  en: {
    choice: 'Choose a listed answer, Not sure, or Prefer not to answer before continuing.',
    number: 'Enter a valid number within the range shown, or choose Not sure or Prefer not to answer.',
    age: 'Enter a whole-number age from 18 to 100, or choose Not sure or Prefer not to answer.',
    multi: 'Select at least one listed topic, or choose None, Not sure, or Prefer not to answer.',
    text: max => `Enter a first name or nickname of up to ${max} characters, or choose Prefer not to answer.`,
    group: 'Complete every part of this entry, or choose Not measured / Not sure or Prefer not to answer.',
    contact: 'Enter at least one contact note, or choose Prefer not to answer. No email address or delivery consent is required.',
    contactField: (label, max) => `Check ${label}: use text of up to ${max} characters, clear this field, or choose Prefer not to answer.`,
    email: 'Check the email address you entered, clear this field, or choose Prefer not to answer. This does not authorize email delivery.',
    fallback: 'Provide an answer or choose Prefer not to answer before continuing.'
  },
  es: {
    choice: 'Elige una respuesta de la lista, No sé o Prefiero no responder antes de continuar.',
    number: 'Escribe un número válido dentro del rango indicado, o elige No sé o Prefiero no responder.',
    age: 'Escribe una edad entera de 18 a 100 años, o elige No sé o Prefiero no responder.',
    multi: 'Selecciona al menos un tema de la lista, o elige Ninguno, No sé o Prefiero no responder.',
    text: max => `Escribe un nombre o apodo de hasta ${max} caracteres, o elige Prefiero no responder.`,
    group: 'Completa todas las partes de esta entrada, o elige No medido / No sé o Prefiero no responder.',
    contact: 'Escribe al menos un dato de contacto, o elige Prefiero no responder. No se requiere correo ni consentimiento para recibir mensajes.',
    contactField: (label, max) => `Revisa ${label}: usa texto de hasta ${max} caracteres, borra este campo o elige Prefiero no responder.`,
    email: 'Revisa el correo que escribiste, borra este campo o elige Prefiero no responder. Esto no autoriza el envío de correos.',
    fallback: 'Responde o elige Prefiero no responder antes de continuar.'
  }
};

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isBlank = value => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
const declined = value => value === 'preferNot' || value === 'skip';
const listed = (options, value) => typeof value === 'string' && Array.isArray(options) && options.some(option => option.id === value);
const maxLength = field => Number.isInteger(field.maxLength) && field.maxLength > 0 ? field.maxLength : 120;
const boundedText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
function validEmail(value) {
  if (value.length > 254) return false;
  const parts = value.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  // Check common mailbox syntax only; this does not verify ownership, make a
  // delivery request, or require the participant to provide an email address.
  if (!local || local.length > 64 || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  const domainLabels = domain.split('.');
  return domainLabels.length >= 2 && domainLabels.every(label => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label));
}

function contactIssue(question, value, text, language) {
  if (!isObject(value)) return text.contact;
  let entered = false;
  for (const field of question.fields || []) {
    const entry = value[field.id];
    if (isBlank(entry)) continue;
    entered = true;
    const limit = maxLength(field);
    if (!boundedText(entry, limit)) return text.contactField(field.label?.[language] || field.id, limit);
    if (field.type === 'email' && !validEmail(entry.trim())) return text.email;
  }
  return entered ? null : text.contact;
}

function completeGroup(question, value) {
  if (!isObject(value) || !Array.isArray(question.fields) || !question.fields.length) return false;
  return question.fields.every(field => {
    if (field.whenReading && value.readingStatus !== field.whenReading) return true;
    const entry = value[field.id];
    if (isBlank(entry)) return false;
    if (field.type === 'select' || field.type === 'radio') return listed(field.options, entry);
    if (field.type === 'number') return numericValue(entry) !== null;
    return boundedText(entry, maxLength(field));
  });
}

export function questionResponseIssue(question, answers = {}, language = 'en') {
  const locale = language === 'es' ? 'es' : 'en';
  const text = copy[locale];
  const source = isObject(answers) ? answers : {};
  if (!question || typeof question.id !== 'string') return text.fallback;
  const value = source[question.id];
  if (declined(value)) return null;

  if (question.type === 'number') {
    if (value === 'unknown') return null;
    const normalized = ['height', 'weight'].includes(question.id) ? normalizeBaseMeasurements(source)[question.id] : value;
    const number = numericValue(normalized);
    const bounds = inputBounds[question.id];
    if (number === null || (bounds && (number < bounds.min || number > bounds.max || (bounds.integer && !Number.isInteger(number))))) return question.id === 'age' ? text.age : text.number;
    return null;
  }
  if (question.type === 'radio') return value === 'unknown' || listed(question.options, value) ? null : text.choice;
  if (question.type === 'multi') {
    if (value === 'none' || value === 'unknown') return null;
    if (!Array.isArray(value) || !value.length || new Set(value).size !== value.length || !value.every(entry => listed(question.options, entry))) return text.multi;
    return null;
  }
  if (question.type === 'text') return boundedText(value, maxLength(question)) ? null : text.text(maxLength(question));
  if (question.type === 'group') {
    if (question.id === 'reportContact') return contactIssue(question, value, text, locale);
    if (value === 'unknown') return null;
    if (!completeGroup(question, value)) return text.group;
    return readingEntryIssues({ [question.id]: value }, locale).find(issue => issue.id === question.id)?.message || null;
  }
  return text.fallback;
}

export function assessmentResponseIssues(questions, answers = {}, language = 'en') {
  return questions.flatMap(question => {
    const message = questionResponseIssue(question, answers, language);
    return message ? [{ id: question.id, message }] : [];
  });
}
