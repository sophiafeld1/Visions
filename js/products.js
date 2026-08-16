const STATIC_PRODUCTS = [
  {
    id: "v-neck-tie-top",
    name: "V Neck Tie Top",
    color: "Black",
    colorSwatch: "#1a1a1a",
    sizes: ["XS"],
    inventory: [{ size: "XS", quantity: 4 }],
    price: 48,
    image: "images/v-neck-tie-top.jpg",
    description: "A relaxed v-neck with a soft tie detail. Lightweight and flattering.",
  },
];

let PRODUCTS = [...STATIC_PRODUCTS];

function isVideoSrc(src) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

function getProductById(id) {
  return PRODUCTS.find((product) => product.id === id);
}

function getInventoryQuantity(product, size) {
  if (!product?.inventory) return 0;
  const entry = product.inventory.find((item) => item.size === size);
  return entry ? entry.quantity : 0;
}

function getAvailableSizes(product) {
  if (!product) return [];
  return (product.inventory || [])
    .filter((entry) => entry.quantity > 0)
    .map((entry) => entry.size);
}

function getProductImages(product) {
  if (!product) return [];

  if (product.images?.length) {
    return [...new Set(product.images)];
  }

  const images = [product.image];
  if (product.imageHover && product.imageHover !== product.image) {
    images.push(product.imageHover);
  }

  return images;
}

async function loadProductsFromApi() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Failed to load products");
    const products = await response.json();
    if (products.length) {
      PRODUCTS = products;
      return PRODUCTS;
    }
  } catch {
    // API unavailable — fall back to local product file below.
  }

  try {
    const response = await fetch("/data/products.json");
    if (response.ok) {
      const products = await response.json();
      if (products.length) {
        PRODUCTS = products;
        return PRODUCTS;
      }
    }
  } catch {
    // Local file unavailable — use embedded fallback below.
  }

  PRODUCTS = [...STATIC_PRODUCTS];
  return PRODUCTS;
}

loadProductsFromApi();
