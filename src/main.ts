import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Configuracion de HTTPS
  const fs = require('fs');
  const httpsOptions = {    
    key: fs.readFileSync('./secrets/pulgashopkey.pem'),
    cert: fs.readFileSync('./secrets/pulgashopcert.pem')
  };

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  
  // Configurar prefijo global para todas las rutas
  app.setGlobalPrefix('api');
  
  // Configuracion de Swagger
  const config = new DocumentBuilder()
    .setTitle('Payment API')
    .setDescription('API REST para gestión de pagos con múltiples proveedores (Stripe, Webpay, PayPal, etc...)')
    .setVersion('1.0.0')
    .addTag('pagos', 'Endpoints para gestión de pagos')
    .addTag('reembolsos', 'Endpoints para gestión de reembolsos')
    .addTag('webhooks', 'Endpoints para webhooks de proveedores')
    .addServer('https://localhost:3000', 'Servidor de desarrollo')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle : 'Payment API Documentation',
    customfavIcon   : '/favicon.ico',
    customCss       : '.swagger-ui .topbar { display: none }',
  });
  
  // Configurar validaciones globales
  app.useGlobalPipes(new ValidationPipe({
    transform             : true,
    whitelist             : true,
    forbidNonWhitelisted  : true,
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
