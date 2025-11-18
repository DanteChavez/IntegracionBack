-- Agregar columna metadata a la tabla pagos si no existe

ALTER TABLE pagos 
ADD COLUMN IF NOT EXISTS metadata JSON NULL COMMENT 'Metadata adicional del pago (PayPal Order ID, etc.)';

-- Actualizar la columna estado para incluir REFUNDED si no existe
ALTER TABLE pagos 
MODIFY COLUMN estado ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';

-- Verificar los cambios
DESCRIBE pagos;
