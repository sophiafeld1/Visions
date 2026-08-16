function renderGalleryItem(src, product) {
  if (isVideoSrc(src)) {
    return `
      <figure class="product-gallery-grid__item">
        <video
          class="product-gallery__video"
          src="${src}"
          playsinline
          muted
          loop
          controls
          aria-label="${product.name} video"
        ></video>
      </figure>
    `;
  }

  return `
    <figure class="product-gallery-grid__item">
      <img class="product-gallery__image" src="${src}" alt="${product.name}" />
    </figure>
  `;
}

function initGalleryVideos(container) {
  const videos = container.querySelectorAll(".product-gallery__video");
  if (!videos.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: [0, 0.35, 0.6] }
  );

  videos.forEach((video) => observer.observe(video));
}

function initProductGallery(product) {
  const grid = document.getElementById("product-gallery-grid");
  if (!grid) return;

  const images = getProductImages(product);
  grid.innerHTML = images.map((src) => renderGalleryItem(src, product)).join("");
  initGalleryVideos(grid);
}

function initProductTabs(product) {
  const tabs = document.querySelectorAll(".product-info-tabs__tab");
  const panels = document.querySelectorAll(".product-info-tabs__panel");
  const description = document.getElementById("product-description");
  const measurements = document.getElementById("product-measurements");

  if (description) {
    description.textContent = product.description;
  }

  if (measurements) {
    measurements.textContent = product.measurements || "";
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      tabs.forEach((button) => {
        const isActive = button.dataset.tab === target;
        button.classList.toggle("product-info-tabs__tab--active", isActive);
        button.setAttribute("aria-selected", String(isActive));
      });

      panels.forEach((panel) => {
        const isActive = panel.id === `product-tab-${target}`;
        panel.classList.toggle("product-info-tabs__panel--active", isActive);
        panel.hidden = !isActive;
      });
    });
  });
}

async function loadProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    window.location.href = "shop.html";
    return;
  }

  await loadProductsFromApi();
  const product = getProductById(productId);

  if (!product) {
    window.location.href = "shop.html";
    return;
  }

  document.title = `${product.name} — Visions`;

  const productName = document.getElementById("product-name");
  if (productName) {
    productName.textContent = product.name;
  }

  initProductGallery(product);
  initProductTabs(product);
  document.getElementById("product-price").textContent = formatPrice(product.price);

  const sizes = product.sizes?.length ? product.sizes : ["XS"];
  let selectedSize = sizes.find((size) => getInventoryQuantity(product, size) > 0) || sizes[0];

  const sizeContainer = document.getElementById("product-sizes");
  const stockLabel = document.getElementById("product-stock");

  sizeContainer.innerHTML = sizes
    .map((size) => {
      const quantity = getInventoryQuantity(product, size);
      const disabled = quantity <= 0 ? "disabled" : "";
      return `<button type="button" class="size-option ${size === selectedSize ? "size-option--active" : ""}" data-size="${size}" ${disabled}>${size}</button>`;
    })
    .join("");

  function updateStockLabel() {
    const quantity = getInventoryQuantity(product, selectedSize);
    stockLabel.textContent =
      quantity > 0 ? `${quantity} in stock` : "Out of stock";
  }

  sizeContainer.querySelectorAll(".size-option").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      selectedSize = button.dataset.size;
      sizeContainer.querySelectorAll(".size-option").forEach((option) => {
        option.classList.toggle("size-option--active", option.dataset.size === selectedSize);
      });
      updateStockLabel();
    });
  });

  updateStockLabel();

  const addToCartBtn = document.getElementById("add-to-cart-btn");
  addToCartBtn.addEventListener("click", () => {
    if (addToCart(product.id, selectedSize)) {
      openCartDrawer();
    }
  });
}

loadProductPage();
