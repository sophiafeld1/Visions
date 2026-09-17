const path = require("path");
const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  createInventoryTestEnv,
  reloadInventoryStore,
} = require("./helpers/inventory-test-env");

const CHECKOUT_PATH = path.join(__dirname, "../lib/checkout");
const WEBHOOK_HANDLERS_PATH = path.join(__dirname, "../lib/stripe-webhook-handlers");

const TEST_PRODUCT = "off-shoulder-red-polka-dot-top";
const TEST_SIZE = "XS/S";

function mockStripe() {
  return {
    prices: {
      list: async () => ({
        data: [{ id: "price_test_mock" }],
      }),
    },
  };
}

function loadCheckoutModule() {
  delete require.cache[CHECKOUT_PATH];
  delete require.cache[path.join(__dirname, "../lib/inventory-store")];
  return require(CHECKOUT_PATH);
}

describe("checkout inventory validation", { concurrency: 1 }, () => {
  /** @type {ReturnType<typeof createInventoryTestEnv>} */
  let testEnv;
  /** @type {ReturnType<typeof reloadInventoryStore>} */
  let inventory;
  /** @type {ReturnType<typeof loadCheckoutModule>} */
  let checkout;

  beforeEach(async () => {
    testEnv = createInventoryTestEnv();
    inventory = reloadInventoryStore();
    checkout = loadCheckoutModule();
    await inventory.seedInventoryFromProducts();
  });

  afterEach(() => {
    testEnv.restore();
    delete require.cache[CHECKOUT_PATH];
  });

  it("allows checkout when stock is available", async () => {
    const result = await checkout.validateCartItems(
      [{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }],
      mockStripe()
    );

    assert.equal(result.reservationItems.length, 1);
    assert.equal(result.reservationItems[0].id, TEST_PRODUCT);
    assert.equal(result.metadataItems[0], `${TEST_PRODUCT}:${TEST_SIZE}:1`);
  });

  it("rejects checkout when stock is already reserved", async () => {
    await inventory.reserveItems([{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }]);

    await assert.rejects(
      () =>
        checkout.validateCartItems(
          [{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }],
          mockStripe()
        ),
      /Not enough stock for Ruby Off-Shoulder Top in Red Polka \(XS\/S\)\./
    );
  });

  it("rejects checkout when quantity exceeds available stock", async () => {
    await assert.rejects(
      () =>
        checkout.validateCartItems(
          [{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 2 }],
          mockStripe()
        ),
      /Not enough stock for Ruby Off-Shoulder Top in Red Polka \(XS\/S\)\./
    );
  });

  it("prevents a second shopper from checking out after the first reserves the last unit", async () => {
    await inventory.reserveItems([{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }]);

    const secondShopper = checkout.validateCartItems(
      [{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }],
      mockStripe()
    );

    await assert.rejects(() => secondShopper, /Not enough stock/);
    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 0);
  });
});

describe("checkout webhook release", { concurrency: 1 }, () => {
  /** @type {ReturnType<typeof createInventoryTestEnv>} */
  let testEnv;
  /** @type {ReturnType<typeof reloadInventoryStore>} */
  let inventory;

  beforeEach(async () => {
    testEnv = createInventoryTestEnv();
    inventory = reloadInventoryStore();
    await inventory.seedInventoryFromProducts();
  });

  afterEach(() => {
    testEnv.restore();
    delete require.cache[WEBHOOK_HANDLERS_PATH];
  });

  it("restores stock when Stripe sends checkout.session.expired", async () => {
    delete require.cache[WEBHOOK_HANDLERS_PATH];
    const { maybeReleaseCheckoutInventory } = require(WEBHOOK_HANDLERS_PATH);
    const items = [{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }];

    await inventory.reserveItems(items);
    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 0);

    await maybeReleaseCheckoutInventory({
      id: "cs_test_expired_1",
      payment_status: "unpaid",
      metadata: {
        inventory_reserved: "true",
        cart: `${TEST_PRODUCT}:${TEST_SIZE}:1`,
      },
    });

    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 1);
  });

  it("keeps stock at zero after a paid checkout session", async () => {
    delete require.cache[WEBHOOK_HANDLERS_PATH];
    const { maybeReleaseCheckoutInventory } = require(WEBHOOK_HANDLERS_PATH);
    const items = [{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }];

    await inventory.reserveItems(items);

    await maybeReleaseCheckoutInventory({
      id: "cs_test_paid_1",
      payment_status: "paid",
      metadata: {
        inventory_reserved: "true",
        cart: `${TEST_PRODUCT}:${TEST_SIZE}:1`,
      },
    });

    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 0);
  });
});
