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
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-User-ID'],
    credentials: true,
    maxAge: 3600,
  });
  
  // Configuracion de Swagger
  const config = new DocumentBuilder()
    .setTitle('Payment API - PCI-DSS Compliant')
    .setDescription('API REST para gestión de pagos segura con múltiples proveedores (Stripe, Webpay, PayPal, etc...)\n\n' +
      '⚠️ IMPORTANTE - Seguridad:\n' +
      '- Todas las conexiones DEBEN usar HTTPS/TLS 1.2+\n' +
      '- Los datos de tarjeta NUNCA se almacenan\n' +
      '- CVV requerido para todas las transacciones\n' +
      '- Máximo 3 intentos fallidos por sesión\n' +
      '- Todos los eventos son auditados y registrados\n' +
      '- Cumplimiento PCI-DSS nivel básico')
    .setVersion('1.0.0')
    .addTag('pagos', 'Endpoints para gestión de pagos')
    .addTag('seguridad', 'Endpoints de confirmación y seguridad')
    .addTag('reembolsos', 'Endpoints para gestión de reembolsos')
    .addTag('webhooks', 'Endpoints para webhooks de proveedores')
    .addServer('https://localhost:3000', 'Servidor de desarrollo (HTTPS)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingrese el token JWT de autenticación',
      },
      'JWT',
    )
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle : 'Payment API Documentation',
    customfavIcon   : '/favicon.ico',
    customCss       : '.swagger-ui .topbar { display: none }',
  });
  
  // Configurar validaciones globales con seguridad mejorada
  app.useGlobalPipes(new ValidationPipe({
    transform             : true,
    whitelist             : true,  // Remover propiedades no definidas en DTO
    forbidNonWhitelisted  : true,  // Rechazar requests con propiedades extra (CA6)
    disableErrorMessages  : process.env.NODE_ENV === 'production', // No exponer detalles en prod
    forbidUnknownValues   : true,  // Rechazar valores desconocidos
  }));
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`\n🔒 Payment API running securely on: https://localhost:${port}/api`);
  console.log(`📚 Swagger Documentation: https://localhost:${port}/api/docs`);
  console.log(`🛡️  Security: TLS 1.2+, PCI-DSS Basic Compliance`);
  console.log(`⚠️  Environment: ${process.env.NODE_ENV || 'development'}\n`);
}
bootstrap();
