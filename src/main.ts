import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import helmet from 'helmet';

async function bootstrap() {
  // Configuración de HTTPS con TLS 1.2+ (CA1)
  const httpsOptions = {
    key: fs.readFileSync('./secrets/pulgashopkey.pem'),
    cert: fs.readFileSync('./secrets/pulgashopcert.pem'),
    // Configuración TLS 1.2 o superior - PCI-DSS compliant
    minVersion: 'TLSv1.2' as const,
    maxVersion: 'TLSv1.3' as const,
    // Cifrados seguros recomendados para PCI-DSS
    ciphers: [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-SHA256',
      'ECDHE-RSA-AES256-SHA384',
    ].join(':'),
    honorCipherOrder: true,
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  
  // Helmet: Headers de seguridad HTTP (CA1, CA6)
  app.use(
    helmet({
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      frameguard: {
        action: 'deny',
      },
    }),
  );
  
  // Configurar prefijo global para todas las rutas
  app.setGlobalPrefix('api');
  
  // CORS configurado de forma segura
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'https://localhost:3001'];
  console.log('🌐 CORS Allowed Origins:', allowedOrigins);
  
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-User-ID'],
    credentials: true,
    maxAge: 3600,
  });
  
  // Configuracion de Swagger
  const config = new DocumentBuilder()
    .setTitle('Payment API - PCI-DSS Compliant')
    .setDescription('API REST para gestión de pagos segura con múltiples proveedores (Stripe, Webpay, PayPal)\n\n' +
      '🎯 HISTORIAS DE USUARIO IMPLEMENTADAS:\n' +
      '✅ HU1: Interfaz y Métodos de Pago (85% completado)\n' +
      '✅ HU2: Seguridad PCI-DSS (95% completado)\n\n' +
      '⚠️ IMPORTANTE - Seguridad:\n' +
      '- ✅ TLS 1.2+ obligatorio con certificados SSL/TLS\n' +
      '- ✅ CVV NUNCA se almacena (solo procesado en memoria)\n' +
      '- ✅ Solo se guardan: last4Digits, cardHolderName (sanitizado)\n' +
      '- ✅ CVV requerido (3-4 dígitos, solo números)\n' +
      '- ✅ Máximo 3 intentos fallidos por sesión (bloqueo 1 hora)\n' +
      '- ✅ Auditoría completa con enmascaramiento de datos\n' +
      '- ✅ Detección de actividad sospechosa por moneda:\n' +
      '     • USD: >$10,000 | CLP: >$10,000,000 | EUR: >€9,000\n' +
      '- ✅ Simulación de errores: usar amount=666 para testing\n\n' +
      '🔑 Headers Requeridos:\n' +
      '- x-session-id: ID único de la sesión de pago (obligatorio)\n' +
      '- x-user-id: ID del usuario o "anonymous" para invitados (obligatorio)\n\n' +
      '📝 Flujo de Pago (2 pasos):\n' +
      '1. POST /api/pagos/confirm-amount → Genera token de confirmación (válido 5 min)\n' +
      '2. POST /api/pagos → Procesa pago con token + CVV\n\n' +
      '🧪 Testing:\n' +
      '- Use amount=666 para simular errores de pago\n' +
      '- Después de 3 intentos fallidos, recibirá 429 Too Many Requests\n\n' +
      '📥 Descargar Documentación:\n' +
      '- JSON: https://localhost:3000/api/docs-json\n' +
      '- YAML: https://localhost:3000/api/docs-yaml')
    .setVersion('1.0.0')
    .addTag('pagos', '💳 Endpoints principales para procesamiento de pagos')
    .addTag('seguridad', '🔐 Confirmación de montos y validación de tokens')
    .addTag('interfaz-pago', '🖥️ Endpoints para la interfaz de usuario (métodos, validaciones, sesiones)')
    .addTag('reembolsos', '💰 Gestión de reembolsos y devoluciones')
    .addTag('cancelaciones', '❌ Cancelación de pagos pendientes')
    .addTag('consultas', '📊 Consulta de estado de pagos y transacciones')
    .addTag('webhooks', '🪝 Notificaciones de proveedores externos (Stripe, PayPal, Webpay)')
    .addTag('usuarios', '👤 Datos de usuario y carrito (solo lectura desde JSON de momento)')
    .addServer('https://localhost:3000', 'Servidor de desarrollo (HTTPS)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingrese el token JWT de autenticación (opcional en desarrollo, obligatorio en producción)',
      },
      'JWT',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-session-id',
        in: 'header',
        description: 'ID único de la sesión de pago (requerido para auditoría y rate limiting)',
      },
      'SessionID',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-user-id',
        in: 'header',
        description: 'ID del usuario o "anonymous" para invitados (requerido para auditoría)',
      },
      'UserID',
    )
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  
  // Endpoint para descargar Swagger en formato JSON
  app.use('/api/docs-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="swagger.json"');
    res.send(document);
  });
  
  // Endpoint para descargar Swagger en formato YAML
  app.use('/api/docs-yaml', (req, res) => {
    const yaml = require('js-yaml');
    const yamlDocument = yaml.dump(document);
    res.setHeader('Content-Type', 'application/x-yaml');
    res.setHeader('Content-Disposition', 'attachment; filename="swagger.yaml"');
    res.send(yamlDocument);
  });
  
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle : 'Payment API Documentation',
    customfavIcon   : '/favicon.ico',
    customCss       : '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true, // Mantener token JWT entre recargas
    },
  });
  
  // Configurar validaciones globales con seguridad mejorada
  app.useGlobalPipes(new ValidationPipe({
    transform             : true,
    transformOptions      : {
      enableImplicitConversion: true, // Permite conversiones implícitas
    },
    whitelist             : true,  // Remover propiedades no definidas en DTO
    forbidNonWhitelisted  : false,  // Permitir propiedades extra temporalmente para debug
    disableErrorMessages  : false, // Mostrar mensajes de error para debugging
    forbidUnknownValues   : false,  // Permitir valores desconocidos temporalmente
  }));
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`\n🔒 Payment API running securely on: https://localhost:${port}/api`);
  console.log(`📚 Swagger Documentation: https://localhost:${port}/api/docs`);
  console.log(`� Download Swagger JSON: https://localhost:${port}/api/docs-json`);
  console.log(`📥 Download Swagger YAML: https://localhost:${port}/api/docs-yaml`);
  console.log(`�🛡️  Security: TLS 1.2+, PCI-DSS Basic Compliance`);
  console.log(`⚠️  Environment: ${process.env.NODE_ENV || 'development'}\n`);
}
bootstrap();
