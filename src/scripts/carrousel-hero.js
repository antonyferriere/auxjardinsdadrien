/* ===============================
   CARROUSEL FULLSCREEN
   - Images différentes selon le thème
   - 100svh, overlay pour lisibilité
   =============================== */
const slideDelay = 5500;
const heroSlide = document.querySelector('.hero-slide');
const dots = Array.from(document.querySelectorAll('.dot'));

// Définir le chemin de base pour les images
const BASE_URL = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));

const lightImages = [
  `${BASE_URL}/images/carrousel/carrousel_light_1.webp`,
  `${BASE_URL}/images/carrousel/carrousel_dark_3.webp`,
  `${BASE_URL}/images/carrousel/carrousel_light_2.webp`,
  `${BASE_URL}/images/carrousel/carrousel_dark_4.webp`,
  `${BASE_URL}/images/carrousel/carrousel_light_5.webp`,
  `${BASE_URL}/images/carrousel/carrousel_light_3.webp`,
];

const darkImages = [
  `${BASE_URL}/images/carrousel/carrousel_light_1.webp`,
  `${BASE_URL}/images/carrousel/carrousel_dark_3.webp`,
  `${BASE_URL}/images/carrousel/carrousel_light_2.webp`,
  `${BASE_URL}/images/carrousel/carrousel_dark_4.webp`,
  `${BASE_URL}/images/carrousel/carrousel_light_5.webp`,
  `${BASE_URL}/images/carrousel/carrousel_light_3.webp`,
];

let slideIdx = 0;
let slideTimer;

function activeImages() {
  return docEl.getAttribute('data-theme') === 'dark' ? darkImages : lightImages;
}

function applyHeroImage(force = false) {
  const imgs = activeImages();
  slideIdx = force ? 0 : slideIdx % imgs.length;
  // Précharger la nouvelle image
  const img = new Image();
  img.onload = () => {
    // Sauvegarder l'image actuelle comme précédente
    const currentImage = heroSlide.style.backgroundImage;
    if (currentImage) {
      heroSlide.style.setProperty('--previous-image', currentImage);
      heroSlide.classList.add('transitioning');
    }

    // Appliquer la nouvelle image
    heroSlide.style.backgroundImage = `url('${imgs[slideIdx]}')`;

    // Retirer la classe après la transition
    setTimeout(() => {
      heroSlide.classList.remove('transitioning');
      updateDots();
    }, 1);
  };

  img.src = imgs[slideIdx];
}

function nextSlide() {
  slideIdx = (slideIdx + 1) % activeImages().length;
  applyHeroImage();
}

function goToSlide(i) {
  const imgs = activeImages();
  // Sauvegarder l'image actuelle comme précédente
  const currentImage = heroSlide.style.backgroundImage;
  if (currentImage) {
    heroSlide.style.setProperty('--previous-image', currentImage);
    heroSlide.classList.add('transitioning');
  }

  // Appliquer la nouvelle image
  slideIdx = i % imgs.length;
  heroSlide.style.backgroundImage = `url('${imgs[slideIdx]}')`;

  // Retirer la classe après la transition
  setTimeout(() => {
    heroSlide.classList.remove('transitioning');
    updateDots();
  }, 1);

  restartTimer();
}

function updateDots() {
  dots.forEach((d, i) => d.classList.toggle('active', i === slideIdx));
}

function startTimer() {
  slideTimer = setInterval(nextSlide, slideDelay);
}
function restartTimer() {
  clearInterval(slideTimer);
  startTimer();
}

document.addEventListener('DOMContentLoaded', () => {
  applyHeroImage(true);
  startTimer();
  dots.forEach((d) => d.addEventListener('click', () => goToSlide(parseInt(d.dataset.slide, 10))));
});

/* Ajuster la hauteur du hero si besoin sur iOS navbars (optionnel) */
window.addEventListener(
  'resize',
  () => {
    // rien de spécial ici, min-height:100svh gère déjà bien
  },
  { passive: true }
);
