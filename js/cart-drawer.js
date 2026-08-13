function renderCartItem(item) {
  const lineTotal = item.price * item.quantity;
  const sizeLabel = item.color ? `${item.size} • ${item.color}` : item.size;

  return `
    <article class="cart-item" data-product-id="${item.id}" data-size="${item.size}">
      <img class="cart-item__image" src="${item.image}" alt="${item.name}" />
      <div class="cart-item__details">
        <h3 class="cart-item__name">${item.name}</h3>
        <p class="cart-item__meta">${sizeLabel}</p>
        <p class="cart-item__price">${formatPrice(item.price)}</p>
        <button class="cart-item__remove" type="button" data-action="remove" aria-label="Remove ${item.name}">
          Remove
        </button>
      </div>
      <div class="cart-item__controls">
        <div class="quantity-control">
          <button type="button" data-action="decrease" aria-label="Decrease quantity">−</button>
          <span class="quantity-control__value">${item.quantity}</span>
          <button type="button" data-action="increase" aria-label="Increase quantity">+</button>
        </div>
        <p class="cart-item__line-total">${formatPrice(lineTotal)}</p>
      </div>
    </article>
  `;
}

function bindCartItemEvents(container) {
  container.querySelectorAll(".cart-item").forEach((row) => {
    const productId = row.dataset.productId;
    const size = row.dataset.size;

    row.querySelector('[data-action="remove"]').addEventListener("click", () => {
      removeFromCart(productId, size);
      renderCartDrawer();
    });

    row.querySelector('[data-action="decrease"]').addEventListener("click", () => {
      const item = getCart().find((entry) => cartItemsMatch(entry, { id: productId, size }));
      if (item) updateCartItemQuantity(productId, size, item.quantity - 1);
      renderCartDrawer();
    });

    row.querySelector('[data-action="increase"]').addEventListener("click", () => {
      const item = getCart().find((entry) => cartItemsMatch(entry, { id: productId, size }));
      if (item) updateCartItemQuantity(productId, size, item.quantity + 1);
      renderCartDrawer();
    });
  });
}

function renderEmptyCart(container) {
  container.innerHTML = `
    <div class="cart-panel cart-panel--drawer">
      <div class="cart-empty">
        <h3 class="cart-empty__title">It's a little empty here</h3>
        <p class="cart-empty__text">Your cart is currently empty</p>
        <button type="button" class="btn btn--outline" data-action="close-cart">Start Shopping</button>
      </div>
    </div>
  `;

  container.querySelector('[data-action="close-cart"]').addEventListener("click", closeCartDrawer);
}

function renderFilledCart(container, items) {
  const count = getCartCount();
  const subtotal = getCartSubtotal();
  const itemLabel = count === 1 ? "1 item" : `${count} items`;

  container.innerHTML = `
    <div class="cart-panel cart-panel--drawer">
      <p class="cart-panel__subtitle">${itemLabel}</p>

      <div class="cart-items">
        ${items.map(renderCartItem).join("")}
      </div>

      <div class="cart-summary">
        <div class="cart-summary__row">
          <span>Subtotal</span>
          <strong>${formatPrice(subtotal)} USD</strong>
        </div>
        <p class="cart-summary__note">Shipping calculated at checkout</p>

        <button id="checkout-btn" class="btn btn--full" type="button">Checkout</button>
        <button id="continue-shopping-btn" class="btn btn--outline btn--full" type="button">
          Continue Shopping
        </button>
      </div>
    </div>
  `;

  container.querySelector("#checkout-btn").addEventListener("click", () => {
    alert("Checkout coming soon — we'll connect a payment method later.");
  });

  container.querySelector("#continue-shopping-btn").addEventListener("click", closeCartDrawer);

  bindCartItemEvents(container);
}

async function renderCartDrawer() {
  const container = document.getElementById("cart-drawer-content");
  const titleCount = document.getElementById("cart-drawer-count");
  if (!container) return;

  await loadProductsFromApi();
  const items = getCartWithProducts();
  const count = getCartCount();

  if (titleCount) {
    titleCount.textContent = String(count);
  }

  if (!items.length) {
    renderEmptyCart(container);
    updateCartBadge();
    return;
  }

  renderFilledCart(container, items);
  updateCartBadge();
}

function openCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  if (!drawer) return;

  renderCartDrawer();
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-drawer-open");
}

function closeCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  if (!drawer) return;

  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-drawer-open");
}

function createCartDrawer() {
  if (document.getElementById("cart-drawer")) return;

  const drawer = document.createElement("div");
  drawer.id = "cart-drawer";
  drawer.className = "cart-drawer";
  drawer.setAttribute("aria-hidden", "true");
  drawer.innerHTML = `
    <div class="cart-drawer__backdrop" data-action="close-cart"></div>
    <aside class="cart-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <div class="cart-drawer__header">
        <h2 id="cart-drawer-title" class="cart-drawer__title">
          Your cart <sup id="cart-drawer-count" class="cart-drawer__count">0</sup>
        </h2>
        <button type="button" class="cart-drawer__close" data-action="close-cart" aria-label="Close cart">
          ×
        </button>
      </div>
      <div id="cart-drawer-content" class="cart-drawer__content"></div>
    </aside>
  `;

  document.body.appendChild(drawer);

  drawer.querySelectorAll('[data-action="close-cart"]').forEach((element) => {
    element.addEventListener("click", closeCartDrawer);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.classList.contains("is-open")) {
      closeCartDrawer();
    }
  });
}

function initCartDrawer() {
  createCartDrawer();

  const cartButton = document.getElementById("cart-open-btn");
  if (cartButton) {
    cartButton.addEventListener("click", openCartDrawer);
  }

  if (new URLSearchParams(window.location.search).get("cart") === "open") {
    openCartDrawer();
  }
}

document.addEventListener("DOMContentLoaded", initCartDrawer);
