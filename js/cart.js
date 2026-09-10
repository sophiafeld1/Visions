const CART_STORAGE_KEY = "visions-cart";

function normalizeCartItem(item) {
  return {
    id: item.id,
    size: item.size || "XS",
    quantity: item.quantity || 1,
  };
}

function getCart() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored).map(normalizeCartItem) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.map(normalizeCartItem)));
  updateCartBadge();
  if (typeof renderCartDrawer === "function") {
    renderCartDrawer();
  }
}

function cartItemsMatch(a, b) {
  return a.id === b.id && a.size === b.size;
}

function getCartCount() {
  return getCart().reduce((total, item) => total + item.quantity, 0);
}

function addToCart(productId, size = "XS", quantity = 1) {
  const product = getProductById(productId);
  const available = getInventoryQuantity(product, size);

  if (!product || available <= 0) {
    alert(`Size ${size} is out of stock.`);
    return false;
  }

  const cart = getCart();
  const existing = cart.find((item) => cartItemsMatch(item, { id: productId, size }));

  const nextQuantity = (existing?.quantity || 0) + quantity;
  if (nextQuantity > available) {
    alert(`Only ${available} left in size ${size}.`);
    return false;
  }

  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    cart.push({ id: productId, size, quantity });
  }

  saveCart(cart);
  if (typeof trackGa4AddToCart === "function") {
    trackGa4AddToCart(product, quantity);
  }
  return true;
}

function updateCartItemQuantity(productId, size, quantity) {
  const cart = getCart();
  const item = cart.find((entry) => cartItemsMatch(entry, { id: productId, size }));

  if (!item) return;

  if (quantity <= 0) {
    removeFromCart(productId, size);
    return;
  }

  const product = getProductById(productId);
  const available = getInventoryQuantity(product, size);
  if (quantity > available) {
    alert(`Only ${available} left in size ${size}.`);
    return;
  }

  item.quantity = quantity;
  saveCart(cart);
}

function removeFromCart(productId, size = "XS") {
  const cart = getCart().filter((item) => !cartItemsMatch(item, { id: productId, size }));
  saveCart(cart);
}

function getCartWithProducts() {
  return getCart()
    .map((item) => {
      const product = getProductById(item.id);
      if (!product) return null;
      return { ...product, size: item.size, quantity: item.quantity };
    })
    .filter(Boolean);
}

function getCartSubtotal() {
  return getCartWithProducts().reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

function formatPrice(price) {
  return `$${price.toFixed(2)}`;
}

function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;

  const count = getCartCount();
  badge.textContent = String(count);
  badge.hidden = count === 0;
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
