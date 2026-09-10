function formatMoney(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function renderReceipt(summary) {
  const itemsHtml = summary.lineItems
    .map(
      (item) => `
        <div class="checkout-receipt__row">
          <span>${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ""}</span>
          <span>${formatMoney(item.amount, summary.currency)}</span>
        </div>
      `
    )
    .join("");

  const shippingHtml = summary.shippingLabel
    ? `<div class="checkout-receipt__shipping"><strong>Ship to</strong><pre>${summary.shippingLabel}</pre></div>`
    : "";

  const emailHtml = summary.email
    ? `<p class="checkout-page__text">Confirmation sent to <strong>${summary.email}</strong>.</p>`
    : "";

  const receiptLinkHtml = summary.receiptUrl
    ? `<a class="btn btn--outline btn--full" href="${summary.receiptUrl}" target="_blank" rel="noopener noreferrer">View Stripe Receipt</a>`
    : "";

  return `
    <div class="checkout-receipt">
      <h2 class="checkout-receipt__heading">Order summary</h2>
      ${itemsHtml}
      <div class="checkout-receipt__row checkout-receipt__row--total">
        <span>Total</span>
        <span>${formatMoney(summary.amountTotal, summary.currency)}</span>
      </div>
      ${shippingHtml}
    </div>
    ${emailHtml}
    ${receiptLinkHtml}
  `;
}

async function loadCheckoutReceipt() {
  const container = document.getElementById("checkout-receipt-content");
  if (!container) return;

  const sessionId = new URLSearchParams(window.location.search).get("session_id");
  if (!sessionId) {
    container.innerHTML =
      '<p class="checkout-page__text">Your payment was successful. Check your email for a receipt from Stripe.</p>';
    return;
  }

  try {
    const response = await fetch(
      `/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to load receipt.");
    }

    container.innerHTML = renderReceipt(data);
    if (typeof trackGa4Purchase === "function") {
      trackGa4Purchase({
        sessionId,
        currency: data.currency,
        amountTotal: data.amountTotal,
        lineItems: data.lineItems,
      });
    }
  } catch (error) {
    container.innerHTML = `<p class="checkout-page__text">${error.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadCheckoutReceipt);
