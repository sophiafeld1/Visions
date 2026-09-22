const fs = require("fs");
const path = require("path");
const { loadProductsFromFile, resolveProductId } = require("./products-store");

function getLiveInventoryFile() {
  return (
    process.env.INVENTORY_TEST_FILE ||
    path.join(__dirname, "..", "data", "inventory-live.json")
  );
}
const USE_KV = Boolean(
  (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
);

function assertInventoryBackend() {
  if (process.env.VERCEL && !USE_KV) {
    throw new Error(
      "Inventory storage is not configured. Connect Upstash Redis to this Vercel project."
    );
  }
}

function inventoryKey(productId, size) {
  return `inventory:${productId}:${size}`;
}

function releaseFlagKey(sessionId) {
  return `inventory-released:${sessionId}`;
}

function finalizedFlagKey(sessionId) {
  return `inventory-finalized:${sessionId}`;
}

function getKv() {
  return require("@vercel/kv").kv;
}

function readFileState() {
  const liveInventoryFile = getLiveInventoryFile();
  if (!fs.existsSync(liveInventoryFile)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(liveInventoryFile, "utf8"));
}

function writeFileState(state) {
  fs.writeFileSync(getLiveInventoryFile(), `${JSON.stringify(state, null, 2)}\n`);
}

function buildSeedState(products) {
  const state = {};

  for (const product of products) {
    state[product.id] = {};
    for (const entry of product.inventory || []) {
      state[product.id][entry.size] = entry.quantity;
    }
  }

  return state;
}

async function seedInventoryFromProducts() {
  const products = loadProductsFromFile();

  if (USE_KV) {
    const kv = getKv();

    for (const product of products) {
      for (const entry of product.inventory || []) {
        const key = inventoryKey(product.id, entry.size);
        const existing = await kv.get(key);
        if (existing === null) {
          await kv.set(key, entry.quantity);
        }
      }
    }

    return;
  }

  if (!fs.existsSync(getLiveInventoryFile())) {
    writeFileState(buildSeedState(products));
  }
}

function getCatalogQuantity(productId, size) {
  const product = loadProductsFromFile().find((entry) => entry.id === productId);
  const entry = product?.inventory?.find((item) => item.size === size);
  return entry ? entry.quantity : 0;
}

async function getQuantity(productId, size) {
  productId = resolveProductId(productId);

  if (process.env.VERCEL && !USE_KV) {
    return getCatalogQuantity(productId, size);
  }

  await seedInventoryFromProducts();

  if (USE_KV) {
    const kv = getKv();
    const value = await kv.get(inventoryKey(productId, size));
    return value === null ? 0 : Number(value);
  }

  const state = readFileState();
  return state[productId]?.[size] ?? 0;
}

async function setQuantity(productId, size, quantity) {
  productId = resolveProductId(productId);

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Invalid inventory quantity for ${productId} (${size}).`);
  }

  assertInventoryBackend();
  await seedInventoryFromProducts();

  if (USE_KV) {
    await getKv().set(inventoryKey(productId, size), quantity);
    return quantity;
  }

  const state = readFileState();
  if (!state[productId]) {
    state[productId] = {};
  }
  state[productId][size] = quantity;
  writeFileState(state);
  return quantity;
}

async function increment(productId, size, amount) {
  productId = resolveProductId(productId);

  if (amount <= 0) {
    return;
  }

  if (USE_KV) {
    await getKv().incrby(inventoryKey(productId, size), amount);
    return;
  }

  const state = readFileState();
  if (!state[productId]) {
    state[productId] = {};
  }
  state[productId][size] = (state[productId][size] ?? 0) + amount;
  writeFileState(state);
}

async function decrement(productId, size, amount) {
  productId = resolveProductId(productId);

  if (amount <= 0) {
    return getQuantity(productId, size);
  }

  assertInventoryBackend();
  await seedInventoryFromProducts();

  if (USE_KV) {
    const key = inventoryKey(productId, size);
    const newValue = await getKv().decrby(key, amount);
    if (newValue < 0) {
      await getKv().incrby(key, amount);
      throw new Error(`Not enough stock for ${productId} (${size}).`);
    }
    return newValue;
  }

  const state = readFileState();
  const current = state[productId]?.[size] ?? 0;
  if (current < amount) {
    throw new Error(`Not enough stock for ${productId} (${size}).`);
  }

  state[productId][size] = current - amount;
  writeFileState(state);
  return state[productId][size];
}

async function reserveItems(items) {
  const reserved = [];

  try {
    for (const item of items) {
      await decrement(item.id, item.size, item.quantity);
      reserved.push(item);
    }
  } catch (error) {
    await releaseItems(reserved);
    throw error;
  }

  return reserved;
}

async function releaseItems(items) {
  for (const item of items) {
    await increment(item.id, item.size, item.quantity);
  }
}

async function finalizeCheckoutSession(sessionId, items) {
  if (!sessionId || !items.length) {
    return;
  }

  if (USE_KV) {
    const kv = getKv();
    const flagKey = finalizedFlagKey(sessionId);
    if (await kv.get(flagKey)) {
      return;
    }

    await reserveItems(items);
    await kv.set(flagKey, "1", { ex: 60 * 60 * 24 * 7 });
    return;
  }

  const state = readFileState();
  if (!state.__finalizedSessions) {
    state.__finalizedSessions = {};
  }
  if (state.__finalizedSessions[sessionId]) {
    return;
  }

  await reserveItems(items);

  const updatedState = readFileState();
  if (!updatedState.__finalizedSessions) {
    updatedState.__finalizedSessions = {};
  }
  updatedState.__finalizedSessions[sessionId] = true;
  writeFileState(updatedState);
}

async function markCheckoutSessionFinalized(sessionId) {
  if (!sessionId) {
    return;
  }

  if (USE_KV) {
    const flagKey = finalizedFlagKey(sessionId);
    if (await getKv().get(flagKey)) {
      return;
    }
    await getKv().set(flagKey, "1", { ex: 60 * 60 * 24 * 7 });
    return;
  }

  const state = readFileState();
  if (!state.__finalizedSessions) {
    state.__finalizedSessions = {};
  }
  state.__finalizedSessions[sessionId] = true;
  writeFileState(state);
}

async function releaseCheckoutSession(sessionId, items) {
  if (!sessionId || !items.length) {
    return;
  }

  if (USE_KV) {
    const kv = getKv();
    const flagKey = releaseFlagKey(sessionId);
    const alreadyReleased = await kv.get(flagKey);
    if (alreadyReleased) {
      return;
    }

    await releaseItems(items);
    await kv.set(flagKey, "1", { ex: 60 * 60 * 24 * 7 });
    return;
  }

  const state = readFileState();
  if (!state.__releasedSessions) {
    state.__releasedSessions = {};
  }
  if (state.__releasedSessions[sessionId]) {
    return;
  }

  await releaseItems(items);

  const updatedState = readFileState();
  if (!updatedState.__releasedSessions) {
    updatedState.__releasedSessions = {};
  }
  updatedState.__releasedSessions[sessionId] = true;
  writeFileState(updatedState);
}

async function mergeLiveInventory(products) {
  await seedInventoryFromProducts();

  return Promise.all(
    products.map(async (product) => ({
      ...product,
      inventory: await Promise.all(
        (product.inventory || []).map(async (entry) => ({
          size: entry.size,
          quantity: await getQuantity(product.id, entry.size),
        }))
      ),
    }))
  );
}

module.exports = {
  USE_KV,
  getQuantity,
  setQuantity,
  reserveItems,
  releaseItems,
  finalizeCheckoutSession,
  markCheckoutSessionFinalized,
  releaseCheckoutSession,
  mergeLiveInventory,
  seedInventoryFromProducts,
};
