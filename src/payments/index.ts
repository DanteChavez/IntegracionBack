// Exportar entidades del dominio
export * from './domain/entities/payment.entity';
export * from './domain/entities/payment-method.entity';

// Exportar interfaces y contratos
export * from './infrastructure/factories/payment-processor.interface';
export * from './infrastructure/factories/payment-validator.interface';
export * from './infrastructure/factories/payment-notifier.interface';
export * from './infrastructure/factories/payment-processor.factory';

// Exportar servicios públicos
export * from './application/services/payment-application.service';
export * from './infrastructure/factories/payment-factory-registry.service';

// Exportar DTOs
export * from './application/dto/process-payment.dto';
export * from './application/dto/refund-payment.dto';

// Exportar módulo principal
export * from './payments.module';

// Exportar configuración
export * from './config/payment.config';

// TODO: Agregar más exports según sea necesario
// export * from './domain/events/payment.events';
// export * from './infrastructure/adapters/database.adapter';
// export * from './application/handlers/payment.handlers';
