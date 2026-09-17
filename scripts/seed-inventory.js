#!/usr/bin/env node
require("dotenv").config();
const { seedInventoryFromProducts } = require("../lib/inventory-store");

seedInventoryFromProducts()
  .then(() => {
    console.log("Inventory seeded from data/products.json.");
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
