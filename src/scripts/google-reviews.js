const REVIEWS_ENDPOINT = '/scripts/google-review.json';
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

const sanitizeReviews = (rawReviews = []) =>
  rawReviews
    .filter((review) => Number(review.rating) >= 4 && review.text && review.text.text)
    .map((review) => ({
      ...review,
      rating: Math.round(Number(review.rating) || 0),
    }));

const shuffleReviews = (items = []) => [...items].sort(() => Math.random() - 0.5);

const loadLocalReviews = async () => {
  const response = await fetch(REVIEWS_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Impossible de charger les avis (${response.status})`);
  }
  return response.json();
};

async function displayGoogleReviews() {
  const container = document.getElementById('google-reviews');
  if (!container) return;

  try {
    const reviews = sanitizeReviews(await loadLocalReviews());
    const orderedReviews = shuffleReviews(reviews).slice(0, 3);

    if (!orderedReviews.length) {
      container.innerHTML =
        '<p class="testimonial-text">Les avis sont temporairement indisponibles.</p>';
      return;
    }

    orderedReviews.forEach((review) => {
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
          <p class="testimonial-text">${escapeHtml(review.text.text)}</p>
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
  } catch (error) {
    console.error('Impossible de charger les avis', error);
    container.innerHTML =
      '<p class="testimonial-text">Les avis sont temporairement indisponibles.</p>';
  }
}

document.addEventListener('DOMContentLoaded', displayGoogleReviews);
