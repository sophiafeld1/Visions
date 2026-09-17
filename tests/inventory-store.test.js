const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const {
  createInventoryTestEnv,
  reloadInventoryStore,
} = require("./helpers/inventory-test-env");

const TEST_PRODUCT = "off-shoulder-red-polka-dot-top";
const TEST_SIZE = "XS/S";

describe("inventory store", { concurrency: 1 }, () => {
  /** @type {ReturnType<typeof createInventoryTestEnv>} */
  let testEnv;
  /** @type {ReturnType<typeof reloadInventoryStore>} */
  let inventory;

  beforeEach(() => {
    testEnv = createInventoryTestEnv();
    inventory = reloadInventoryStore();
  });

  afterEach(() => {
    testEnv.restore();
  });

  it("seeds and reads stock from the isolated test file", async () => {
    await inventory.seedInventoryFromProducts();
    const quantity = await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE);
    assert.equal(quantity, 1);
    assert.match(fs.readFileSync(testEnv.tempFile, "utf8"), /off-shoulder-red-polka-dot-top/);
  });

  it("reserves stock when checkout starts", async () => {
    await inventory.seedInventoryFromProducts();

    await inventory.reserveItems([{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }]);

    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 0);
  });

  it("blocks a second purchase when only one item is left", async () => {
    await inventory.seedInventoryFromProducts();

    await inventory.reserveItems([{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }]);

    await assert.rejects(
      () => inventory.reserveItems([{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }]),
      /Not enough stock/
    );

    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 0);
  });

  it("allows only one winner when two checkouts race for the last item", async () => {
    await inventory.seedInventoryFromProducts();

    const attempts = await Promise.allSettled([
      inventory.reserveItems([{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }]),
      inventory.reserveItems([{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }]),
    ]);

    const successes = attempts.filter((result) => result.status === "fulfilled");
    const failures = attempts.filter((result) => result.status === "rejected");

    assert.equal(successes.length, 1);
    assert.equal(failures.length, 1);
    assert.match(failures[0].reason.message, /Not enough stock/);
    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 0);
  });

  it("restores stock when a checkout session is released", async () => {
    await inventory.seedInventoryFromProducts();
    const items = [{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }];

    await inventory.reserveItems(items);
    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 0);

    await inventory.releaseCheckoutSession("cs_test_session_1", items);
    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 1);
  });

  it("does not double-restore stock for the same checkout session", async () => {
    await inventory.seedInventoryFromProducts();
    const items = [{ id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 }];

    await inventory.reserveItems(items);
    await inventory.releaseCheckoutSession("cs_test_session_2", items);
    await inventory.releaseCheckoutSession("cs_test_session_2", items);

    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 1);
  });

  it("rolls back partial reservations when a multi-item checkout runs out of stock", async () => {
    await inventory.seedInventoryFromProducts();
    const blackTie = "v-neck-tie-top";

    await inventory.reserveItems([{ id: blackTie, size: "XS/S", quantity: 4 }]);
    assert.equal(await inventory.getQuantity(blackTie, "XS/S"), 0);

    await assert.rejects(
      () =>
        inventory.reserveItems([
          { id: blackTie, size: "XS/S", quantity: 1 },
          { id: TEST_PRODUCT, size: TEST_SIZE, quantity: 1 },
        ]),
      /Not enough stock/
    );

    assert.equal(await inventory.getQuantity(blackTie, "XS/S"), 0);
    assert.equal(await inventory.getQuantity(TEST_PRODUCT, TEST_SIZE), 1);
  });
});
