# Backend NestJS para GPI Template - Universidad de Valparaíso

Este proyecto es un backend desarrollado con NestJS que implementa un sistema completo de procesamiento de pagos con múltiples proveedores (Stripe, PayPal, Webpay), autenticación JWT, gestión de usuarios y documentación interactiva con Swagger.

## 🚀 Tecnologías

Este backend utiliza las siguientes tecnologías:

- **NestJS**: Framework progresivo para construir aplicaciones del lado del servidor
- **TypeScript**: Superset tipado de JavaScript
- **MongoDB**: Base de datos NoSQL orientada a documentos
- **Mongoose**: Biblioteca ODM (Object Data Modeling) para MongoDB
- **JWT**: JSON Web Tokens para autenticación
- **Passport**: Middleware para autenticación
- **Swagger/OpenAPI**: Documentación interactiva de la API
- **Class Validator**: Validación de datos basada en decoradores
- **bcrypt**: Librería para hashear contraseñas
- **HTTPS/TLS**: Comunicación segura con certificados SSL

## 📁 Estructura de Carpetas

```
backend/
├── src/
│   ├── app.module.ts                # Módulo principal
│   ├── main.ts                      # Punto de entrada con HTTPS y Swagger
│   ├── config/                      # Configuraciones
│   │   ├── database.config.ts       # Configuración de MongoDB
│   │   ├── jwt.config.ts            # Configuración de JWT
│   │   └── env.config.ts            # Variables de entorno
│   ├── auth/                        # Módulo de autenticación
│   │   ├── auth.module.ts           # Módulo de autenticación
│   │   ├── auth.controller.ts       # Controlador
│   │   ├── auth.service.ts          # Servicio
│   │   ├── dto/                     # DTOs para validación
│   │   │   ├── login.dto.ts         # Login DTO
│   │   │   └── register.dto.ts      # Registro DTO
│   │   ├── guards/                  # Guards para proteger rutas
│   │   │   └── jwt-auth.guard.ts    # Guard de JWT
│   │   └── strategies/              # Estrategias de Passport
│   │       └── jwt.strategy.ts      # Estrategia JWT
│   ├── users/                       # Módulo de usuarios
│   │   ├── users.module.ts          # Módulo de usuarios
│   │   ├── users.controller.ts      # Controlador
│   │   ├── users.service.ts         # Servicio
│   │   ├── schemas/                 # Esquemas de MongoDB
│   │   │   └── user.schema.ts       # Esquema de usuario
│   │   └── dto/                     # DTOs
│   │       ├── create-user.dto.ts   # DTO para crear usuario
│   │       └── update-user.dto.ts   # DTO para actualizar usuario
│   ├── payments/                    # Módulo de pagos (DDD Architecture)
│   │   ├── payments.module.ts       # Módulo de pagos
│   │   ├── application/             # Capa de aplicación
│   │   │   ├── dto/                 # DTOs de pagos
│   │   │   │   ├── process-payment.dto.ts
│   │   │   │   └── refund-payment.dto.ts
│   │   │   ├── handlers/            # Manejadores de comandos/eventos
│   │   │   └── services/            # Servicios de aplicación
│   │   │       └── payment-application.service.ts
│   │   ├── domain/                  # Capa de dominio
│   │   │   ├── entities/            # Entidades de dominio
│   │   │   │   ├── payment.entity.ts
│   │   │   │   └── payment-method.entity.ts
│   │   │   ├── repositories/        # Interfaces de repositorios
│   │   │   │   └── payment.repository.ts
│   │   │   └── services/            # Servicios de dominio
│   │   │       └── payment-domain.service.ts
│   │   ├── infrastructure/          # Capa de infraestructura
│   │   │   ├── adapters/            # Adaptadores externos
│   │   │   ├── factories/           # Fábricas de procesadores
│   │   │   │   ├── payment-factory-registry.service.ts
│   │   │   │   ├── payment-processor.factory.ts
│   │   │   │   ├── payment-processor.interface.ts
│   │   │   │   ├── payment-validator.interface.ts
│   │   │   │   ├── payment-notifier.interface.ts
│   │   │   │   ├── stripe-payment.factory.ts
│   │   │   │   └── paypal-payment.factory.ts
│   │   │   └── processors/          # Procesadores de pago
│   │   │       ├── stripe-payment.processor.ts
│   │   │       └── paypal-payment.processor.ts
│   │   └── presentation/            # Capa de presentación
│   │       ├── controllers/         # Controladores HTTP
│   │       │   ├── payment.controller.ts
│   │       │   └── webhook.controller.ts
│   │       └── middleware/          # Middlewares
│   └── common/                      # Código compartido
├── secrets/                         # Certificados SSL/TLS
│   ├── pulgashopkey.pem            # Clave privada
│   └── pulgashopcert.pem           # Certificado
├── .env                             # Variables de entorno
├── nest-cli.json                    # Configuración de NestJS CLI
├── package.json                     # Dependencias
└── tsconfig.json                    # Configuración de TypeScript
```

