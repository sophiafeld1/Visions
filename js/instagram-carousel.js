const FALLBACK_IMAGE = "images/v-neck-tie-top.jpg";

function renderInstagramCarousel() {
  const track = document.getElementById("instagram-track");
  if (!track) return;

  if (!INSTAGRAM_POSTS.length) {
    track.innerHTML = `
      <a class="instagram-card instagram-card--placeholder" href="${INSTAGRAM_PROFILE_URL}" target="_blank" rel="noopener noreferrer">
        <span>Follow @visionssclothing on Instagram</span>
      </a>
    `;
    return;
  }

  track.innerHTML = INSTAGRAM_POSTS.map(
    (post) => `
      <a
        class="instagram-card"
        href="${post.url || INSTAGRAM_PROFILE_URL}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          class="instagram-card__image"
          src="${post.image}"
          alt="${post.alt || "Visions on Instagram"}"
          loading="lazy"
          onerror="this.src='${FALLBACK_IMAGE}'"
        />
      </a>
    `
  ).join("");
}

function initInstagramCarousel() {
  renderInstagramCarousel();

  const carousel = document.querySelector(".instagram-carousel");
  const track = document.getElementById("instagram-track");
  const prevButton = document.querySelector(".instagram-carousel__nav--prev");
  const nextButton = document.querySelector(".instagram-carousel__nav--next");

  if (!carousel || !track || !prevButton || !nextButton) return;

  const scrollAmount = () => Math.max(track.clientWidth * 0.7, 260);

  prevButton.addEventListener("click", () => {
    track.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
  });

  nextButton.addEventListener("click", () => {
    track.scrollBy({ left: scrollAmount(), behavior: "smooth" });
  });
}

initInstagramCarousel();
