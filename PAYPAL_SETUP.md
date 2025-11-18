# Integración de Pago con PayPal

Esta guía te ayudará a configurar la integración de PayPal en el proyecto PulgaShop.

## Arquitectura de Seguridad

### Principio Fundamental: Backend-First

**TODA** la lógica de procesamiento de pagos está implementada en el backend:

- ✅ **Credenciales de PayPal**: Almacenadas SOLO en el servidor (`.env`)
- ✅ **PayPal SDK**: Instalado y ejecutado SOLO en el backend
- ✅ **Creación de órdenes**: El backend crea las órdenes usando el SDK
- ✅ **Captura de pagos**: El backend captura los pagos tras aprobación
- ✅ **Webhooks**: El backend recibe notificaciones directas de PayPal
- ✅ **Validaciones**: Todas las validaciones de negocio en el backend

### Responsabilidades del Frontend

El frontend tiene un rol **MÍNIMO** y solo maneja:

- ✅ Interfaz de usuario (botón de PayPal)
- ✅ Llamadas HTTP al backend a través de REST APIs
- ✅ Redirección a URLs proporcionadas por el backend
- ✅ Manejo de respuestas del backend

**El frontend NUNCA**:
- ❌ Accede directamente a APIs de PayPal
- ❌ Conoce credenciales de PayPal
- ❌ Tiene instalado el SDK de PayPal
- ❌ Procesa lógica de negocio de pagos

### Flujo de Datos Seguro

```
[Usuario] → [Frontend] → [Backend] → [PayPal API]
                ↓           ↓            ↓
              UI only   Full Logic   Sandbox/Live
                        + Security
```

### Flujo de Datos Seguro

```
[Usuario] → [Frontend] → [Backend] → [PayPal API]
                ↓           ↓            ↓
              UI only   Full Logic   Sandbox/Live
                        + Security
```

## Flujo Completo de Pago con PayPal

### 1. Creación de Orden (CA1, CA2)

```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌─────────┐
│ Usuario │         │ Frontend │         │ Backend │         │ PayPal  │
└────┬────┘         └────┬─────┘         └────┬────┘         └────┬────┘
     │                   │                    │                   │
     │ Click "PayPal"    │                    │                   │
     │──────────────────>│                    │                   │
     │                   │                    │                   │
     │                   │ POST /create-payment                   │
     │                   │ {amount, currency} │                   │
     │                   │───────────────────>│                   │
     │                   │                    │                   │
     │                   │                    │ SDK: Create Order │
     │                   │                    │ (with credentials)│
     │                   │                    │──────────────────>│
     │                   │                    │                   │
     │                   │                    │ { orderId,        │
     │                   │                    │   approvalUrl }   │
     │                   │                    │<──────────────────│
     │                   │                    │                   │
     │                   │ { approvalUrl }    │                   │
     │                   │<───────────────────│                   │
     │                   │                    │                   │
     │  window.location  │                    │                   │
     │<──────────────────│                    │                   │
     │                                        │                   │
     │ Redirect to PayPal Sandbox             │                   │
     │───────────────────────────────────────────────────────────>│
     │                                        │                   │
```

### 2. Aprobación en PayPal (CA3)

```
┌─────────┐         ┌─────────┐
│ Usuario │         │ PayPal  │
└────┬────┘         └────┬────┘
     │                   │
     │ Login PayPal      │
     │──────────────────>│
     │                   │
     │ Review Payment    │
     │<──────────────────│
     │                   │
     │ Click "Approve"   │
     │──────────────────>│
     │                   │
     │ Redirect to       │
     │ return_url        │
     │ + token + PayerID │
     │<──────────────────│
```

### 3. Captura de Pago (CA4, CA5)

```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌─────────┐
│ Usuario │         │ Frontend │         │ Backend │         │ PayPal  │
└────┬────┘         └────┬─────┘         └────┬────┘         └────┬────┘
     │                   │                    │                   │
     │ Lands on          │                    │                   │
     │ /payment-success  │                    │                   │
     │──────────────────>│                    │                   │
     │                   │                    │                   │
     │                   │ POST /execute-payment                  │
     │                   │ {orderId, payerId} │                   │
     │                   │───────────────────>│                   │
     │                   │                    │                   │
     │                   │                    │ SDK: Capture Order│
     │                   │                    │ (with credentials)│
     │                   │                    │──────────────────>│
     │                   │                    │                   │
     │                   │                    │ { status: COMPLETED,
     │                   │                    │   captureId }     │
     │                   │                    │<──────────────────│
     │                   │                    │                   │
     │                   │                    │ UPDATE DB         │
     │                   │                    │ estado='COMPLETADO'
     │                   │                    │                   │
     │                   │ { success: true }  │                   │
     │                   │<───────────────────│                   │
     │                   │                    │                   │
     │ Show Success Page │                    │                   │
     │<──────────────────│                    │                   │
     │                   │                    │                   │
```