## 🏗️ Arquitectura

### Módulos Principales

El backend está organizado en módulos, siguiendo las mejores prácticas de NestJS:

- **AppModule**: Módulo raíz que importa el resto de módulos
- **AuthModule**: Gestiona la autenticación y autorización con JWT
- **UsersModule**: Gestiona las operaciones CRUD de usuarios
- **PaymentsModule**: Sistema completo de procesamiento de pagos con arquitectura DDD

### Arquitectura DDD del Módulo de Pagos

El módulo de pagos implementa Domain-Driven Design (DDD) con las siguientes capas:

1. **Domain (Dominio)**:
   - Entidades de negocio (`Payment`, `PaymentMethod`)
   - Interfaces de repositorios
   - Servicios de dominio con lógica de negocio

2. **Application (Aplicación)**:
   - DTOs para validación de entrada
   - Servicios de aplicación que orquestan casos de uso
   - Handlers de comandos y eventos

3. **Infrastructure (Infraestructura)**:
   - Implementaciones de repositorios
   - Adaptadores a servicios externos (Stripe, PayPal, Webpay)
   - Factories para crear procesadores de pago
   - Procesadores específicos por proveedor

4. **Presentation (Presentación)**:
   - Controladores HTTP con documentación Swagger
   - Middlewares de validación
   - Webhooks para notificaciones de proveedores

### Patrón Factory

El sistema utiliza el patrón Factory para crear procesadores de pago dinámicamente:

```typescript
// Registro centralizado de fábricas
PaymentFactoryRegistry
  ├── StripePaymentFactory
  ├── PayPalPaymentFactory
  └── WebpayPaymentFactory

// Cada factory implementa
interface IPaymentProcessorFactory {
  createProcessor(): IPaymentProcessor;
  createValidator(): IPaymentValidator;
  createNotifier(): IPaymentNotifier;
}
```

### Sistema de Autenticación

La autenticación está implementada usando JWT (JSON Web Tokens):

1. El usuario se registra o inicia sesión
2. El servidor valida las credenciales y genera un token JWT
3. El cliente almacena el token y lo incluye en cada solicitud
4. Los guards verifican el token para proteger las rutas

### HTTPS y Seguridad

- El servidor está configurado para ejecutarse con HTTPS usando certificados SSL/TLS
- Los certificados se almacenan en la carpeta `secrets/`

## ⚙️ Instalación y Configuración

### Requisitos Previos

- Node.js (versión 18.x o superior)
- pnpm (gestor de paquetes)
- Certificados SSL para HTTPS (opcional en desarrollo)

### Instalación

1. Clona este repositorio:
   ```bash
   git clone <url-del-repositorio>
   ```

2. Instala las dependencias con pnpm:
   ```bash
   pnpm install
   ```

3. Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
   ```env
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=EstoEsUnSecretoSuperSeguroParaElCursoGPI
   JWT_EXPIRES_IN=1d
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # PayPal
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_MODE=sandbox
   
   # Webpay
   WEBPAY_COMMERCE_CODE=your_commerce_code
   WEBPAY_API_KEY=your_api_key
   ```

