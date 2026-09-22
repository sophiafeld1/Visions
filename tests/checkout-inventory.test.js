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

  it("rejects checkout when the item is sold out", async () => {
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

  it("skips shipping fees when the cart only contains noShipping products", () => {
    const productsStore = require(path.join(__dirname, "../lib/products-store"));
    const noShippingId = "test-no-shipping-item";
    const originalGetProductById = productsStore.getProductById;

    productsStore.getProductById = (id) => {
      if (productsStore.resolveProductId(id) === noShippingId) {
        return { id: noShippingId, noShipping: true };
      }
      return originalGetProductById(id);
    };

    try {
      assert.equal(checkout.cartRequiresShipping([{ id: noShippingId }]), false);
      assert.equal(
        checkout.cartRequiresShipping([{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }]),
        true
      );
      assert.equal(
        checkout.cartRequiresShipping([
          { id: noShippingId, size: "XS/S", quantity: 1 },
          { id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 },
        ]),
        true
      );
    } finally {
      productsStore.getProductById = originalGetProductById;
    }
  });

  it("allows checkout while another open session has not been paid yet", async () => {
    const result = await checkout.validateCartItems(
      [{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }],
      mockStripe()
    );

    assert.equal(result.reservationItems.length, 1);
    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 1);
  });
});

describe("checkout webhook inventory", { concurrency: 1 }, () => {
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

  it("deducts stock when Stripe sends checkout.session.completed", async () => {
    delete require.cache[WEBHOOK_HANDLERS_PATH];
    const { maybeFinalizeCheckoutInventory } = require(WEBHOOK_HANDLERS_PATH);

    await maybeFinalizeCheckoutInventory({
      id: "cs_test_paid_1",
      payment_status: "paid",
      metadata: {
        cart: `${TEST_PRODUCT}:${TEST_SIZE}:1`,
      },
    });

    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 0);
  });

  it("does not restore stock when an unpaid session expires", async () => {
    delete require.cache[WEBHOOK_HANDLERS_PATH];
    const { maybeReleaseCheckoutInventory } = require(WEBHOOK_HANDLERS_PATH);

    await maybeReleaseCheckoutInventory({
      id: "cs_test_expired_1",
      payment_status: "unpaid",
      metadata: {
        cart: `${TEST_PRODUCT}:${TEST_SIZE}:1`,
      },
    });

    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 1);
  });

  it("restores stock for legacy sessions that reserved inventory up front", async () => {
    delete require.cache[WEBHOOK_HANDLERS_PATH];
    const { maybeReleaseCheckoutInventory } = require(WEBHOOK_HANDLERS_PATH);
    const items = [{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }];

    await inventory.reserveItems(items);
    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 0);

    await maybeReleaseCheckoutInventory({
      id: "cs_test_expired_legacy",
      payment_status: "unpaid",
      metadata: {
        inventory_reserved: "true",
        cart: `${TEST_PRODUCT}:${TEST_SIZE}:1`,
      },
    });

    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 1);
  });
});
