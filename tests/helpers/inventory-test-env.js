const fs = require("fs");
const os = require("os");
const path = require("path");

function createInventoryTestEnv() {
  const tempFile = path.join(
    os.tmpdir(),
    `visions-inventory-test-${Date.now()}-${Math.random().toString(16).slice(2)}.json`
  );

  const saved = {
    INVENTORY_TEST_FILE: process.env.INVENTORY_TEST_FILE,
    VERCEL: process.env.VERCEL,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };

  process.env.INVENTORY_TEST_FILE = tempFile;
  delete process.env.VERCEL;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  return {
    tempFile,
    restore() {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }

      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    },
  };
}

const INVENTORY_STORE_PATH = path.join(__dirname, "../../lib/inventory-store");
const PRODUCTS_STORE_PATH = path.join(__dirname, "../../lib/products-store");

function reloadInventoryStore() {
  delete require.cache[INVENTORY_STORE_PATH];
  delete require.cache[PRODUCTS_STORE_PATH];
  return require(INVENTORY_STORE_PATH);
}

module.exports = {
  createInventoryTestEnv,
  reloadInventoryStore,
};