4. Genera certificados SSL para HTTPS (opcional en desarrollo):
   ```bash
   mkdir secrets
   # Copiar tus certificados pulgashopkey.pem y pulgashopcert.pem a secrets/
   ```

### Ejecución

- **Desarrollo**:
  ```bash
  pnpm start:dev
  ```
  Esto iniciará el servidor en modo desarrollo con recarga automática en `https://localhost:3000/api`

- **Producción**:
  ```bash
  pnpm build
  pnpm start:prod
  ```

## 📚 Documentación API (Swagger)

Una vez iniciado el servidor, la documentación interactiva de Swagger está disponible en:

```
https://localhost:3000/api/docs
```

Swagger proporciona:
- Documentación completa de todos los endpoints
- Posibilidad de probar las APIs directamente desde el navegador
- Esquemas de request/response
- Códigos de estado HTTP y ejemplos

## 🌐 API Endpoints

### Autenticación

- **POST /api/auth/register**: Registrar un nuevo usuario
  ```json
  {
    "name": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```

- **POST /api/auth/login**: Iniciar sesión
  ```json
  {
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
  Respuesta:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "john.doe@example.com",
      "name": "John",
      "lastName": "Doe"
    }
  }
  ```

- **GET /api/auth/me**: Obtener información del usuario autenticado (requiere token JWT)

### Usuarios

- **GET /api/users**: Obtener todos los usuarios (requiere token JWT)
- **GET /api/users/:id**: Obtener un usuario por ID (requiere token JWT)
- **PATCH /api/users/:id**: Actualizar un usuario (requiere token JWT)
- **DELETE /api/users/:id**: Eliminar un usuario (requiere token JWT)

### Pagos

- **POST /api/pagos/process**: Procesar un nuevo pago
  ```json
  {
    "amount": 10000,
    "currency": "CLP",
    "paymentMethod": "stripe",
    "description": "Compra de producto",
    "metadata": {
      "orderId": "12345",
      "customerId": "user123"
    }
  }
  ```

- **GET /api/pagos**: Obtener todos los pagos (paginado)
  ```
  Query params: ?page=1&limit=10&status=completed
  ```

- **GET /api/pagos/:id**: Obtener detalles de un pago específico

- **POST /api/pagos/:id/refund**: Solicitar reembolso de un pago
  ```json
  {
    "amount": 10000,
    "reason": "Producto defectuoso"
  }
  ```

- **POST /api/pagos/:id/cancel**: Cancelar un pago pendiente

### Webhooks

- **POST /api/webhooks/stripe**: Webhook para notificaciones de Stripe
- **POST /api/webhooks/paypal**: Webhook para notificaciones de PayPal
- **POST /api/webhooks/webpay**: Webhook para notificaciones de Webpay

## 💳 Proveedores de Pago Soportados

### Stripe

- Procesamiento de tarjetas de crédito/débito
- Pagos recurrentes
- Gestión de reembolsos
- Webhooks para notificaciones en tiempo real

### PayPal

- Pagos con cuenta PayPal
- Checkout Express
- Gestión de reembolsos
- Notificaciones IPN (Instant Payment Notification)

### Webpay (Transbank)

- Procesamiento de pagos en Chile
- Integración con Webpay Plus
- Soporte para tarjetas chilenas
- Validación con OneClick

## 🔄 Integración con el Frontend

Para integrar este backend con el frontend React:

1. Configura la URL base de la API:
   ```typescript
   // config/api.ts
   import axios from 'axios';

   export const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL || 'https://localhost:3000/api',
     timeout: 10000,
     headers: {
       'Content-Type': 'application/json'
     }
   });

   // Interceptor para añadir el token de autenticación
   api.interceptors.request.use(config => {
     const token = localStorage.getItem('token');
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });
   ```

