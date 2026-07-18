-- =============================================
-- TABLAS ADICIONALES: MIS PEDIDOS (cliente)
-- Extiende el esquema lumenstore existente
-- =============================================

USE lumenstore;

-- =============================================
-- 1. HISTORIAL DE ESTADOS DEL PEDIDO
-- Permite mostrar la línea de tiempo real
-- (Confirmado → Preparando → Enviado → Entregado) con fecha exacta
-- =============================================

CREATE TABLE order_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    status ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL,
    notes TEXT,
    changed_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================
-- 2. DEVOLUCIONES Y CAMBIOS (por producto, no por todo el pedido)
-- =============================================

CREATE TABLE returns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sale_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    return_number VARCHAR(30) NOT NULL UNIQUE,
    reason ENUM('defective', 'wrong_item', 'not_as_described', 'no_longer_needed', 'wrong_size', 'other') NOT NULL,
    reason_detail TEXT,
    return_type ENUM('refund', 'exchange') NOT NULL,
    status ENUM('requested', 'approved', 'rejected', 'in_transit', 'received', 'completed') DEFAULT 'requested',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE return_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    return_id BIGINT NOT NULL,
    sale_detail_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    refund_amount DECIMAL(12,2) NULL,
    FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_detail_id) REFERENCES sale_details(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE return_status_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    return_id BIGINT NOT NULL,
    status ENUM('requested', 'approved', 'rejected', 'in_transit', 'received', 'completed') NOT NULL,
    notes TEXT,
    changed_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================
-- 3. SOPORTE / TICKETS LIGADOS A UN PEDIDO
-- =============================================

CREATE TABLE support_tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    sale_id BIGINT NULL,
    subject VARCHAR(255) NOT NULL,
    category ENUM('order_issue', 'payment', 'shipping', 'product', 'return', 'other') DEFAULT 'other',
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE support_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    sender_type ENUM('customer', 'staff') NOT NULL,
    sender_customer_id BIGINT NULL,
    sender_user_id BIGINT NULL,
    message TEXT NOT NULL,
    attachment_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================
-- 4. CANCELACIÓN DE PEDIDO (registro del motivo)
-- =============================================

ALTER TABLE sales
    ADD COLUMN cancelled_at TIMESTAMP NULL AFTER status,
    ADD COLUMN cancelled_by BIGINT NULL AFTER cancelled_at,
    ADD COLUMN cancellation_reason VARCHAR(255) NULL AFTER cancelled_by;

-- =============================================
-- 5. ÍNDICES
-- =============================================

CREATE INDEX idx_order_status_history_sale ON order_status_history(sale_id);
CREATE INDEX idx_returns_sale ON returns(sale_id);
CREATE INDEX idx_returns_customer ON returns(customer_id);
CREATE INDEX idx_return_items_return ON return_items(return_id);
CREATE INDEX idx_support_tickets_customer ON support_tickets(customer_id);
CREATE INDEX idx_support_messages_ticket ON support_messages(ticket_id);
