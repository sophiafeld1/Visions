async function loadProducts() {
  await loadProductsFromApi();

  const grid = document.getElementById("shop-grid");

  if (!PRODUCTS.length) {
    grid.innerHTML =
      '<p class="empty-state">No items yet. Add products in the database or js/products.js.</p>';
    return;
  }

  grid.innerHTML = PRODUCTS.map((product) => {
    const sizes = product.sizes?.length ? product.sizes : ["XS"];
    const colorLabel = product.color ? ` | ${product.color.toUpperCase()}` : "";
    const swatchColor = product.colorSwatch || "#d9d9d9";
    const hoverMedia = product.imageHover;
    const hasHover = Boolean(hoverMedia && hoverMedia !== product.image);
    const hoverIsVideo = hasHover && isVideoSrc(hoverMedia);

    return `
      <article class="product-card">
        <div class="product-card__media${hasHover ? " product-card__media--has-hover" : ""}${hoverIsVideo ? " product-card__media--has-hover-video" : ""}">
          <div class="product-card__image-stack">
            <img
              class="product-card__image product-card__image--primary"
              src="${product.image}"
              alt="${product.name}"
              loading="lazy"
            />
            ${
              hasHover
                ? hoverIsVideo
                  ? `<video
              class="product-card__image product-card__image--hover product-card__video--hover"
              src="${hoverMedia}"
              playsinline
              muted
              loop
              preload="metadata"
              aria-hidden="true"
            ></video>`
                  : `<img
              class="product-card__image product-card__image--hover"
              src="${hoverMedia}"
              alt=""
              aria-hidden="true"
              loading="lazy"
            />`
                : ""
            }
            <a
              class="product-card__image-link"
              href="product.html?id=${encodeURIComponent(product.id)}"
              aria-label="View ${product.name}"
            ></a>
          </div>
          <div class="product-card__quick-add">
            <span class="product-card__quick-add-label">Quick Add</span>
            <div class="product-card__sizes">
              ${sizes
                .map((size) => {
                  const inStock = getInventoryQuantity(product, size) > 0;
                  return `<button type="button" class="product-card__size" data-product-id="${product.id}" data-size="${size}" ${inStock ? "" : "disabled"}>${size}</button>`;
                })
                .join("")}
            </div>
          </div>
        </div>
        <div class="product-card__info">
          <a class="product-card__title-link" href="product.html?id=${encodeURIComponent(product.id)}">
            <h2 class="product-card__name">${product.name.toUpperCase()}${colorLabel}</h2>
          </a>
          <p class="product-card__price">$${product.price.toFixed(2)}</p>
          <span class="product-card__swatch" style="background-color: ${swatchColor}" aria-hidden="true"></span>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll(".product-card__media--has-hover-video").forEach((media) => {
    const video = media.querySelector(".product-card__video--hover");
    if (!video) return;

    function playHoverVideo() {
      video.play().catch(() => {});
    }

    function pauseHoverVideo() {
      video.pause();
      video.currentTime = 0;
    }

    media.addEventListener("mouseenter", playHoverVideo);
    media.addEventListener("mouseleave", pauseHoverVideo);
    media.addEventListener("focusin", playHoverVideo);
    media.addEventListener("focusout", pauseHoverVideo);
  });
}

function initQuickAddHandlers() {
  const grid = document.getElementById("shop-grid");
  if (!grid || grid.dataset.quickAddBound === "true") return;

  grid.dataset.quickAddBound = "true";
  grid.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest(".product-card__size");
      if (!button || button.disabled || !grid.contains(button)) return;

      event.preventDefault();
      event.stopPropagation();

      if (addToCart(button.dataset.productId, button.dataset.size)) {
        openCartDrawer();
      }
    },
    true
  );
}

initQuickAddHandlers();
loadProducts();
