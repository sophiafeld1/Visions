# SEO Improvements — visionsstudio.us

**Based on:** SEO Score 63/100 (Grade D — Weak), audited Oct 16, 2026  
**Project:** `/Users/sophiafeldman/Documents/Visions`  
**Goal:** Raise crawl clarity, product discoverability, and on-page relevance without redesigning the brand.

This is a proposed fix list only. Items are ordered by impact vs. effort.

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| P0 | High impact, do first |
| P1 | Clear wins, do next |
| P2 | Nice polish / longer-term |

---

## P0 — Fix what search engines see first

### 1. Add a real homepage H1

**Why it scored low:** `index.html` has no `<h1>`. The first meaningful headings are footer/section H2s (“Instagram”, “Navigate”).

**Proposed change (in `index.html`):**
- Add one clear H1 near the hero / primary message, e.g.  
  `Handmade & Upcycled Clothing by Visions Studio`
- Keep a single H1. Do not turn every product name into an H1 on the home page.

**Done when:** View-source on `/` shows exactly one topical H1.

---

### 2. Fix About H1 (and light copy cleanup)

**Why:** `about.html` H1 is currently `Hi!` — not searchable or descriptive.

**Proposed change:**
- Change H1 to something like `About Sophia & Visions Studio` or `Meet the Maker Behind Visions Studio`.
- Keep the friendly intro in a paragraph under the H1.
- Fix the typo `susainable` → `sustainable` in the About body copy.

**Done when:** About H1 names the brand/founder; typo gone.

---

### 3. Make product pages SEO-readable without JavaScript

**Why it scored low:** `product.html` ships with:
- Title: Shop page title  
- Meta: generic shop description  
- Canonical: `https://visionsstudio.us/shop.html`  
- Empty `<h1 id="product-name">`  
- Empty description / gallery  

`js/seo.js` + `js/product.js` fill these in after load. Many crawlers and social bots still prefer (or require) the initial HTML.

**Proposed approaches (pick one):**

**A. Server-render product HTML (best)**  
- Add an API/route or build step that outputs per-product HTML (or SSR/prerender) with correct `<title>`, meta description, canonical, H1, description text, and Product JSON-LD in the initial response.

**B. Static prerender / generate pages (strong for this stack)**  
- Script that reads product data and writes `product/<id>.html` (or similar) at build/deploy time.
- Update `sitemap.xml` and internal links to those clean URLs.
- Keep `product.html?id=` as a redirect for old links.

**C. Minimum viable (faster, weaker)**  
- If staying on `product.html?id=`, at least:
  - Do not default canonical to `shop.html` in static HTML (omit or use a neutral self URL).
  - Ensure Product JSON-LD / title / meta are also available via a crawlable path (e.g. embed a `<noscript>` block or prerender critical SEO tags).

**Also update `js/seo.js` behavior once static/SSR exists** so client and server tags do not fight each other.

**Done when:** `curl` of a product URL returns the product name in `<title>`, a product-specific meta description, a self-canonical, visible H1 text, and Product JSON-LD — with JS disabled.

---

### 4. Add Open Graph image (and basic share tags)

**Why:** Home has `og:title`, `og:description`, `og:url`, `og:type` but **no `og:image`**. No Twitter card tags. Shares and some discovery surfaces look blank or weak.

**Proposed change (all key templates: `index.html`, `shop.html`, `about.html`, `contact.html`, and product templates):**

```html
<meta property="og:image" content="https://visionsstudio.us/images/home/hero.jpg" />
<meta property="og:image:alt" content="Visions Studio handmade clothing" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="…" />
<meta name="twitter:description" content="…" />
<meta name="twitter:image" content="https://visionsstudio.us/images/home/hero.jpg" />
```

**Product pages:** use the product’s primary image as `og:image` (via prerender/SSR or `seo.js` *plus* static fallback).

**Recommended asset:** a dedicated 1200×630 share image (brand + one garment), not only the hero crop.

**Done when:** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) / similar shows a preview image for home and a product URL.

---

## P1 — Strengthen on-page and crawl signals

### 5. Tighten title and meta lengths

| Page | Current issue | Target |
|------|---------------|--------|
| Home title | ~63 chars | ~50–60; keep brand + upcycled/handmade near front |
| Home meta | ~174 chars | ~140–160; cut trailing “Secure checkout at visionsstudio.us” if needed |
| About meta | ~114 chars | Expand slightly with “upcycled,” “handmade,” “since 2020” |
| Contact meta | ~96 chars | Slightly longer, still unique |

Keep titles unique per URL. Avoid stuffing.

---

### 6. Add more substantive homepage (and About) copy

**Why:** Home visible text is thin (~750 characters) — mostly nav, CTAs, and short footer blurbs.

**Proposed change:**
- Add a short section under the hero (or above Instagram) with 1 H2 + 2–4 sentences on:
  - what you sell (tops, sets, skirts, swimwear)
  - how pieces are made (upcycled / handmade in the USA)
  - who it’s for
- Optionally link that section to Shop and About.
- Expand About with 1–2 more paragraphs (materials, process, sizing philosophy) without turning it into a blog essay.

**Done when:** Home has a clear topical H1 + supporting paragraph block; About feels specific, not placeholder-thin.

