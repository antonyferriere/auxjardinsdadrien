const apiKey = 'AIzaSyAEGFBK_ZLae9kogIr_tH4kZW-yoKidTkI';
const placeId = 'ChIJoTkJZTjVzRIR44HWogEyy_M';

const STAR_ICON = '&#9733;';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });

const getInitials = (value = '') => {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]);
  if (!parts.length) {
    return '?';
  }
  return parts.slice(0, 2).join('').toUpperCase();
};

async function displayGoogleReviews() {
  const container = document.getElementById('google-reviews');
  const button = document.getElementById('load-more-reviews');
  if (!container) return;
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'reviews',
        },
      }
    );
    const data = await response.json();
    const reviews = (data.reviews || []).filter(
      (r) => r.rating === 5 && r.text && r.text.text
    );
    reviews.sort(() => Math.random() - 0.5);
    let displayed = 0;

    const renderReviews = () => {
      const next = reviews.slice(displayed, displayed + 3);
      next.forEach((review) => {
        const blockquote = document.createElement('blockquote');
        blockquote.className = 'card card-flat';
        const authorName =
          review.authorAttribution?.displayName?.trim() || 'Client Google';
        const safeAuthorName = escapeHtml(authorName);
        const avatarUrl = review.authorAttribution?.photoUri;
        const safeAvatarUrl = avatarUrl ? escapeHtml(avatarUrl) : '';
        const initials = escapeHtml(getInitials(authorName));
        const avatarMarkup = avatarUrl
          ? `<img class="testimonial-avatar" src="${safeAvatarUrl}" alt="Photo de ${safeAuthorName}" loading="lazy" width="48" height="48" />`
          : `<span class="testimonial-avatar testimonial-avatar--initials" aria-hidden="true">${initials}</span>`;
        blockquote.innerHTML = `
        <div class="card-content">
          <p class="testimonial-text">${review.text.text}</p>
        </div>
        <footer class="testimonial-footer">
          <div class="testimonial-author">
            ${avatarMarkup}
            <div class="testimonial-meta">
              <div class="stars" aria-label="${review.rating} étoiles sur 5">${STAR_ICON.repeat(
          review.rating
        )}</div>
              <cite>${safeAuthorName}</cite>
            </div>
          </div>
        </footer>
      `;
        container.appendChild(blockquote);
      });
      displayed += next.length;
      if (displayed >= reviews.length && button) {
        button.style.display = 'none';
      }
    };

    renderReviews();

    if (button) {
      if (reviews.length > 3) {
        button.style.display = 'block';
      }
      button.addEventListener('click', renderReviews);
    }
  } catch (error) {
    console.error('Failed to load Google reviews', error);
  }
}

document.addEventListener('DOMContentLoaded', displayGoogleReviews);
