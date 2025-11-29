-- Agregar columna metadata a la tabla pagos si no existe

-- 備考: MySQL no soporta `ADD COLUMN IF NOT EXISTS` directamente en `ALTER TABLE`.
-- La lógica para verificar la existencia de la columna debe manejarse en el script de migración o manualmente.
ALTER TABLE `pagos`
ADD COLUMN `metadata` JSON NULL COMMENT 'Metadata adicional del pago (PayPal Order ID, etc.)';

-- Actualizar la columna estado para incluir REFUNDED si no existe
ALTER TABLE pagos 
MODIFY COLUMN estado ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING';

-- Verificar los cambios
DESCRIBE pagos;
