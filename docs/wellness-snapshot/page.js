import { mountWellnessSnapshot } from '../components/wellness-snapshot/component.js';
import { snapshotContent } from '../components/wellness-snapshot/content.js';
import { createMockDeliveryAdapter } from '../components/wellness-snapshot/delivery.js';

const snapshot = mountWellnessSnapshot(document.querySelector('#wellness-snapshot'), {
  content: snapshotContent,
  delivery: createMockDeliveryAdapter(),
  showDeliveryPreview: false
});

// Clear in-memory answers when leaving the page, including browser back-cache.
window.addEventListener('pagehide', () => snapshot.reset(false));