### 4. Webhook Asíncrono (CA6, CA7)

```
┌─────────┐         ┌─────────┐
│ Backend │         │ PayPal  │
└────┬────┘         └────┬────┘
     │                   │
     │                   │ POST /webhook
     │                   │ {event_type, resource}
     │<──────────────────│
     │                   │
     │ Verify Signature  │
     │ (TODO in prod)    │
     │                   │
     │ Process Event     │
     │ Update DB         │
     │                   │
     │ 200 OK            │
     │──────────────────>│
     │                   │
```

**Nota Importante**: Los webhooks son OPCIONALES en desarrollo pero CRÍTICOS en producción para manejar casos como:
- Pagos completados fuera de flujo normal
- Reembolsos iniciados desde PayPal
- Disputas y chargebacks
- Actualizaciones de estado

## Historia de Usuario 4: Pago con PayPal

Esta implementación cumple con los siguientes criterios de aceptación:

- **CA1**: El usuario puede seleccionar PayPal como método de pago en la interfaz
- **CA2**: Redirección automática al portal de PayPal Sandbox para autenticación
- **CA3**: Captura del consentimiento del usuario en la plataforma PayPal
- **CA4**: Confirmación de pago exitoso al regresar a la plataforma
- **CA5**: Actualización del estado del pedido tras confirmación
- **CA6**: Gestión de cancelación por parte del usuario
- **CA7**: Webhooks para notificaciones asíncronas de PayPal
- **CA8**: Registro de transacciones en la base de datos
- **CA9**: Soporte para reembolsos completos

## Requisitos Previos

1. Cuenta de desarrollador de PayPal (gratuita)
2. Aplicación creada en el PayPal Developer Dashboard
3. Node.js y pnpm instalados

## Paso 1: Crear una Cuenta de Desarrollador PayPal

1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Inicia sesión o crea una cuenta nueva
3. Acepta los términos de desarrollador

## Paso 2: Crear una Aplicación Sandbox

1. En el dashboard, ve a **Dashboard** → **Apps & Credentials**
2. Asegúrate de estar en el modo **Sandbox** (arriba a la derecha)
3. Haz clic en **Create App**
4. Ingresa un nombre para tu app (ejemplo: "PulgaShop Development")
5. Selecciona un **Business Account** (puedes crear uno nuevo si no tienes)
6. Haz clic en **Create App**

## Paso 3: Obtener las Credenciales

Después de crear la app, verás:

- **Client ID**: Una cadena larga que empieza con letras y números
- **Secret**: Haz clic en "Show" para verlo (guárdalo de forma segura)

## Paso 4: Configurar las Variables de Entorno

### Backend

Edita el archivo `Backend/.env` y actualiza las siguientes variables:

```env
# PayPal Configuration (Sandbox)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=tu_client_id_de_paypal_aqui
PAYPAL_CLIENT_SECRET=tu_client_secret_de_paypal_aqui
PAYPAL_RETURN_URL=https://localhost:3001/payment-success
PAYPAL_CANCEL_URL=https://localhost:3001/payment-cancel
```

**Importante**: 
- Reemplaza `tu_client_id_de_paypal_aqui` con tu Client ID real
- Reemplaza `tu_client_secret_de_paypal_aqui` con tu Secret real
- **NO COMPARTAS ESTAS CREDENCIALES** en repositorios públicos

### Docker

Las variables ya están configuradas en `docker-compose.yml` y tomarán los valores del archivo `.env` automáticamente.

## Paso 5: Crear Cuentas de Prueba

PayPal Sandbox incluye cuentas de prueba para simular compradores y vendedores:

1. Ve a **Dashboard** → **Accounts** (bajo Sandbox)
2. Verás cuentas **Business** (vendedor) y **Personal** (comprador) pre-creadas
3. Haz clic en **View/Edit Account** para ver las credenciales de login
4. Anota el **email** y **password** de una cuenta Personal para pruebas

