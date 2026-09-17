function parseCartMetadata(cartValue) {
  if (!cartValue || typeof cartValue !== "string") {
    return [];
  }

  return cartValue
    .split("|")
    .filter(Boolean)
    .map((part) => {
      const [id, size, quantity] = part.split(":");
      return {
        id,
        size,
        quantity: Number(quantity),
      };
    })
    .filter((item) => item.id && item.size && Number.isInteger(item.quantity) && item.quantity > 0);
}

function formatCartMetadata(items) {
  return items.map((item) => `${item.id}:${item.size}:${item.quantity}`).join("|");
}

module.exports = {
  parseCartMetadata,
  formatCartMetadata,
};
