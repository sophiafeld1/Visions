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

    return `
      <article class="product-card">
        <div class="product-card__media">
          <a class="product-card__image-link" href="product.html?id=${encodeURIComponent(product.id)}">
            <img
              class="product-card__image"
              src="${product.image}"
              alt="${product.name}"
              loading="lazy"
            />
          </a>
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

  grid.querySelectorAll(".product-card__size").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (addToCart(button.dataset.productId, button.dataset.size)) {
        openCartDrawer();
      }
    });
  });
}

loadProducts();
