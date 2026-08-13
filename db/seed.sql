INSERT INTO products (id, name, color, color_swatch, price, image, description)
VALUES (
  'v-neck-tie-top',
  'V Neck Tie Top',
  'Black',
  '#1a1a1a',
  48.00,
  'images/v-neck-tie-top.jpg',
  'A relaxed v-neck with a soft tie detail. Lightweight and flattering.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  color_swatch = EXCLUDED.color_swatch,
  price = EXCLUDED.price,
  image = EXCLUDED.image,
  description = EXCLUDED.description;

INSERT INTO inventory (product_id, size, quantity)
VALUES ('v-neck-tie-top', 'XS', 10)
ON CONFLICT (product_id, size) DO UPDATE SET
  quantity = EXCLUDED.quantity;
