# Payment Microservice

Microservicio de pagos escalable implementado con NestJS utilizando Abstract Factory Pattern.

## Arquitectura

```
src/payments/
├── domain/             # Lógica de negocio pura
│   ├── entities/       # Entidades del dominio
│   ├── repositories/   # Contratos de repositorios
│   └── services/       # Servicios del dominio
├── infrastructure/     # Implementaciones concretas
│   ├── factories/      # Abstract Factory y factories concretas
│   ├── processors/     # Procesadores específicos por proveedor
│   └── adapters/       # Adaptadores externos
├── application/        # Casos de uso
│   ├── dto/            # Data Transfer Objects
│   ├── services/       # Servicios de aplicación
│   └── handlers/       # Manejadores de comandos/eventos
└── presentation/       # Capa de presentación
    ├── controllers/    # Controladores REST
    └── middleware/     # Middleware específico
```

## Patrones Implementados

### Abstract Factory Pattern
- **PaymentProcessorFactory**: Factory abstracta para crear familias de objetos
- **StripePaymentFactory**: Factory concreta para Stripe
- **PayPalPaymentFactory**: Factory concreta para PayPal

### Factory Registry Pattern
- **PaymentFactoryRegistry**: Registro dinámico de factories

### Strategy Pattern (Implícito)
- Cada processor implementa una estrategia diferente de procesamiento

## Proveedores Soportados

- ✅ Stripe (Estructura creada)
- ✅ PayPal (Estructura creada)
- 🔄 MercadoPago (Por implementar)
- 🔄 Crypto (Por implementar)

## Cómo Agregar un Nuevo Proveedor

1. Crear nueva factory: `infrastructure/factories/nuevo-proveedor.factory.ts`
2. Implementar processor: `infrastructure/processors/nuevo-proveedor.processor.ts`
3. Implementar validator y notifier correspondientes
4. Registrar en el PaymentFactoryRegistry
5. Agregar configuración en `config/payment.config.ts`

## TODO: Implementaciones Pendientes

### Domain Layer
- [ ] Completar métodos de Payment entity
- [ ] Implementar PaymentDomainService
- [ ] Crear repositorio concreto

### Infrastructure Layer
- [ ] Implementar StripePaymentProcessor
- [ ] Implementar PayPalPaymentProcessor
- [ ] Crear validators específicos
- [ ] Crear notifiers específicos

### Application Layer
- [ ] Completar PaymentApplicationService
- [ ] Implementar handlers de eventos
- [ ] Agregar validaciones en DTOs

### Presentation Layer
- [ ] Implementar endpoints en controllers
- [ ] Agregar middleware de seguridad
- [ ] Manejo de errores

### Configuration
- [ ] Setup de variables de entorno
- [ ] Configuración por ambiente
- [ ] Registro automático de factories

## Variables de Entorno Requeridas

```env
# Stripe
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENVIRONMENT=sandbox

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=...
MERCADOPAGO_PUBLIC_KEY=...
```

## Uso Básico

```typescript
// Inyectar el servicio
constructor(
  private readonly paymentService: PaymentApplicationService
) {}

// Procesar un pago
const payment = await this.paymentService.processPayment({
  amount: 100,
  currency: 'USD',
  provider: PaymentProvider.STRIPE,
  paymentMethod: { /* datos del método de pago */ }
});
```
