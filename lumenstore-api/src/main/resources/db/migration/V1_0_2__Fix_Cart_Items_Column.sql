-- Corregir el nombre de columna en cart_items
-- Si existe product_variant_id, eliminarla y dejar solo variant_id

SET @fk_name = (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' 
                AND COLUMN_NAME = 'product_variant_id' AND REFERENCED_TABLE_NAME IS NOT NULL 
                LIMIT 1);

SET @drop_fk = IF(@fk_name IS NOT NULL, CONCAT('ALTER TABLE cart_items DROP FOREIGN KEY ', @fk_name), 'SELECT 1');
PREPARE stmt FROM @drop_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_col = (SELECT COUNT(*) FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items' 
                AND COLUMN_NAME = 'product_variant_id');

SET @drop_col = IF(@has_col > 0, 'ALTER TABLE cart_items DROP COLUMN product_variant_id', 'SELECT 1');
PREPARE stmt FROM @drop_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;