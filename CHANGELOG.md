# Changelog - Backend

Todos los cambios notables en el backend serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-11-03

### 🧹 Removido (Removed)

#### Módulo Users - Limpieza de Endpoints No Funcionales
- **Eliminados** 5 endpoints CRUD que no funcionaban:
  - ❌ `POST /api/users` - Crear usuario (lanzaba ConflictException)
  - ❌ `GET /api/users` - Listar usuarios (retornaba array vacío)
  - ❌ `GET /api/users/{id}` - Obtener usuario por ID (lanzaba NotFoundException)
  - ❌ `PATCH /api/users/{id}` - Actualizar usuario (lanzaba NotFoundException)
  - ❌ `DELETE /api/users/{id}` - Eliminar usuario (lanzaba NotFoundException)

- **Eliminados** archivos innecesarios:
  - ❌ `src/users/users.service.ts` - Servicio no utilizado
  - ❌ `src/users/schemas/dto/create-user.dto.ts` - DTO no usado
  - ❌ `src/users/schemas/dto/update-user.dto.ts` - DTO no usado
  - ❌ Carpeta completa `src/users/schemas/` - Ya no necesaria

### ✅ Mantenido (Kept)

#### Módulo Users - Endpoints Funcionales
- ✅ `GET /api/users/current` - Obtiene usuario desde `usuario.json`
- ✅ `GET /api/users/cart` - Obtiene carrito con cálculo de IVA

### 🔧 Arreglado (Fixed)

#### Módulo Auth
- **Fix**: Eliminada dependencia de `UsersService` inexistente
  - `auth.service.ts`: Ya no importa ni inyecta `UsersService`
  - `jwt.strategy.ts`: Simplificado para solo validar token JWT
  - `auth.module.ts`: Ya no importa `UsersModule`
  - Endpoints siguen lanzando `NotImplementedException` (fuera del alcance)

### 📝 Documentación (Documentation)

#### README.md
- **Actualizado**: Sección "Usuarios"
  - Eliminada documentación de endpoints CRUD no funcionales
  - Agregados solo 2 endpoints que funcionan
  - Nota explicativa sobre simplificación
  - Ejemplos de respuesta actualizados

#### Swagger/OpenAPI
- **Agregado**: Tag `'usuarios'` en configuración
  - Descripción: "👤 Datos de usuario y carrito (solo lectura desde JSON)"
  - Documentación completa con `@ApiOperation` y `@ApiResponse`
  - Ejemplos de respuesta en cada endpoint

#### Comentarios en Código
- **Agregados**: Comentarios explicativos en:
  - `users.controller.ts`: "Solo proporciona datos desde JSON"
  - `users.module.ts`: "No incluye CRUD (fuera del alcance)"
  - `auth.service.ts`: "Autenticación no implementada"
  - `jwt.strategy.ts`: "No valida usuarios contra BD"

### 🎯 Mejoras de Arquitectura

#### Antes:
```
Swagger UI mostraba:
Users
├── POST   /api/users          ❌ (error 409)
├── GET    /api/users          ❌ (array vacío)
├── GET    /api/users/current  ✅ (funciona)
├── GET    /api/users/cart     ✅ (funciona)
├── GET    /api/users/{id}     ❌ (error 404)
├── PATCH  /api/users/{id}     ❌ (error 404)
└── DELETE /api/users/{id}     ❌ (error 404)

7 endpoints, 5 no funcionaban (71% inútil)
```

#### Después:
```
Swagger UI muestra:
👤 usuarios - Datos de usuario y carrito (solo lectura desde JSON)
├── GET /api/users/current  ✅ Obtener usuario actual
└── GET /api/users/cart     ✅ Obtener carrito con IVA

2 endpoints, 2 funcionales (100% útil)
```

### 📊 Métricas de Limpieza

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Endpoints Users | 7 | 2 | -71% |
| Endpoints funcionales | 29% | 100% | +71% |
| Archivos innecesarios | 3 | 0 | -100% |
| Líneas de código | ~200 | 0 | -100% |
| Claridad del API | Confusa | Clara | ⬆️ |

### 🎯 Beneficios

1. ✅ **API más clara**: Solo endpoints que realmente funcionan
2. ✅ **Menos confusión**: Desarrolladores no intentan usar endpoints rotos
3. ✅ **Swagger limpio**: Documentación precisa y útil
4. ✅ **Código mantenible**: Sin archivos/servicios innecesarios
5. ✅ **Foco correcto**: Sistema centrado en PAGOS, no en gestión de usuarios

## [1.1.0] - 2025-11-03

### 🔧 Arreglado (Fixed)

#### Seguridad
- **Fix crítico**: Corrección de falsos positivos en detección de actividad sospechosa
  - Ahora considera la moneda al evaluar montos inusuales
  - Umbrales por moneda: USD >$10,000 | CLP >$10,000,000 | EUR >€9,000
  - Elimina errores `SUSPICIOUS_ACTIVITY` en pagos normales de CLP