---

### 7. Stabilize and enrich `sitemap.xml`

**Current:** `robots.txt` correctly points to `https://visionsstudio.us/sitemap.xml`. Sitemap lists core pages + products. One fetch path previously returned HTTP 500 (curl succeeded) — worth hardening.

**Proposed change:**
- Confirm sitemap always returns `200` on Vercel (no flaky serverless/static conflict).
- Keep product URLs in sync when inventory changes (generate from the same product source as the shop).
- Optional: add `<lastmod>` when you regenerate.
- If you move to clean product URLs (P0 #3B), update sitemap locs and 301 old query URLs.

**Done when:** Sitemap is consistently reachable and matches live product IDs.

---

### 8. Prefer cleaner product URLs (when you touch product SEO)

**Current:** `product.html?id=stripe-set-blush`

**Proposed:** `/product/stripe-set-blush` or `/products/stripe-set-blush`  
- Update internal links in `index.html`, `shop.html`, and any JS that builds product hrefs.  
- 301 from old query URLs.  
- Self-canonical on the clean URL.

Query URLs are crawlable, but path URLs tend to perform and share better.

---

### 9. Image SEO cleanup (filenames + consistency)

**What’s already good:** Product alts on home/shop are descriptive.

**Proposed change:**
- Rename generic files over time: `front.jpg` / `cover.jpg` / `hero.jpg` → descriptive slugs where practical (`asymmetric-top-aqua-front.jpg`).
- Keep `alt` as the human description (product name + color/style), not keyword stuffing.
- Ensure JS-injected product gallery images always set `alt` to the product name (already done in `product.js` — keep that when refactoring).

---

## P2 — Polish and growth

### 10. Heading hierarchy cleanup

- Home: one H1; use H2 for “New arrivals” / “Follow on Instagram”; keep footer labels as styled text or `<p>`/`<h3>`, not competing H2s if they dilute the outline.
- Shop: H1 “Shop Handmade Clothing” (slightly more specific than “Shop”) is fine; product cards as H2 or H3 consistently.
- Avoid empty headings in templates.

---

### 11. Internal linking beyond the nav

- From About → 2–3 featured products or Shop categories.  
- From Shipping/Returns → Shop and Contact.  
- From sold-out or related products → 2 “You may also like” links (helps crawl depth and UX).  
- Optional later: a short Journal / Process page for “upcycled clothing” content (only if you’ll maintain it).

---

### 12. Structured data completeness

**Already present on home:** Organization + WebSite JSON-LD.  
**Product:** Product JSON-LD via `js/seo.js` after load.

**Proposed:**
- Emit Product (+ Offer) JSON-LD in initial HTML for each product URL (ties to P0 #3).  
- Consider `BreadcrumbList` on product pages: Home → Shop → Product.  
- Validate with [Rich Results Test](https://search.google.com/test/rich-results).

---

### 13. Performance hygiene (keep score from slipping)

Not a crisis today (HTML/CSS lean; images ~190–250KB), but before you add more media:
- Serve hero/product images as WebP/AVIF with JPEG fallback where easy.  
- Lazy-load below-fold product images on Shop/Home.  
- Keep Google Fonts limited to weights you actually use.

---

### 14. Search Console + measurement

- Verify the property in Google Search Console; submit sitemap.  
- Inspect a few product URLs after P0 #3 ships.  
- You already have GA4 (`G-5VRDK2R76M`) — optionally track organic landing pages once indexation improves.

---

## Suggested implementation order

1. Homepage H1 + About H1/typo (**quick**)  
2. `og:image` + Twitter tags on main pages (**quick**)  
3. Trim home title/meta lengths (**quick**)  
4. Product HTML prerender or SSR + sitemap/canonical fix (**biggest lift**)  
5. Homepage/About copy expansion  
6. Cleaner product URLs + redirects  
7. Image renames, breadcrumbs, related links, GSC monitoring  

---

## Expected score movement (rough)

| If you ship… | Likely effect |
|--------------|---------------|
| P0 #1–2, #4 + meta trims | Heading + discoverability up; total often into high 60s / low 70s |
| P0 #3 (product HTML crawlable) | Largest jump: titles, meta, content, URL/crawl, discoverability |
| P1 copy + sitemap stability | Content + crawl reliability |
| P2 extras | Incremental gains once foundations are solid |

---

## Out of scope for this doc

- Visual redesign or new brand system  
- Paid ads / influencer strategy  
- Keyword research spreadsheet (can be a follow-on if you want a target phrase list)

---

## Files most likely to change

| File / area | Changes |
|-------------|---------|
| `index.html` | H1, meta length, OG/Twitter, short copy block |
| `about.html` | H1, typo, meta, OG |
| `shop.html` | H1 wording, OG |
| `contact.html` | Meta length, OG |
| `product.html` + `js/seo.js` + `js/product.js` | Crawlable product SEO |
| `sitemap.xml` (+ generator if any) | Sync + stability |
| `images/` | Share image + gradual renames |
| Vercel/routing | Clean product URLs + redirects (if adopted) |

---

*Generated from the SEO scorer audit. Re-score after shipping P0 to confirm movement.*
