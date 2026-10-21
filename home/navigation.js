// A disclosure menu, not a modal: normal Tab navigation remains available.
const header = document.querySelector('.site-header');
const toggle = header.querySelector('.menu-toggle');
const navigation = document.getElementById('site-navigation');
const mobile = window.matchMedia('(max-width: 900px)');
document.body.classList.add('nav-enhanced');
function closeMenu(returnFocus = false) {
  toggle.setAttribute('aria-expanded', 'false');
  toggle.querySelector('span').textContent = 'Menu';
  navigation.hidden = mobile.matches;
  if (returnFocus && mobile.matches) toggle.focus();
}
function openMenu() {
  navigation.hidden = false;
  toggle.setAttribute('aria-expanded', 'true');
  toggle.querySelector('span').textContent = 'Close';
  navigation.querySelector('a').focus();
}
toggle.addEventListener('click', () => {
  if (toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
  else openMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobile.matches && toggle.getAttribute('aria-expanded') === 'true') {
    event.preventDefault(); closeMenu(true);
  }
});
document.addEventListener('pointerdown', event => {
  if (mobile.matches && !header.contains(event.target)) closeMenu();
});
header.addEventListener('focusout', event => {
  if (mobile.matches && !header.contains(event.relatedTarget)) closeMenu();
});
navigation.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  closeMenu();
  if (link.hash) document.querySelector(link.hash)?.focus({ preventScroll: true });
});
mobile.addEventListener('change', () => {
  const active = document.activeElement;
  const focusWasInNavigation = navigation.contains(active);
  closeMenu();
  if (mobile.matches && focusWasInNavigation) toggle.focus();
  else if (!mobile.matches && active === toggle) navigation.querySelector('a').focus();
});
closeMenu();
