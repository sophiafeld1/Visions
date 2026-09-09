require("dotenv").config();
const express = require("express");
const path = require("path");
const { query } = require("./db");
const { loadProductsFromFile } = require("../lib/products-store");
const { createCheckoutSession } = require("../lib/checkout");

const app = express();
const port = Number(process.env.PORT || 5500);
const root = path.join(__dirname, "..");

app.use(express.json());

async function fetchProductsFromDb() {
  const result = await query(`
    SELECT
      p.id,
      p.name,
      p.color,
      p.color_swatch AS "colorSwatch",
      p.price::float AS price,
      p.image,
      p.description,
      COALESCE(
        json_agg(
          json_build_object('size', i.size, 'quantity', i.quantity)
          ORDER BY i.size
        ) FILTER (WHERE i.size IS NOT NULL),
        '[]'::json
      ) AS inventory
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    GROUP BY p.id, p.name, p.color, p.color_swatch, p.price, p.image, p.description
    ORDER BY p.name
  `);

  return result.rows.map((row) => ({
    ...row,
    sizes: row.inventory.map((entry) => entry.size),
  }));
}

async function fetchProducts() {
  try {
    return await fetchProductsFromDb();
  } catch {
    return loadProductsFromFile();
  }
}

app.get("/api/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});

app.get("/api/products", async (_req, res) => {
  try {
    const products = await fetchProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const products = await fetchProducts();
    const product = products.find((item) => item.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const origin = `${req.protocol}://${req.get("host")}`;
    const result = await createCheckoutSession({ items: req.body?.items, origin });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/inventory/:productId/:size", async (req, res) => {
  try {
    const products = await fetchProducts();
    const product = products.find((item) => item.id === req.params.productId);
    const entry = product?.inventory?.find((item) => item.size === req.params.size);

    if (!entry) {
      res.status(404).json({ error: "Size not found" });
      return;
    }

    res.json({ quantity: entry.quantity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static(root));

app.listen(port, () => {
  console.log(`Visions shop running at http://localhost:${port}`);
});
