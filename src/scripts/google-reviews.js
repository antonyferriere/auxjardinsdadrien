const apiKey = 'AIzaSyAEGFBK_ZLae9kogIr_tH4kZW-yoKidTkI';
const placeId = 'ChIJoTkJZTjVzRIR44HWogEyy_M';

async function displayGoogleReviews() {
  const container = document.getElementById('google-reviews');
  if (!container) return;
  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'reviews'
      }
    });
    const data = await response.json();
    const reviews = (data.reviews || []).filter((r) => r.rating === 5);
    reviews.sort(() => Math.random() - 0.5);
    reviews.slice(0, 3).forEach((review) => {
      const blockquote = document.createElement('blockquote');
      blockquote.className = 'card card-flat';
      blockquote.innerHTML = `
        <div class="card-content">
          <p class="testimonial-text">${review.text.text}</p>
        </div>
        <footer class="testimonial-footer">
          <div class="stars" aria-label="${review.rating} étoiles sur 5">${'★'.repeat(review.rating)}</div>
          <cite>${review.authorAttribution.displayName}</cite>
        </footer>
      `;
      container.appendChild(blockquote);
    });
  } catch (error) {
    console.error('Failed to load Google reviews', error);
  }
}

document.addEventListener('DOMContentLoaded', displayGoogleReviews);
