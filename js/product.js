async function loadProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    window.location.href = "index.html";
    return;
  }

  await loadProductsFromApi();
  const product = getProductById(productId);

  if (!product) {
    window.location.href = "index.html";
    return;
  }

  document.title = `${product.name} — Visions`;

  document.getElementById("product-image").src = product.image;
  document.getElementById("product-image").alt = product.name;
  document.getElementById("product-price").textContent = formatPrice(product.price);
  document.getElementById("product-description").textContent = product.description;

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
