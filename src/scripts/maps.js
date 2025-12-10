// Configuration
const VENCE_COORDINATES = [43.7223, 7.1136];
const INTERVENTION_RADIUS = 30000; // 30 km radius
const MAP_ZOOM = 10;

let map;
let circle;
let activeTileLayer;
let tileLayers = {};
let mapLoader;

const MAP_SVG = `
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#8daf23" stroke="#ffffff" stroke-width="4"/>
    <circle cx="20" cy="20" r="8" fill="#ffffff"/>
  </svg>
`;

function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function createTileLayers() {
  tileLayers = {
    light: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap contributors',
      maxZoom: 19,
    }),
  };
}

function showLoader() {
  if (mapLoader) {
    mapLoader.classList.remove('hidden');
  }
}

function hideLoader() {
  if (mapLoader) {
    mapLoader.classList.add('hidden');
  }
}

function setTileLayer(theme) {
  if (!map || !tileLayers.light || !tileLayers.dark) return;

  const nextLayer = theme === 'dark' ? tileLayers.dark : tileLayers.light;
  if (activeTileLayer === nextLayer) return;

  if (activeTileLayer) {
    activeTileLayer.off('load', hideLoader);
    activeTileLayer.off('tileerror', hideLoader);
    map.removeLayer(activeTileLayer);
  }

  showLoader();
  nextLayer.once('load', hideLoader);
  nextLayer.once('tileerror', hideLoader);
  nextLayer.addTo(map);
  activeTileLayer = nextLayer;
}

function buildMarkerIcon() {
  return L.icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(MAP_SVG),
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -12],
  });
}

// Initialisation de la carte Leaflet
function initMap() {
  const mapContainer = document.getElementById('google-map');
  mapLoader = document.getElementById('map-loader');

  if (!mapContainer) return;

  if (typeof L === 'undefined') {
    console.error('Leaflet library is missing.');
    if (mapLoader) {
      mapLoader.innerHTML =
        '<p style="color: var(--text-2); text-align: center; padding: 20px;">Impossible de charger la carte pour le moment.</p>';
    }
    return;
  }

  createTileLayers();

  map = L.map(mapContainer, {
    zoomControl: true,
    scrollWheelZoom: true,
    attributionControl: true,
  }).setView(VENCE_COORDINATES, MAP_ZOOM);

  setTileLayer(getCurrentTheme());

  const marker = L.marker(VENCE_COORDINATES, {
    icon: buildMarkerIcon(),
    title: "Aux Jardins d'Adrien - Vence",
  }).addTo(map);

  marker.bindPopup(`
    <div style="padding: 10px; font-family: var(--font-text);">
      <h3 style="margin: 0 0 10px; color: #8daf23;">Aux Jardins d'Adrien</h3>
      <p style="margin: 0; font-size: 14px;">
        1531 Chemin des Anciens Combattants en A.F.N<br>
        Vence (06140)<br>
        <strong>06 09 56 45 11</strong>
      </p>
    </div>
  `);

  circle = L.circle(VENCE_COORDINATES, {
    radius: INTERVENTION_RADIUS,
    color: '#8daf23',
    weight: 2,
    opacity: 0.8,
    fillColor: '#8daf23',
    fillOpacity: 0.1,
  }).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 100);
}

function updateMapStyle() {
  setTileLayer(getCurrentTheme());
}

// Observer pour les changements de thème
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
      updateMapStyle();
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});

document.addEventListener('DOMContentLoaded', initMap);
