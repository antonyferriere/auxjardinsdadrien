/* ===============================
   GALLERY
   - Chargement depuis un répertoire racine
   - Catégories sur les sous répertoires
   =============================== */

// Configuration
const IMAGES_PER_PAGE = 6;
const BASE_URL = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);

// Variables globales
let imageDatabase = [];
let filterBtns = [];
let allImages = [];
let filteredImages = [];
let currentPage = 1;
let currentFilter = 'all';

const galleryContainer = document.getElementById('gallery');
const galleryLoading = document.getElementById('gallery-loading');
const galleryFilters = document.getElementById('gallery-filters');
const paginationContainer = document.getElementById('pagination-container');
const paginationNumbers = document.getElementById('pagination-numbers');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

// Chargement des images
async function loadImages() {
  try {
    galleryLoading.style.display = 'flex';

    // Charger la base de données d'images
    const res = await fetch(`${BASE_URL}/galleryImages.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Impossible de charger galleryImages.json');
    imageDatabase = await res.json();

    // Générer les filtres dynamiquement
    generateFilters();

    // Construire la liste complète des images
    allImages = [];
    Object.keys(imageDatabase).forEach((category) => {
      imageDatabase[category].forEach((image) => {
        allImages.push({
          ...image,
          category,
          src: `${BASE_URL}${image.url}`,
          title: image.title,
          description: image.description,
        });
      });
    });

    filteredImages = [...allImages];

    galleryLoading.style.display = 'none';
    renderGallery();
    renderPagination();
    paginationContainer.style.display = 'flex';
  } catch (error) {
    console.error('Erreur de chargement des images :', error);
    galleryLoading.innerHTML = '<p>Erreur de chargement des images</p>';
  }
}
// Génération dynamique des filtres
function generateFilters() {
  galleryFilters.innerHTML = '';

  // Bouton "Tout voir"
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.dataset.filter = 'all';
  allBtn.textContent = 'Tout voir';
  galleryFilters.appendChild(allBtn);

  // Boutons pour chaque catégorie dans imageDatabase
  Object.keys(imageDatabase).forEach((category) => {
    const categoryBtn = document.createElement('button');
    categoryBtn.className = 'filter-btn';
    categoryBtn.dataset.filter = category;

    // Utiliser le label personnalisé ou capitaliser le nom de catégorie
    const label = category.charAt(0).toUpperCase() + category.slice(1);
    categoryBtn.textContent = label;

    galleryFilters.appendChild(categoryBtn);
  });

  // Mettre à jour la référence aux boutons
  filterBtns = Array.from(document.querySelectorAll('.filter-btn'));

  // Ajouter les event listeners
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', handleFilterClick);
  });
}

// Gestionnaire de clic sur les filtres
function handleFilterClick(e) {
  const btn = e.target;
  const filter = btn.dataset.filter;
  currentFilter = filter;
  currentPage = 1;

  // Update active button
  filterBtns.forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');

  // Filter images
  if (filter === 'all') {
    filteredImages = [...allImages];
  } else {
    filteredImages = allImages.filter((img) => img.category === filter);
  }

  renderGallery();
  renderPagination();
}

// Rendu de la galerie
function renderGallery() {
  const startIndex = (currentPage - 1) * IMAGES_PER_PAGE;
  const endIndex = startIndex + IMAGES_PER_PAGE;
  const pageImages = filteredImages.slice(startIndex, endIndex);

  galleryContainer.innerHTML = '';

  pageImages.forEach((image, index) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.category = image.category;
    item.style.animationDelay = `${(index + 1) * 0.1}s`;

    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.title;
    img.loading = 'lazy';

    // Gestion d'erreur pour charger la vraie image
    const realImg = new Image();
    realImg.onload = () => {
      img.src = image.src;
    };
    realImg.onerror = () => {
      // Garder l'image fallback si la vraie image n'existe pas
      console.log(`Image non trouvée: ${image.src}`);
    };
    realImg.src = image.src;

    const overlay = document.createElement('div');
    overlay.className = 'gallery-overlay';

    const caption = document.createElement('p');
    caption.className = 'gallery-caption';
    caption.textContent = image.title;

    overlay.appendChild(caption);
    item.appendChild(img);
    item.appendChild(overlay);

    // Event listener pour lightbox
    item.addEventListener('click', () => {
      currentImageIndex = startIndex + index;
      openLightbox();
    });

    galleryContainer.appendChild(item);
  });
}

// Rendu pagination
function renderPagination() {
  const totalPages = Math.ceil(filteredImages.length / IMAGES_PER_PAGE);

  // Mettre à jour les boutons prev/next
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;

  // Mettre à jour l'info page
  pageInfo.textContent = `Page ${currentPage} sur ${totalPages}`;

  // Générer les numéros de page
  paginationNumbers.innerHTML = '';

  // Logique d'affichage des pages (max 5 numéros visibles)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  // Page 1 si pas dans la plage
  if (startPage > 1) {
    const firstBtn = createPageButton(1);
    paginationNumbers.appendChild(firstBtn);

    if (startPage > 2) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.className = 'pagination-info';
      paginationNumbers.appendChild(dots);
    }
  }

  // Pages de la plage
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = createPageButton(i);
    paginationNumbers.appendChild(pageBtn);
  }

  // Dernière page si pas dans la plage
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.className = 'pagination-info';
      paginationNumbers.appendChild(dots);
    }

    const lastBtn = createPageButton(totalPages);
    paginationNumbers.appendChild(lastBtn);
  }
}

function createPageButton(pageNum) {
  const btn = document.createElement('button');
  btn.className = 'pagination-btn';
  btn.textContent = pageNum;

  if (pageNum === currentPage) {
    btn.classList.add('active');
  }

  btn.addEventListener('click', () => goToPage(pageNum));

  return btn;
}

function goToPage(page) {
  currentPage = page;
  renderGallery();
  renderPagination();

  // Calculate header height and add some padding
  const header = document.getElementById('site-header');
  const headerHeight = header ? header.offsetHeight : 0;
  const additionalOffset = 20; // Extra spacing for better visual separation

  const elementTop = galleryFilters.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementTop - headerHeight - additionalOffset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  });
}

// Navigation pagination
prevPageBtn.addEventListener('click', () => {
  if (currentPage > 1) goToPage(currentPage - 1);
});

nextPageBtn.addEventListener('click', () => {
  const totalPages = Math.ceil(filteredImages.length / IMAGES_PER_PAGE);
  if (currentPage < totalPages) goToPage(currentPage + 1);
});

// LIGHTBOX (mis à jour pour la pagination)
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxDescription = document.getElementById('lightbox-description');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxCounter = document.getElementById('lightbox-counter');

let currentImageIndex = 0;

function openLightbox() {
  const image = filteredImages[currentImageIndex];

  lightboxImage.src = image.fallbackSrc;
  lightboxImage.alt = image.title;
  lightboxTitle.textContent = image.title;
  lightboxDescription.textContent = image.description;
  lightboxCounter.textContent = `${currentImageIndex + 1} / ${filteredImages.length}`;

  // Essayer de charger la vraie image
  const realImg = new Image();
  realImg.onload = () => {
    lightboxImage.src = image.src;
  };
  realImg.src = image.src;

  lightbox.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('show');
  document.body.style.overflow = '';
}

function showPrevImage() {
  currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : filteredImages.length - 1;
  openLightbox();
}

function showNextImage() {
  currentImageIndex = currentImageIndex < filteredImages.length - 1 ? currentImageIndex + 1 : 0;
  openLightbox();
}

// Event listeners lightbox
lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', showPrevImage);
lightboxNext.addEventListener('click', showNextImage);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

// Navigation clavier
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('show')) return;

  switch (e.key) {
    case 'Escape':
      closeLightbox();
      break;
    case 'ArrowLeft':
      showPrevImage();
      break;
    case 'ArrowRight':
      showNextImage();
      break;
  }
});

// Support touch/swipe
let touchStartX = 0;
let touchEndX = 0;

lightbox.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

lightbox.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      showNextImage();
    } else {
      showPrevImage();
    }
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', loadImages);
