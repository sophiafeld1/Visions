require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("./db");
const { loadProductsFile, syncProducts } = require("./sync-products");

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, "utf8");
  await pool.query(sql);
}

async function setup() {
  const root = path.join(__dirname, "..");
  await runSqlFile(path.join(root, "db", "schema.sql"));

  const products = loadProductsFile();
  await syncProducts(products);

  console.log("Database ready.");
}

setup()
  .catch((error) => {
    console.error("Database setup failed:", error.message);
    process.exit(1);
  })
  .finally(() => pool.end());
