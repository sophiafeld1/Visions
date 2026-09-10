const fs = require("fs");
const path = require("path");

const SITE_URL = "https://visionsstudio.us";
const productsPath = path.join(__dirname, "..", "data", "products.json");
const sitemapPath = path.join(__dirname, "..", "sitemap.xml");

const products = JSON.parse(fs.readFileSync(productsPath, "utf8"));

const staticPages = [
  "/",
  "/shop.html",
  "/about.html",
  "/contact.html",
  "/shipping-returns.html",
  "/privacy.html",
];

const urls = [
  ...staticPages.map((page) => `${SITE_URL}${page === "/" ? "/" : page}`),
  ...products.map((product) => `${SITE_URL}/product.html?id=${product.id}`),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${loc}</loc></url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(sitemapPath, xml);
console.log(`Wrote ${urls.length} URLs to sitemap.xml`);
