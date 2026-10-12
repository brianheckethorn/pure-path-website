import { mountEducationalAge } from '../components/educational-age/component.js';
import { text } from '../components/educational-age/content.js';
import { createMockDeliveryAdapter } from '../components/wellness-snapshot/delivery.js';

const ui = mountEducationalAge(document.querySelector('#educational-age'), {
  delivery: createMockDeliveryAdapter(),
  onLanguage(language) {
    document.documentElement.lang = language;
    document.title = language === 'en' ? 'Illustrative Health-Age Quiz | Your Pure Path' : 'Cuestionario ilustrativo de edad de salud | Your Pure Path';
    for (const [id, key] of [['quiz-title', 'title'], ['intro', 'intro'], ['adult', 'adult'], ['privacy-copy', 'privacy']]) document.getElementById(id).textContent = text[key][language];
    document.querySelector('.skip-link').textContent = language === 'en' ? 'Skip to quiz' : 'Ir al cuestionario';
    document.querySelector('.snapshot-footer').textContent = language === 'en' ? 'Your Pure Path · Educational local preview' : 'Your Pure Path · Vista previa educativa local';
    document.getElementById('eyebrow').textContent = language === 'en' ? 'A conversation, not a medical test' : 'Una conversación, no una prueba médica';
    document.getElementById('home-link').textContent = language === 'en' ? 'Back to home' : 'Volver al inicio';
    document.getElementById('privacy-title').textContent = language === 'en' ? 'Results without email.' : 'Resultados sin correo.';
    document.getElementById('snapshot-link').textContent = language === 'en' ? 'Prefer the 8-question Wellness Snapshot?' : '¿Prefieres las 8 preguntas de Wellness Snapshot?';
    document.querySelector('#educational-age').setAttribute('aria-label', language === 'en' ? 'Illustrative health-age quiz' : 'Cuestionario ilustrativo de edad de salud');
  }
});
window.addEventListener('pagehide', () => ui.reset(false));
