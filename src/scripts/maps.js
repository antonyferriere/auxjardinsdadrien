// Configuration
const VENCE_COORDINATES = [43.7223, 7.1136];
const INTERVENTION_RADIUS = 30000; // 30 km radius
const MAP_ZOOM = 10;

const MAP_SVG = `
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" fill="#8daf23" stroke="#ffffff" stroke-width="4"/>
    <circle cx="20" cy="20" r="8" fill="#ffffff"/>
  </svg>
`;

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
  const mapLoader = document.getElementById('map-loader');

  if (!mapContainer) return;

  if (typeof L === 'undefined') {
    console.error('Leaflet library is missing.');
    if (mapLoader) {
      mapLoader.innerHTML =
        '<p style="color: var(--text-2); text-align: center; padding: 20px;">Impossible de charger la carte pour le moment.</p>';
    }
    return;
  }

  const map = L.map(mapContainer, {
    zoomControl: true,
    scrollWheelZoom: true,
    attributionControl: true,
  }).setView(VENCE_COORDINATES, MAP_ZOOM);

  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  });
  const hideLoader = () => mapLoader?.classList.add('hidden');
  tiles.once('load', hideLoader);
  tiles.once('tileerror', hideLoader);
  tiles.addTo(map);

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

  L.circle(VENCE_COORDINATES, {
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

document.addEventListener('DOMContentLoaded', initMap);