#### Persistencia de Datos
- **Fix**: Campos `nombre_titular` y `ultimos_cuatro_digitos` ahora se guardan correctamente
  - Controller sanitiza `cardSecurity` antes de enviar al servicio
  - Crea objeto `cardSecurityWithoutCvv` con solo `last4Digits` y `cardHolderName`
  - CVV intencionalmente excluido de persistencia (PCI-DSS compliant)

#### Transiciones de Estado
- **Fix**: Flujo de estados de pago corregido
  - Antes: PENDING → FAILED (error de transición inválida)
  - Ahora: PENDING → PROCESSING → FAILED (flujo correcto)
  - Aplica tanto para errores simulados como reales

#### Base de Datos
- **Fix**: Campo `fecha` en tabla `historial_de_errores`
  - Ahora se establece automáticamente con `new Date()` en el método `registrarError`
  - Elimina error MySQL: "Field 'fecha' doesn't have a default value"

### ✨ Agregado (Added)

#### Testing
- **Simulación de errores** para desarrollo y QA
  - Usar `amount=666` en request para forzar error simulado
  - Genera entrada en `historial_de_errores` con metadata completa
  - Logs de seguridad: PAYMENT_ATTEMPT → PAYMENT_FAILURE
  - Ideal para probar manejo de errores sin llamadas reales a proveedores

#### Validación
- **CVV mejorado** en `process-payment.dto.ts`
  - Validación backend: solo números, 3-4 dígitos
  - Decoradores `@IsNumberString`, `@Length(3, 4)`
  - Mensajes de error claros

### 📝 Documentación

#### README.md
- **Actualizado**: Sección de características principales
  - HU1 (Interfaz y Métodos de Pago): 85% completado
  - HU2 (Seguridad PCI-DSS): 95% completado
  - Detalle de todas las mejoras recientes

- **Agregado**: Sección de testing con simulación de errores
  - Instrucciones para usar `amount=666`
  - Comportamiento esperado del sistema
  - Verificación de logs y base de datos

- **Mejorado**: Criterios de aceptación documentados
  - CA2: Detalles de qué se guarda y qué no (PCI-DSS)
  - CA3: Validación CVV frontend y backend
  - CA5: Eventos de auditoría y detección de actividad sospechosa

#### Swagger/OpenAPI
- **Mejorado**: Descripción principal de la API
  - Porcentajes de completitud de Historias de Usuario
  - Instrucciones de testing con amount=666
  - Umbrales de actividad sospechosa por moneda
  - Flujo de pago documentado (2 pasos)

- **Agregado**: Tags con emojis descriptivos
  - 💳 pagos, 🔐 seguridad, 🖥️ interfaz-pago
  - 💰 reembolsos, ❌ cancelaciones, 📊 consultas, 🪝 webhooks

## [1.0.0] - 2025-10-30

### ✨ Lanzamiento Inicial

#### Sistema de Pagos
- Implementación completa de procesamiento de pagos multi-proveedor
- Soporte para Stripe, PayPal y Webpay (modo MOCK para desarrollo)
- Arquitectura DDD (Domain-Driven Design)
- Patrón Factory para extensibilidad de proveedores
- Flujo de confirmación en 2 pasos con tokens (validez 5 minutos)

#### Seguridad PCI-DSS
- Cifrado TLS 1.2+ obligatorio con certificados SSL incluidos
- Zero almacenamiento de CVV y PAN (Primary Account Number)
- Verificación CVV obligatoria en todas las transacciones
- Rate limiting: máximo 3 intentos fallidos por sesión
- Logging completo de auditoría de seguridad
- Headers HTTP de seguridad con Helmet
- Enmascaramiento automático de datos sensibles en logs

#### API y Documentación
- Swagger/OpenAPI 3.0 interactivo en `/api/docs`
- Descarga de especificación en JSON y YAML
- Ejemplos completos para cada proveedor
- Autenticación JWT (Bearer token)
- Headers de seguridad: x-session-id, x-user-id
- CORS configurado para frontend React

#### Testing
- Suite completa de tests E2E: 14/14 passing (100%)
- Tests de seguridad para todos los criterios de aceptación
- Tests de flujo completo de pago
- Tests de rate limiting y validación CVV
- Configuración Jest para E2E

---

## Tipos de Cambios

- **✨ Agregado (Added)**: Para nuevas funcionalidades
- **🔧 Arreglado (Fixed)**: Para corrección de bugs
- **🔄 Cambiado (Changed)**: Para cambios en funcionalidad existente
- **🗑️ Deprecado (Deprecated)**: Para funcionalidades que serán removidas
- **🚫 Removido (Removed)**: Para funcionalidades removidas
- **🔒 Seguridad (Security)**: Para cambios relacionados con vulnerabilidades
- **📝 Documentación (Documentation)**: Para cambios solo en documentación
- **🧹 Limpieza (Cleanup)**: Para limpieza de código y eliminación de archivos innecesarios
