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
    group: 'Complete every part of this entry, or choose Not measured / Not sure or Prefer not to answer.',
    fallback: 'Provide an answer or choose Prefer not to answer before continuing.'
  },
  es: {
    choice: 'Elige una respuesta de la lista, No sé o Prefiero no responder antes de continuar.',
    number: 'Escribe un número válido dentro del rango indicado, o elige No sé o Prefiero no responder.',
    age: 'Escribe una edad entera de 18 a 100 años, o elige No sé o Prefiero no responder.',
    multi: 'Selecciona al menos un tema de la lista, o elige Ninguno, No sé o Prefiero no responder.',
    group: 'Completa todas las partes de esta entrada, o elige No medido / No sé o Prefiero no responder.',
    fallback: 'Responde o elige Prefiero no responder antes de continuar.'
  }
};

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isBlank = value => value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
const declined = value => value === 'preferNot' || value === 'skip';
const listed = (options, value) => typeof value === 'string' && Array.isArray(options) && options.some(option => option.id === value);
function completeGroup(question, value) {
  if (!isObject(value) || !Array.isArray(question.fields) || !question.fields.length) return false;
  return question.fields.every(field => {
    if (field.whenReading && value.readingStatus !== field.whenReading) return true;
    const entry = value[field.id];
    if (isBlank(entry)) return false;
    if (field.type === 'select' || field.type === 'radio') return listed(field.options, entry);
    if (field.type === 'number') return numericValue(entry) !== null;
    return false;
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
  if (question.type === 'group') {
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
