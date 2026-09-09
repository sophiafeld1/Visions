async function startCheckout(cartItems) {
  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: cartItems }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Unable to start checkout.");
  }

  if (!data.url) {
    throw new Error("Unable to start checkout.");
  }

  window.location.href = data.url;
}

function clearCartAfterCheckout() {
  localStorage.removeItem("visions-cart");
  if (typeof updateCartBadge === "function") {
    updateCartBadge();
  }
}