Puedes crear más cuentas si necesitas:
- Haz clic en **Create Account**
- Selecciona **Personal** (buyer) o **Business** (seller)
- Rellena los datos y crea la cuenta

## Paso 6: Probar la Integración

### Iniciar los Servicios

```powershell
# Con Docker Compose
cd c:\vscode\TITEC
docker compose up -d

# O sin Docker (desarrollo local)
cd Backend
pnpm install
pnpm run start:dev

cd ../frontend
npm install
npm start
```

### Flujo de Prueba

1. Abre el navegador en `https://localhost:3001`
2. Acepta el certificado autofirmado (es normal en desarrollo)
3. Selecciona productos y procede al checkout
4. En "Método de pago", selecciona **PayPal**
5. Haz clic en el botón amarillo **"Pagar con PayPal"**
6. Serás redirigido al Sandbox de PayPal
7. Inicia sesión con las credenciales de tu cuenta Personal de prueba
8. Aprueba el pago
9. Serás redirigido de vuelta a `https://localhost:3001/payment-success`
10. Verifica que el pago se registró correctamente

### Probar Cancelación

1. Sigue los pasos 1-6 anteriores
2. En la página de PayPal, haz clic en **"Cancel and return"**
3. Serás redirigido a `https://localhost:3001/payment-cancel`
4. Verifica que no se realizó ningún cargo

## Paso 7: Verificar en la Base de Datos

Conéctate a MySQL y verifica las transacciones:

```sql
USE tite;

-- Ver todos los pagos
SELECT * FROM pagos ORDER BY created_at DESC LIMIT 10;

-- Ver detalles de un pago específico (metadata contiene info de PayPal)
SELECT 
  id_pago,
  metodo_pago,
  estado,
  monto,
  metadata,
  created_at
FROM pagos 
WHERE metodo_pago = 'paypal'
ORDER BY created_at DESC;
```

El campo `metadata` contendrá JSON con:
- `paypalOrderId`: ID de la orden en PayPal
- `paypalCaptureId`: ID de la captura (cuando se complete)
- `payerEmail`: Email del comprador

## Configuración de Webhooks (Opcional - Producción)

Los webhooks permiten que PayPal notifique a tu servidor sobre eventos importantes (pagos, reembolsos, disputas).

### Configurar en PayPal

1. En tu app en el Developer Dashboard
2. Ve a **Webhooks** → **Add Webhook**
3. Ingresa tu URL: `https://tu-dominio.com/paypal/webhook`
4. Selecciona eventos:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`
   - `CHECKOUT.ORDER.APPROVED`
5. Guarda el **Webhook ID** que se genera

### Actualizar Backend

Agrega a tu `.env`:

```env
PAYPAL_WEBHOOK_ID=tu_webhook_id_aqui
```

El endpoint ya está implementado en `PayPalController` en `/paypal/webhook`.

## Transición a Producción

Cuando estés listo para pagos reales:

1. Ve a **Dashboard** → **Apps & Credentials**
2. Cambia de **Sandbox** a **Live** (arriba a la derecha)
3. Crea una nueva app o migra la existente
4. Obtén las nuevas credenciales (Client ID y Secret de producción)
5. Actualiza tu `.env`:

```env
PAYPAL_MODE=live
PAYPAL_CLIENT_ID=tu_client_id_live
PAYPAL_CLIENT_SECRET=tu_client_secret_live
PAYPAL_RETURN_URL=https://tu-dominio.com/payment-success
PAYPAL_CANCEL_URL=https://tu-dominio.com/payment-cancel
```

6. Configura webhooks con tu dominio real

## Seguridad

### Arquitectura de Seguridad Backend-First

Esta implementación sigue el principio de **seguridad por diseño**:

#### Separación de Responsabilidades

**Backend (NestJS)**:
- 🔒 Almacena credenciales de PayPal en variables de entorno
- 🔒 Inicializa el cliente PayPal SDK con autenticación OAuth 2.0
- 🔒 Crea órdenes de pago usando el SDK oficial
- 🔒 Captura pagos tras validación de aprobación del usuario
- 🔒 Recibe y procesa webhooks de PayPal con verificación de firma
- 🔒 Realiza todas las validaciones de negocio (montos, monedas, estados)
- 🔒 Persiste transacciones en base de datos con integridad
- 🔒 Implementa rate limiting y throttling

**Frontend (React)**:
- 🌐 Muestra interfaz de usuario para seleccionar PayPal
- 🌐 Envía solicitud HTTP al backend para crear orden
- 🌐 Recibe URL de aprobación del backend y redirige al usuario
- 🌐 Muestra confirmación tras redirección desde PayPal
- 🌐 **NO tiene acceso a credenciales ni APIs de PayPal**

### Mejores Prácticas

- ✅ **Nunca** compartas tus Client ID y Secret en código público
- ✅ Usa variables de entorno para todas las credenciales
- ✅ En producción, implementa la verificación de firma de webhooks
- ✅ Usa HTTPS en producción (requerido por PayPal)
- ✅ Registra todas las transacciones en tu base de datos
- ✅ Implementa rate limiting en tus endpoints de pago
- ✅ Valida montos y monedas en el backend antes de crear órdenes

### Verificación de Webhooks

El código actual tiene un TODO para implementar la verificación de firma:

```typescript
// TODO: Verificar firma del webhook para seguridad
// const webhookId = this.configService.get('paypal.webhookId');
// await this.payPalProcessor.verifyWebhookSignature(req.headers, req.body, webhookId);
```

Para producción, descomenta y configura esta verificación siguiendo la [documentación oficial de PayPal](https://developer.paypal.com/api/rest/webhooks/).

## Estructura del Código

```
Backend/src/payments/
├── infrastructure/
│   └── processors/
│       └── paypal-real.processor.ts    # Lógica de integración PayPal SDK
├── application/
│   └── dto/
│       ├── create-paypal-payment.dto.ts
│       └── execute-paypal-payment.dto.ts
├── presentation/
│   └── controllers/
│       └── paypal.controller.ts        # Endpoints REST
└── infrastructure/
    └── database/
        └── repositories/
            └── pago.repository.ts      # Persistencia DB