2. Implementa servicios para autenticación:
   ```typescript
   // services/auth.service.ts
   const login = async (email: string, password: string) => {
     const response = await api.post('/auth/login', { email, password });
     localStorage.setItem('token', response.data.access_token);
     return response.data.user;
   };
   ```

3. Implementa servicios para pagos:
   ```typescript
   // services/payment.service.ts
   const processPayment = async (paymentData: ProcessPaymentDto) => {
     const response = await api.post('/pagos/process', paymentData);
     return response.data;
   };

   const getPaymentStatus = async (paymentId: string) => {
     const response = await api.get(`/pagos/${paymentId}`);
     return response.data;
   };
   ```

## 🧠 Conceptos Clave para Estudiantes

### DTO (Data Transfer Object)

Los DTOs definen la estructura de los datos que se reciben en las solicitudes HTTP:

```typescript
export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
```

Los decoradores como `@IsNotEmpty()` y `@IsEmail()` validan automáticamente los datos recibidos.

### Esquemas de Mongoose

Definen la estructura de los documentos en MongoDB:

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user' }) // 'admin' o 'user'
  role: string;

  @Prop({ default: true })
  isActive: boolean;
}
```

### Guards

Protegen las rutas y verifican permisos:

```typescript
@UseGuards(JwtAuthGuard)
@Get()
findAll() {
  return this.usersService.findAll();
}
```

### Inyección de Dependencias

NestJS utiliza inyección de dependencias para gestionar servicios y componentes:

```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // ...
}
```

## 🛠️ Personalización y Extensión

### Añadir un Nuevo Proveedor de Pago

1. Crea una nueva factory en `src/payments/infrastructure/factories/`:
   ```typescript
   @Injectable()
   export class MercadoPagoPaymentFactory implements IPaymentProcessorFactory {
     createProcessor(): IPaymentProcessor {
       return new MercadoPagoPaymentProcessor();
     }
     // ...
   }
   ```

2. Implementa el procesador en `src/payments/infrastructure/processors/`:
   ```typescript
   export class MercadoPagoPaymentProcessor implements IPaymentProcessor {
     async process(payment: Payment): Promise<PaymentResult> {
       // Lógica de integración con Mercado Pago
     }
   }
   ```

3. Registra la factory en el módulo de pagos:
   ```typescript
   @Module({
     providers: [
       // ...
       MercadoPagoPaymentFactory,
     ],
   })
   export class PaymentsModule {
     constructor(
       private registry: PaymentFactoryRegistry,
       private mercadoPagoFactory: MercadoPagoPaymentFactory,
     ) {
       this.registry.register('mercadopago', this.mercadoPagoFactory);
     }
   }
   ```

### Añadir un Nuevo Módulo

1. Genera el módulo con NestJS CLI:
   ```bash
   nest generate module orders
   nest generate controller orders
   nest generate service orders
   ```

2. Define el esquema, DTOs y lógica de negocio

3. Importa el módulo en `app.module.ts`

## 🧪 Testing

```bash
# Tests unitarios
pnpm test

# Tests e2e
pnpm test:e2e

# Cobertura de tests
pnpm test:cov
```

## 🔐 Seguridad

- Las contraseñas se hashean con bcrypt antes de almacenarse
- JWT con tiempo de expiración configurable
- HTTPS obligatorio en producción
- Validación de entrada en todos los endpoints
- Rate limiting recomendado para producción
- Webhooks validados con firmas de proveedor

## ⚠️ Notas Importantes

- Este backend está diseñado para desarrollo local. Para producción, se deben implementar medidas de seguridad adicionales.
- El secreto JWT debe mantenerse seguro y cambiarse en un entorno de producción.
- Las contraseñas se almacenan hasheadas, pero se pueden implementar políticas más estrictas.
- La conexión a MongoDB está configurada para una instancia local. Para producción, considera usar MongoDB Atlas u otro servicio en la nube.

---

Desarrollado para la asignatura de Gestión de Proyecto Informático - Diego Monsalves - René Noël - Universidad de Valparaíso
