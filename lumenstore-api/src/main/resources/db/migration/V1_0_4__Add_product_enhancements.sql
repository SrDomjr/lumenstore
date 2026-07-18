-- ============================================================
-- Migration V1_0_4: Add new fields to products and product_variants
-- ============================================================
-- Esta migración hace ALTER TABLE solo si las columnas NO existen aún,
-- para ser segura incluso si una V2 previa con otro checksum ya fue aplicada.

-- ─── Producto: SEO fields ──────────────────────────────────
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'meta_title');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE products
        ADD COLUMN meta_title VARCHAR(255) DEFAULT NULL AFTER featured,
        ADD COLUMN meta_description TEXT DEFAULT NULL AFTER meta_title,
        ADD COLUMN meta_keywords VARCHAR(500) DEFAULT NULL AFTER meta_description',
    'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ─── Producto: Additional attributes ───────────────────────
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'material');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE products
        ADD COLUMN material VARCHAR(255) DEFAULT NULL AFTER meta_keywords,
        ADD COLUMN weight DECIMAL(10,2) DEFAULT NULL AFTER material,
        ADD COLUMN dimensions VARCHAR(100) DEFAULT NULL AFTER weight,
        ADD COLUMN gender VARCHAR(50) DEFAULT NULL AFTER dimensions,
        ADD COLUMN warranty VARCHAR(255) DEFAULT NULL AFTER gender,
        ADD COLUMN manufacturer VARCHAR(255) DEFAULT NULL AFTER warranty,
        ADD COLUMN country_of_origin VARCHAR(100) DEFAULT NULL AFTER manufacturer',
    'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ─── Producto: Configurations ──────────────────────────────
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'free_shipping');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE products
        ADD COLUMN free_shipping TINYINT(1) DEFAULT 0 AFTER country_of_origin,
        ADD COLUMN is_new TINYINT(1) DEFAULT 0 AFTER free_shipping,
        ADD COLUMN visibility VARCHAR(50) DEFAULT ''visible'' AFTER is_new',
    'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ─── ProductVariant: New fields ────────────────────────────
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' AND COLUMN_NAME = 'cost');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE product_variants
        ADD COLUMN cost DECIMAL(12,2) DEFAULT NULL AFTER is_active,
        ADD COLUMN min_stock INT DEFAULT 0 AFTER cost,
        ADD COLUMN image_url VARCHAR(255) DEFAULT NULL AFTER min_stock',
    'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;