/* ===============================
   ANIMATION HEADER
   =============================== */
/* Gestion classe page-top sur le header */
function updateHeaderClass() {
  if (window.scrollY === 0) {
    header.classList.add('page-top');
  } else {
    header.classList.remove('page-top');
  }
}

// Ajouter ces événements avec les autres
window.addEventListener('scroll', updateHeaderClass, { passive: true });
window.addEventListener('DOMContentLoaded', updateHeaderClass);

/* ===============================
   UTILITAIRES THÈME
   =============================== */
const docEl = document.documentElement;
const header = document.getElementById('site-header');
const hero = document.getElementById('hero');
const themeToggles = document.querySelectorAll('.theme-toggle');
const yearEl = document.getElementById('year');

/* Année footer */
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* Bascule thème + mémorisation */
function setTheme(next) {
  docEl.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  // Recharger les images du carrousel si besoin
  if (typeof applyHeroImage === 'function') applyHeroImage(true);
}
themeToggles.forEach((toggle) => {
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const cur = docEl.getAttribute('data-theme') || 'light';
    setTheme(cur === 'light' ? 'dark' : 'light');
    return false;
  });
});

/* ===============================
   MENU MOBILE SLIDE-IN
   =============================== */
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobile-nav');
const scrim = document.getElementById('scrim');

function openNav() {
  burger.classList.add('open');
  mobileNav.classList.add('open');
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add('show'));
  burger.setAttribute('aria-expanded', 'true');
  mobileNav.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeNav() {
  burger.classList.remove('open');
  mobileNav.classList.remove('open');
  scrim.classList.remove('show');
  setTimeout(() => {
    scrim.hidden = true;
  }, 200);
  burger.setAttribute('aria-expanded', 'false');
  mobileNav.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
if (burger)
  burger.addEventListener('click', () => {
    mobileNav.classList.contains('open') ? closeNav() : openNav();
  });
if (scrim) scrim.addEventListener('click', closeNav);

/* Fermer menu sur clic d'un lien */
mobileNav?.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (a) closeNav();
});

/* ===============================
   NAVIGATION DATA-HREF
   =============================== */
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-href]');
  if (target) {
    e.preventDefault();
    window.location.href = target.dataset.href;
  }
});
