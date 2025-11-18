-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS titec CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE titec;

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id_pagos INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario VARCHAR(45) NOT NULL,
  id_carrito VARCHAR(45) NULL,
  monto DECIMAL(10, 2) NOT NULL,
  tipo_moneda VARCHAR(3) DEFAULT 'CLP',
  estado ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  proveedor ENUM('stripe', 'paypal', 'webpay') NOT NULL,
  id_transaccion_proveedor VARCHAR(255) NULL,
  ultimos_cuatro_digitos VARCHAR(4) NULL,
  nombre_titular VARCHAR(255) NULL,
  descripcion TEXT NULL,
  id_pago_stripe VARCHAR(255) NULL,
  id_pago_contabilidad_stripe VARCHAR(255) NULL,
  id_pago_paypal VARCHAR(255) NULL,
  fecha_reembolso DATETIME NULL,
  razon_reembolso VARCHAR(500) NULL,
  monto_reembolsado DECIMAL(10, 2) NULL,
  metadata JSON NULL COMMENT 'Metadata adicional (PayPal Order ID, etc.)',
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_usuario (id_usuario),
  INDEX idx_proveedor (proveedor),
  INDEX idx_estado (estado),
  INDEX idx_transaccion (id_transaccion_proveedor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de historial de errores
CREATE TABLE IF NOT EXISTS historial_de_errores (
  id_error INT AUTO_INCREMENT PRIMARY KEY,
  id_pago INT NOT NULL,
  fecha_error DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  codigo_error VARCHAR(50) NULL,
  mensaje_error TEXT NULL,
  FOREIGN KEY (id_pago) REFERENCES pagos(id_pagos) ON DELETE CASCADE,
  INDEX idx_pago (id_pago)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar las tablas creadas
SHOW TABLES;

SELECT 'Database schema created successfully!' as status;
