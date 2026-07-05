-- =============================================
-- LUMENSTORE SEED DATA
-- Uses INSERT IGNORE to handle existing data
-- =============================================

-- Insert more brands (skip if exists)
INSERT IGNORE INTO brands (name, slug, description, is_active) VALUES
('Nike', 'nike', 'Just Do It', TRUE),
('Adidas', 'adidas', 'Impossible Is Nothing', TRUE),
('Samsung', 'samsung', 'Do What You Can\'t', TRUE),
('Apple', 'apple', 'Think Different', TRUE),
('Sony', 'sony', 'Believe in the Power of Play', TRUE),
('LG', 'lg', 'Life\'s Good', TRUE),
('Huawei', 'huawei', 'Make It Possible', TRUE);

-- Insert categories (skip if exists)
INSERT IGNORE INTO categories (name, slug, description, is_active) VALUES
('Electrónica', 'electronica', 'Productos electrónicos y gadgets', TRUE),
('Ropa y Moda', 'ropa-moda', 'Prendas de vestir y accesorios', TRUE),
('Hogar', 'hogar', 'Artículos para el hogar', TRUE),
('Deportes', 'deportes', 'Equipamiento deportivo', TRUE),
('Libros', 'libros', 'Libros y material de lectura', TRUE),
('Juguetes', 'juguetes', 'Juguetes y juegos', TRUE);

-- Insert subcategories
INSERT IGNORE INTO categories (name, slug, description, parent_id, is_active)
SELECT 'Smartphones', 'smartphones', 'Teléfonos inteligentes', id, TRUE FROM categories WHERE slug = 'electronica';
INSERT IGNORE INTO categories (name, slug, description, parent_id, is_active)
SELECT 'Laptops', 'laptops', 'Computadoras portátiles', id, TRUE FROM categories WHERE slug = 'electronica';
INSERT IGNORE INTO categories (name, slug, description, parent_id, is_active)
SELECT 'Auriculares', 'auriculares', 'Audífonos y cascos', id, TRUE FROM categories WHERE slug = 'electronica';
INSERT IGNORE INTO categories (name, slug, description, parent_id, is_active)
SELECT 'Zapatillas', 'zapatillas', 'Zapatillas deportivas', id, TRUE FROM categories WHERE slug = 'ropa-moda';
INSERT IGNORE INTO categories (name, slug, description, parent_id, is_active)
SELECT 'Camisetas', 'camisetas', 'Camisetas y polos', id, TRUE FROM categories WHERE slug = 'ropa-moda';
INSERT IGNORE INTO categories (name, slug, description, parent_id, is_active)
SELECT 'Muebles', 'muebles', 'Muebles para el hogar', id, TRUE FROM categories WHERE slug = 'hogar';

