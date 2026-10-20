const SITE_NAME = "Visions Studio Handmade Clothing";
const SITE_URL = "https://visionsstudio.us";
const DEFAULT_SHARE_IMAGE = `${SITE_URL}/images/home/coming-soon.jpg`;

function absoluteUrl(path) {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}/${path.replace(/^\//, "")}`;
}

function productPagePath(productId) {
  return `product/${encodeURIComponent(productId)}.html`;
}

function setMetaProperty(property, content) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function setMetaName(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
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
  const pageUrl = absoluteUrl(productPagePath(product.id));
  const image = absoluteUrl((product.image || "").split("?")[0]);
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
      url: pageUrl,
      priceCurrency: "USD",
      price: product.price,
      availability: productAvailability(product),
    },
  };
}

function productBreadcrumbJsonLd(product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${SITE_URL}/shop.html`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: absoluteUrl(productPagePath(product.id)),
      },
    ],
  };
}

function applyProductSeo(product) {
  const pageUrl = absoluteUrl(productPagePath(product.id));
  const imageUrl = absoluteUrl((product.image || DEFAULT_SHARE_IMAGE).split("?")[0]);

  setDocumentTitle(productPageTitle(product.name));
  setMetaDescription(productMetaDescription(product));
  setCanonical(pageUrl);
  setMetaProperty("og:site_name", SITE_NAME);
  setMetaProperty("og:title", product.name);
  setMetaProperty("og:description", product.description);
  setMetaProperty("og:url", pageUrl);
  setMetaProperty("og:type", "product");
  setMetaProperty("og:image", imageUrl);
  setMetaProperty("og:image:alt", product.name);
  setMetaName("twitter:card", "summary_large_image");
  setMetaName("twitter:title", product.name);
  setMetaName("twitter:description", product.description);
  setMetaName("twitter:image", imageUrl);
  setJsonLd("product-jsonld", productJsonLd(product));
  setJsonLd("breadcrumb-jsonld", productBreadcrumbJsonLd(product));
}
