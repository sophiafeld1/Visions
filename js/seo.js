const SITE_NAME = "Visions Studio Handmade Clothing";
const SITE_URL = "https://visionsstudio.us";

function absoluteUrl(path) {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}/${path.replace(/^\//, "")}`;
}

function setDocumentTitle(title) {
  document.title = title;
}

function setMetaDescription(content) {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

function setJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function productPageTitle(productName) {
  return `${productName} | ${SITE_NAME}`;
}

function productMetaDescription(product) {
  return `${product.description} Shop handmade and upcycled clothing at ${SITE_NAME}. $${product.price} USD.`;
}

function productAvailability(product) {
  const total = (product.inventory || []).reduce((sum, row) => sum + (row.quantity || 0), 0);
  return total > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}

function productJsonLd(product) {
  const image = absoluteUrl(product.image);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [image],
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`product.html?id=${product.id}`),
      priceCurrency: "USD",
      price: product.price,
      availability: productAvailability(product),
    },
  };
}

function applyProductSeo(product) {
  setDocumentTitle(productPageTitle(product.name));
  setMetaDescription(productMetaDescription(product));
  setCanonical(absoluteUrl(`product.html?id=${product.id}`));
  setJsonLd("product-jsonld", productJsonLd(product));
}
