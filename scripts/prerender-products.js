const fs = require("fs");
const path = require("path");

const SITE_URL = "https://visionsstudio.us";
const SITE_NAME = "Visions Studio Handmade Clothing";
const ROOT = path.join(__dirname, "..");
const productsPath = path.join(ROOT, "data", "products.json");
const templatePath = path.join(ROOT, "product.html");
const outDir = path.join(ROOT, "product");

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absoluteUrl(relativePath) {
  if (!relativePath) return SITE_URL;
  if (relativePath.startsWith("http")) return relativePath;
  return `${SITE_URL}/${relativePath.replace(/^\//, "")}`;
}

function productAvailability(product) {
  const total = (product.inventory || []).reduce((sum, row) => sum + (row.quantity || 0), 0);
  return total > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}

function buildProductJsonLd(product) {
  const pageUrl = absoluteUrl(`product/${product.id}.html`);
  const image = absoluteUrl(product.image.split("?")[0]);
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

function buildBreadcrumbJsonLd(product) {
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
        item: absoluteUrl(`product/${product.id}.html`),
      },
    ],
  };
}

function firstImageSrc(product) {
  const images = Array.isArray(product.images) ? product.images : [];
  const image = images.find((src) => !/\.(mp4|webm|mov)(\?|$)/i.test(src)) || product.image;
  return image || "";
}

function injectProductSeo(template, product) {
  const title = `${product.name} | ${SITE_NAME}`;
  const description = `${product.description} Shop handmade and upcycled clothing at ${SITE_NAME}. $${product.price} USD.`;
  const canonical = absoluteUrl(`product/${product.id}.html`);
  const imageUrl = absoluteUrl((product.image || "").split("?")[0]);
  const productJsonLd = buildProductJsonLd(product);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(product);
  const primaryImage = firstImageSrc(product);

  let html = template;

  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(title)}</title>`
  );

  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );

  html = html.replace(
    /<link\s+rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${canonical}" />`
  );

  const ogBlock = `
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:title" content="${escapeHtml(product.name)}" />
    <meta property="og:description" content="${escapeHtml(product.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:type" content="product" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:alt" content="${escapeHtml(product.name)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(product.name)}" />
    <meta name="twitter:description" content="${escapeHtml(product.description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <script type="application/ld+json" id="product-jsonld">${JSON.stringify(productJsonLd)}</script>
    <script type="application/ld+json" id="breadcrumb-jsonld">${JSON.stringify(breadcrumbJsonLd)}</script>`;

  if (html.includes("<!-- product-seo -->")) {
    html = html.replace("<!-- product-seo -->", ogBlock.trim());
  } else {
    html = html.replace("</head>", `${ogBlock}\n  </head>`);
  }

  html = html.replace(
    /<h1 id="product-name" class="product-detail__title"><\/h1>/,
    `<h1 id="product-name" class="product-detail__title">${escapeHtml(product.name)}</h1>`
  );

  html = html.replace(
    /<p id="product-description" class="product-info-tabs__text"><\/p>/,
    `<p id="product-description" class="product-info-tabs__text">${escapeHtml(product.description)}</p>`
  );

  if (primaryImage) {
    html = html.replace(
      /<div id="product-gallery-grid" class="product-gallery-grid"><\/div>/,
      `<div id="product-gallery-grid" class="product-gallery-grid">
          <figure class="product-gallery-grid__item">
            <img class="product-gallery__image" src="${escapeHtml(primaryImage)}" alt="${escapeHtml(product.name)}" />
          </figure>
        </div>`
    );
  }

  return html;
}

function main() {
  const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));
  const template = fs.readFileSync(templatePath, "utf8");

  fs.mkdirSync(outDir, { recursive: true });

  for (const file of fs.readdirSync(outDir)) {
    if (file.endsWith(".html")) {
      fs.unlinkSync(path.join(outDir, file));
    }
  }

  for (const product of products) {
    const html = injectProductSeo(template, product);
    const outPath = path.join(outDir, `${product.id}.html`);
    fs.writeFileSync(outPath, html);
  }

  console.log(`Prerendered ${products.length} product pages into product/`);
}

main();