-- Insert sizes (skip if exists)
INSERT IGNORE INTO sizes (name, sort_order) VALUES
('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6),
('36', 7), ('37', 8), ('38', 9), ('39', 10), ('40', 11), ('41', 12), ('42', 13);

-- Insert colors (skip if exists)
INSERT IGNORE INTO colors (name, hex_code) VALUES
('Negro', '#000000'), ('Blanco', '#FFFFFF'), ('Rojo', '#FF0000'),
('Azul', '#0000FF'), ('Verde', '#00FF00'), ('Gris', '#808080'),
('Plateado', '#C0C0C0'), ('Oro', '#FFD700'), ('Rosa', '#FFC0CB'),
('Morado', '#800080');

-- Create more products (skip if exists)
INSERT IGNORE INTO products (name, slug, description, short_description, brand_id, category_id, sku, is_active, featured)
SELECT 'Nike Air Max 270', 'nike-air-max-270', 'Zapatillas Nike Air Max 270 con amortiguación de aire para máxima comodidad.', 'Zapatillas deportivas con estilo', b.id, c.id, 'NIKE-AM270-001', TRUE, TRUE
FROM brands b, categories c WHERE b.slug = 'nike' AND c.slug = 'zapatillas';

INSERT IGNORE INTO products (name, slug, description, short_description, brand_id, category_id, sku, is_active, featured)
SELECT 'Adidas Ultraboost 22', 'adidas-ultraboost-22', 'Zapatillas Adidas Ultraboost 22 con tecnología Boost para energía infinita.', 'Corre más lejos con Ultraboost', b.id, c.id, 'ADI-UB22-001', TRUE, TRUE
FROM brands b, categories c WHERE b.slug = 'adidas' AND c.slug = 'zapatillas';

INSERT IGNORE INTO products (name, slug, description, short_description, brand_id, category_id, sku, is_active, featured)
SELECT 'Samsung Galaxy S24', 'samsung-galaxy-s24', 'Smartphone Samsung Galaxy S24 con inteligencia artificial y cámara de 200MP.', 'El poder de la IA en tus manos', b.id, c.id, 'SAM-GS24-001', TRUE, TRUE
FROM brands b, categories c WHERE b.slug = 'samsung' AND c.slug = 'smartphones';

INSERT IGNORE INTO products (name, slug, description, short_description, brand_id, category_id, sku, is_active, featured)
SELECT 'iPhone 15 Pro', 'iphone-15-pro', 'Apple iPhone 15 Pro con chip A17 Pro y titanio de grado aeroespacial.', 'El iPhone más pro que nunca', b.id, c.id, 'APP-IP15P-001', TRUE, TRUE
FROM brands b, categories c WHERE b.slug = 'apple' AND c.slug = 'smartphones';

INSERT IGNORE INTO products (name, slug, description, short_description, brand_id, category_id, sku, is_active, featured)
SELECT 'Sony WH-1000XM5', 'sony-wh-1000xm5', 'Auriculares inalámbricos Sony con cancelación de ruido líder en la industria.', 'Silencio absoluto', b.id, c.id, 'SONY-WH5-001', TRUE, TRUE
FROM brands b, categories c WHERE b.slug = 'sony' AND c.slug = 'auriculares';

INSERT IGNORE INTO products (name, slug, description, short_description, brand_id, category_id, sku, is_active, featured)
SELECT 'LG OLED C3 65"', 'lg-oled-c3-65', 'Smart TV LG OLED C3 de 65 pulgadas con calidad de imagen perfecta.', 'Experiencia visual inmersiva', b.id, c.id, 'LG-OLED65-001', TRUE, TRUE
FROM brands b, categories c WHERE b.slug = 'lg' AND c.slug = 'electronica';

INSERT IGNORE INTO products (name, slug, description, short_description, brand_id, category_id, sku, is_active, featured)
SELECT 'Camiseta Nike Dri-FIT', 'camiseta-nike-dri-fit', 'Camiseta deportiva Nike Dri-FIT que mantiene tu cuerpo seco y fresco.', 'Rendimiento y estilo', b.id, c.id, 'NIKE-DF-001', TRUE, TRUE
FROM brands b, categories c WHERE b.slug = 'nike' AND c.slug = 'camisetas';

INSERT IGNORE INTO products (name, slug, description, short_description, brand_id, category_id, sku, is_active, featured)
SELECT 'Huawei MateBook 16', 'huawei-matebook-16', 'Laptop Huawei MateBook 16 con pantalla táctil de alta resolución.', 'Potencia y portabilidad', b.id, c.id, 'HUA-MB16-001', TRUE, TRUE
FROM brands b, categories c WHERE b.slug = 'huawei' AND c.slug = 'laptops';

-- Update existing product
UPDATE products SET featured = TRUE, is_active = TRUE WHERE slug = 'camiseta-lumen';

-- Insert variants for each product (skip if exists)
INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'LUMEN-CAM-NEGRO-M', sz.id, cl.id, 49.90, 50, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'camiseta-lumen' AND sz.name = 'M' AND cl.hex_code = '#000000';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'LUMEN-CAM-BLANCO-M', sz.id, cl.id, 49.90, 30, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'camiseta-lumen' AND sz.name = 'M' AND cl.hex_code = '#FFFFFF';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'LUMEN-CAM-NEGRO-L', sz.id, cl.id, 49.90, 40, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'camiseta-lumen' AND sz.name = 'L' AND cl.hex_code = '#000000';

-- Nike Air Max 270 variants
INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'NIKE-AM270-NEGRO-40', sz.id, cl.id, 299.00, 25, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'nike-air-max-270' AND sz.name = '40' AND cl.hex_code = '#000000';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'NIKE-AM270-BLANCO-40', sz.id, cl.id, 299.00, 15, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'nike-air-max-270' AND sz.name = '40' AND cl.hex_code = '#FFFFFF';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'NIKE-AM270-NEGRO-42', sz.id, cl.id, 299.00, 20, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'nike-air-max-270' AND sz.name = '42' AND cl.hex_code = '#000000';

-- Adidas Ultraboost 22 variants
INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'ADI-UB22-NEGRO-40', sz.id, cl.id, 259.00, 30, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'adidas-ultraboost-22' AND sz.name = '40' AND cl.hex_code = '#000000';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'ADI-UB22-GRIS-40', sz.id, cl.id, 259.00, 20, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'adidas-ultraboost-22' AND sz.name = '40' AND cl.hex_code = '#808080';

-- Samsung Galaxy S24 variants
INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'SAM-GS24-NEGRO', NULL, cl.id, 3299.00, 50, TRUE
FROM products p, colors cl WHERE p.slug = 'samsung-galaxy-s24' AND cl.hex_code = '#000000';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'SAM-GS24-PLATEADO', NULL, cl.id, 3299.00, 30, TRUE
FROM products p, colors cl WHERE p.slug = 'samsung-galaxy-s24' AND cl.hex_code = '#C0C0C0';

-- iPhone 15 Pro variants
INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'APP-IP15P-NEGRO', NULL, cl.id, 4999.00, 40, TRUE
FROM products p, colors cl WHERE p.slug = 'iphone-15-pro' AND cl.hex_code = '#000000';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'APP-IP15P-ORO', NULL, cl.id, 4999.00, 20, TRUE
FROM products p, colors cl WHERE p.slug = 'iphone-15-pro' AND cl.hex_code = '#FFD700';

-- Sony WH-1000XM5 variants
INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'SONY-WH5-NEGRO', NULL, cl.id, 899.00, 35, TRUE
FROM products p, colors cl WHERE p.slug = 'sony-wh-1000xm5' AND cl.hex_code = '#000000';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'SONY-WH5-PLATEADO', NULL, cl.id, 899.00, 20, TRUE
FROM products p, colors cl WHERE p.slug = 'sony-wh-1000xm5' AND cl.hex_code = '#C0C0C0';

-- LG OLED C3 variant
INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'LG-OLED65-NEGRO', NULL, cl.id, 4299.00, 10, TRUE
FROM products p, colors cl WHERE p.slug = 'lg-oled-c3-65' AND cl.hex_code = '#000000';

-- Camiseta Nike Dri-FIT variants
INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'NIKE-DF-NEGRO-M', sz.id, cl.id, 79.90, 60, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'camiseta-nike-dri-fit' AND sz.name = 'M' AND cl.hex_code = '#000000';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'NIKE-DF-AZUL-M', sz.id, cl.id, 79.90, 45, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'camiseta-nike-dri-fit' AND sz.name = 'M' AND cl.hex_code = '#0000FF';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'NIKE-DF-NEGRO-L', sz.id, cl.id, 79.90, 55, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'camiseta-nike-dri-fit' AND sz.name = 'L' AND cl.hex_code = '#000000';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'NIKE-DF-BLANCO-M', sz.id, cl.id, 79.90, 35, TRUE
FROM products p, sizes sz, colors cl WHERE p.slug = 'camiseta-nike-dri-fit' AND sz.name = 'M' AND cl.hex_code = '#FFFFFF';

-- Huawei MateBook 16 variants
INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'HUA-MB16-PLATEADO', NULL, cl.id, 3599.00, 15, TRUE
FROM products p, colors cl WHERE p.slug = 'huawei-matebook-16' AND cl.hex_code = '#C0C0C0';

INSERT IGNORE INTO product_variants (product_id, sku, size_id, color_id, price, stock, is_active)
SELECT p.id, 'HUA-MB16-NEGRO', NULL, cl.id, 3599.00, 10, TRUE
FROM products p, colors cl WHERE p.slug = 'huawei-matebook-16' AND cl.hex_code = '#000000';

-- Insert discounts (skip if exists)
INSERT IGNORE INTO discounts (name, description, discount_type, value, is_active) VALUES
('Oferta de Verano', 'Descuento por temporada de verano', 'percentage', 15.00, TRUE),
('Liquidación', 'Liquidación de productos seleccionados', 'percentage', 30.00, TRUE),
('Cyber Monday', 'Descuento especial Cyber Monday', 'percentage', 20.00, TRUE);

-- Apply discounts to products (skip if exists)
INSERT IGNORE INTO product_discounts (product_id, discount_id)
SELECT p.id, d.id FROM products p, discounts d WHERE p.slug = 'nike-air-max-270' AND d.name = 'Oferta de Verano';

INSERT IGNORE INTO product_discounts (product_id, discount_id)
SELECT p.id, d.id FROM products p, discounts d WHERE p.slug = 'sony-wh-1000xm5' AND d.name = 'Oferta de Verano';

INSERT IGNORE INTO product_discounts (product_id, discount_id)
SELECT p.id, d.id FROM products p, discounts d WHERE p.slug = 'camiseta-lumen' AND d.name = 'Liquidación';