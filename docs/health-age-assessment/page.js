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
    document.getElementById('privacy-copy').textContent = language === 'en' ? "This assessment does not ask for a name or contact details. Age and health answers may still identify you. Start over, reload or leave to clear answers from this page. Downloaded, printed or shared copies remain outside this page. On a shared device, choose Start over before the next person. The optional Google Form receives no quiz data." : "Esta evaluación no pide nombre ni datos de contacto. La edad y las respuestas de salud aún podrían identificarte. Reinicia, recarga o sal para borrar las respuestas de esta página. Las descargas, copias impresas o compartidas permanecen fuera de ella. En un dispositivo compartido, pulsa Reiniciar antes de la siguiente persona. El formulario opcional de Google no recibe datos del cuestionario.";
    document.querySelector('.skip-link').textContent = language === 'en' ? 'Skip to quiz' : 'Ir al cuestionario';
    document.querySelector('.snapshot-footer').textContent = language === 'en' ? 'Your Pure Path · Educational local preview' : 'Your Pure Path · Vista previa educativa local';
    document.getElementById('eyebrow').textContent = language === 'en' ? 'A conversation, not a medical test' : 'Una conversación, no una prueba médica';
    document.getElementById('home-link').textContent = language === 'en' ? 'Back to home' : 'Volver al inicio';
    document.querySelector('#educational-age').setAttribute('aria-label', language === 'en' ? 'Illustrative health-age quiz' : 'Cuestionario ilustrativo de edad de salud');
  }
});
window.addEventListener('pagehide', () => ui.reset(false));
// A restored back/forward page must also start a fresh shared-device session.
window.addEventListener('pageshow', event => { if (event.persisted) ui.reset(false); });
