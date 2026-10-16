import { mountEducationalAge } from '../components/educational-age/component.js';
import { text } from '../components/educational-age/content.js';
import { createMockDeliveryAdapter } from '../components/wellness-snapshot/delivery.js';

const ui = mountEducationalAge(document.querySelector('#educational-age'), {
  delivery: createMockDeliveryAdapter(),
  showDeliveryPreview: false,
  onLanguage(language) {
    document.documentElement.lang = language;
    document.title = language === 'en' ? 'Illustrative Health-Age Quiz | Your Pure Path' : 'Cuestionario ilustrativo de edad de salud | Your Pure Path';
    for (const [id, key] of [['quiz-title', 'title'], ['intro', 'intro'], ['adult', 'adult']]) document.getElementById(id).textContent = text[key][language];
    document.getElementById('privacy-copy').textContent = language === 'en' ? 'Answers stay in this page’s memory and clear when you start over, reload, or leave. Results are visible and downloadable without email. Email and newsletter signups are not enabled. The separate optional Google Form receives no quiz data from this page.' : 'Las respuestas quedan en la memoria de esta página y se borran al reiniciar, recargar o salir. Puedes ver y descargar resultados sin correo. No hay envíos ni suscripciones activas. El formulario opcional de Google no recibe datos del cuestionario desde esta página.';
    document.querySelector('.skip-link').textContent = language === 'en' ? 'Skip to quiz' : 'Ir al cuestionario';
    document.querySelector('.snapshot-footer').textContent = language === 'en' ? 'Your Pure Path · Educational local preview' : 'Your Pure Path · Vista previa educativa local';
    document.getElementById('eyebrow').textContent = language === 'en' ? 'A conversation, not a medical test' : 'Una conversación, no una prueba médica';
    document.getElementById('home-link').textContent = language === 'en' ? 'Back to home' : 'Volver al inicio';
    document.getElementById('privacy-title').textContent = language === 'en' ? 'Results without email.' : 'Resultados sin correo.';
    document.getElementById('snapshot-link').textContent = language === 'en' ? 'Optional: 8-question Wellness Snapshot (no age estimate)' : 'Opcional: Wellness Snapshot de 8 preguntas (sin estimación de edad)';
    document.getElementById('event-signup').textContent = language === 'en' ? 'Optional: sign up for future events' : 'Opcional: inscribirme para futuros eventos';
    document.querySelector('#educational-age').setAttribute('aria-label', language === 'en' ? 'Illustrative health-age quiz' : 'Cuestionario ilustrativo de edad de salud');
  }
});
window.addEventListener('pagehide', () => ui.reset(false));
