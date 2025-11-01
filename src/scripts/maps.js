// Configuration
const VENCE_COORDINATES = { lat: 43.7223, lng: 7.1136 };
const INTERVENTION_RADIUS = 30000; // 30 km en mètres

let map;
let circle;

// Initialisation de la carte Google Maps
function initMap() {
  const mapLoader = document.getElementById('map-loader');

  try {
    // Configuration de la carte
    map = new google.maps.Map(document.getElementById('google-map'), {
      zoom: 10,
      center: VENCE_COORDINATES,
      mapTypeId: 'roadmap',
      styles: getCurrentMapStyle(),
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    // Marqueur principal pour Vence
    const venceMarker = new google.maps.Marker({
      position: VENCE_COORDINATES,
      map: map,
      title: "Aux Jardins d'Adrien - Vence",
      icon: {
        url:
          'data:image/svg+xml;charset=UTF-8,' +
          encodeURIComponent(`
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="18" fill="#8daf23" stroke="#ffffff" stroke-width="4"/>
                  <circle cx="20" cy="20" r="8" fill="#ffffff"/>
                </svg>
              `),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
      },
    });

    // Info window pour Vence
    const venceInfoWindow = new google.maps.InfoWindow({
      content: `
              <div style="padding: 10px; font-family: var(--font-text);">
                <h3 style="margin: 0 0 10px; color: #8daf23;">Aux Jardins d'Adrien</h3>
                <p style="margin: 0; font-size: 14px;">
                  1531 Chemin des Anciens Combattants en A.F.N<br>
                  Vence (06140)<br>
                  <strong>06 09 56 45 11</strong>
                </p>
              </div>
            `,
    });

    venceMarker.addListener('click', () => {
      venceInfoWindow.open(map, venceMarker);
    });

    // Cercle de 20km
    circle = new google.maps.Circle({
      strokeColor: '#8daf23',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#8daf23',
      fillOpacity: 0.1,
      map: map,
      center: VENCE_COORDINATES,
      radius: INTERVENTION_RADIUS,
    });

    // Masquer le loader
    mapLoader.classList.add('hidden');
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la carte:", error);
    mapLoader.innerHTML = '<p style="color: var(--text-2);">Erreur de chargement de la carte</p>';
  }
}

// Styles de carte pour les thèmes
function getCurrentMapStyle() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  if (isDark) {
    // Style sombre
    return [
      { elementType: 'geometry', stylers: [{ color: '#212121' }] },
      { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
      { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
      {
        featureType: 'administrative.country',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9e9e9e' }],
      },
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#bdbdbd' }],
      },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
      { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#1b1b1b' }],
      },
      { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
      { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
      {
        featureType: 'road.highway.controlled_access',
        elementType: 'geometry',
        stylers: [{ color: '#4e4e4e' }],
      },
      {
        featureType: 'road.local',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#616161' }],
      },
      { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
    ];
  } else {
    // Style par défaut (clair)
    return [];
  }
}

// Fonction pour mettre à jour le style de la carte selon le thème
function updateMapStyle() {
  if (map) {
    map.setOptions({ styles: getCurrentMapStyle() });
  }
}

// Fonction de basculement de thème
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  updateMapStyle();
}

// Gestion des erreurs de chargement de l'API Google Maps
window.gm_authFailure = function () {
  document.getElementById('map-loader').innerHTML =
    '<p style="color: var(--text-2); text-align: center; padding: 20px;">Erreur d\'authentification Google Maps<br>Veuillez vérifier votre clé API</p>';
};

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

// Initialisation automatique si l'API Google Maps est déjà chargée
if (typeof google !== 'undefined' && google.maps) {
  initMap();
}