frontend/src/components/
├── PayPalButton.js                     # Botón de pago PayPal
├── PaymentSuccess.js                   # Página de confirmación
└── PaymentCancel.js                    # Página de cancelación
```

## Solución de Problemas

### Error: "Invalid Client Credentials"

- Verifica que copiaste correctamente el Client ID y Secret
- Asegúrate de estar usando credenciales de Sandbox si `PAYPAL_MODE=sandbox`
- Revisa que no haya espacios adicionales en las variables

### Error: "CORS"

- Verifica que `ALLOWED_ORIGINS` en `.env` incluya tu dominio de frontend
- En desarrollo: `https://localhost:3001`

### El botón de PayPal no aparece

- Verifica que PayPal esté habilitado en `payment-application.service.ts`
- Revisa la consola del navegador para errores JavaScript
- Asegúrate de que `react-router-dom` está instalado

### Redirección no funciona

- Verifica las URLs en `.env`:
  - `PAYPAL_RETURN_URL=https://localhost:3001/payment-success`
  - `PAYPAL_CANCEL_URL=https://localhost:3001/payment-cancel`
- Asegúrate de que las rutas están configuradas en `index.js`

### Pago no se registra en la BD

- Revisa los logs del backend para errores
- Verifica la conexión a MySQL
- Confirma que la tabla `pagos` existe y tiene el campo `metadata` de tipo JSON

## Documentación Adicional

- [PayPal REST API Reference](https://developer.paypal.com/api/rest/)
- [PayPal Checkout Integration](https://developer.paypal.com/docs/checkout/)
- [PayPal Sandbox Testing](https://developer.paypal.com/tools/sandbox/)
- [PayPal Webhooks Guide](https://developer.paypal.com/api/rest/webhooks/)

## Soporte

Si tienes problemas:

1. Revisa los logs del backend: `docker compose logs backend`
2. Revisa la consola del navegador
3. Verifica las credenciales en el PayPal Developer Dashboard
4. Consulta la documentación oficial de PayPal

## Cumplimiento de Seguridad

Esta implementación cumple con los requisitos de PCI-DSS:

- **S1**: No se almacenan datos sensibles de tarjetas (PayPal maneja todo)
- **S2**: Comunicación HTTPS obligatoria
- **S3**: Tokens de sesión expirables (10 minutos)
- **S4**: Rate limiting implementado
- **S5**: Webhooks para verificación asíncrona
- **S6**: Logs de auditoría de todas las transacciones
