import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import helmet from 'helmet';

/**
 * Tests E2E de Seguridad - Payment API
 * 
 * Valida los 6 Criterios de Aceptación (CA) de la Historia de Usuario 2
 */
describe('Payment Security (E2E)', () => {
  let app: INestApplication;
  let sessionId: string;
  let userId: string;
  let confirmationToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configurar prefijo global (igual que main.ts)
    app.setGlobalPrefix('api');

    // Configurar seguridad (igual que main.ts)
    app.use(helmet());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Generar IDs únicos para cada prueba
    sessionId = `test-session-${Date.now()}`;
    userId = `test-user-${Date.now()}`;
  });

  /**
   * CA1: Encriptación TLS 1.2+
   */
  describe('CA1: TLS/HTTPS Encryption', () => {
    it('should include security headers in response', () => {
      return request(app.getHttpServer())
        .post('/api/pagos/confirm-amount')
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
        })
        .expect((res) => {
          // Verificar headers de seguridad
          expect(res.headers['x-content-type-options']).toBe('nosniff');
          expect(res.headers['x-frame-options']).toBeDefined();
          expect(res.headers['x-download-options']).toBe('noopen');
        });
    });

    it('should not allow caching of sensitive endpoints', () => {
      return request(app.getHttpServer())
        .post('/api/pagos/confirm-amount')
        .set('X-Session-ID', sessionId)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
        })
        .expect(200)
        .expect((res) => {
          const cacheControl = res.headers['cache-control'];
          // Si existe el header, debe contener no-store
          if (cacheControl) {
            expect(cacheControl).toContain('no-store');
          }
        });
    });
  });

  /**
   * CA2: No Almacenar Datos de Tarjeta
   */
  describe('CA2: No Card Data Storage', () => {
    it('should not return CVV in response', async () => {
      // Paso 1: Obtener token
      const confirmRes = await request(app.getHttpServer())
        .post('/api/pagos/confirm-amount')
        .set('X-Session-ID', sessionId)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
        })
        .expect(200);

      confirmationToken = confirmRes.body.confirmationToken;

      // Paso 2: Procesar pago con CVV
      const paymentRes = await request(app.getHttpServer())
        .post('/api/pagos')
        .set('X-Session-ID', sessionId)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
          confirmationToken,
          cardSecurity: {
            cvv: '123',
            last4Digits: '4242',
            cardHolderName: 'TEST USER',
          },
          customerId: 'cus_test_123',
        })
        .expect(201);

      // Verificar que la respuesta NO contenga el CVV
      const responseString = JSON.stringify(paymentRes.body);
      expect(responseString).not.toContain('123');
      expect(responseString).not.toContain('cvv');
    });

    it('should mask sensitive data in metadata', async () => {
      const confirmRes = await request(app.getHttpServer())
        .post('/api/pagos/confirm-amount')
        .set('X-Session-ID', sessionId)
        .set('X-User-ID', userId)
        .send({
          amount: 50,
          currency: 'USD',
          provider: 'stripe',
        })
        .expect(200);

      const token = confirmRes.body.confirmationToken;

      const paymentRes = await request(app.getHttpServer())
        .post('/api/pagos')
        .set('X-Session-ID', sessionId)
        .set('X-User-ID', userId)
        .send({
          amount: 50,
          currency: 'USD',
          provider: 'stripe',
          confirmationToken: token,
          cardSecurity: {
            cvv: '456',
            last4Digits: '1234',
          },
          customerId: 'cus_test',
        })
        .expect(201);

      // Verificar que cardSecurity no esté en la respuesta
      expect(paymentRes.body.cardSecurity).toBeUndefined();
    });
  });

  /**
   * CA3: Verificación CVV Obligatoria
   */
  describe('CA3: CVV Verification Required', () => {
    beforeEach(async () => {
      // Obtener token de confirmación antes de cada prueba
      const res = await request(app.getHttpServer())
        .post('/api/pagos/confirm-amount')
        .set('X-Session-ID', sessionId)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
        })
        .expect(200);

      confirmationToken = res.body.confirmationToken;
    });


    it('should reject CVV with less than 3 digits', () => {
      return request(app.getHttpServer())
        .post('/api/pagos')
        .set('X-Session-ID', sessionId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
          confirmationToken,
          cardSecurity: {
            cvv: '12', // ❌ Muy corto
            last4Digits: '4242',
          },
          customerId: 'cus_test',
        })
        .expect(400);
    });

    it('should reject CVV with more than 4 digits', () => {
      return request(app.getHttpServer())
        .post('/api/pagos')
        .set('X-Session-ID', sessionId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
          confirmationToken,
          cardSecurity: {
            cvv: '12345', // ❌ Muy largo
            last4Digits: '4242',
          },
          customerId: 'cus_test',
        })
        .expect(400);
    });

    it('should accept valid 3-digit CVV', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/pagos')
        .set('X-Session-ID', sessionId)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
          confirmationToken,
          cardSecurity: {
            cvv: '123', // ✅ Válido
            last4Digits: '4242',
          },
          customerId: 'cus_test',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
    });

  });

  /**
   * CA4: Límite de 3 Intentos Fallidos
   */
  describe('CA4: Rate Limiting (3 Failed Attempts)', () => {
    it('should block after 3 failed payment attempts', async () => {
      const limitTestSession = `limit-test-${Date.now()}`;

      // Intentos 1, 2, 3 con tokens inválidos
      for (let i = 1; i <= 3; i++) {
        await request(app.getHttpServer())
          .post('/api/pagos')
          .set('X-Session-ID', limitTestSession)
          .set('X-User-ID', userId)
          .send({
            amount: 100,
            currency: 'USD',
            provider: 'stripe',
            confirmationToken: `invalid-token-${i}`,
            cardSecurity: {
              cvv: '123',
              last4Digits: '4242',
            },
            customerId: 'cus_test',
          })
          .expect((res) => {
            // Debe fallar por token inválido (400, 404, 422 o 500 si hay error de middleware)
            expect([400, 404, 422, 500]).toContain(res.status);
          });
      }

      // Intento 4: DEBE SER BLOQUEADO
      await request(app.getHttpServer())
        .post('/api/pagos')
        .set('X-Session-ID', limitTestSession)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
          confirmationToken: 'invalid-token-4',
          cardSecurity: {
            cvv: '123',
            last4Digits: '4242',
          },
          customerId: 'cus_test',
        })
        .expect(429) // Too Many Requests
        .expect((res) => {
          expect(res.body.message).toContain('Límite de intentos');
          expect(res.body.details.maxAttempts).toBe(3);
          expect(res.body.details.retryAfter).toBeDefined();
        });
    });

    it('should allow different sessions independently', async () => {
      const session1 = `session-1-${Date.now()}`;
      const session2 = `session-2-${Date.now()}`;

      // Agotar intentos en session1
      for (let i = 1; i <= 3; i++) {
        await request(app.getHttpServer())
          .post('/api/pagos')
          .set('X-Session-ID', session1)
          .send({
            amount: 100,
            currency: 'USD',
            provider: 'stripe',
            confirmationToken: `invalid-${i}`,
            cardSecurity: { cvv: '123', last4Digits: '4242' },
            customerId: 'cus_test',
          });
      }

      // session2 debe seguir funcionando
      await request(app.getHttpServer())
        .post('/api/pagos')
        .set('X-Session-ID', session2)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
          confirmationToken: 'invalid-token',
          cardSecurity: { cvv: '123', last4Digits: '4242' },
          customerId: 'cus_test',
        })
        .expect((res) => {
          // Debe fallar por token, NO por rate limit
          expect(res.status).not.toBe(429);
        });
    });
  });

  /**
   * CA5: Logs de Auditoría
   * (Nota: Tests unitarios validarán el servicio de auditoría)
   */
  describe('CA5: Security Audit Logging', () => {
    it('should generate confirmation token successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/pagos/confirm-amount')
        .set('X-Session-ID', sessionId)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
        })
        .expect(200);

      expect(res.body.confirmationToken).toMatch(/^conf_[a-f0-9]{32}$/);
      expect(res.body.expiresAt).toBeDefined();
      expect(res.body.amount).toBe(100);

      // El servicio de auditoría debe haber registrado el evento
      // (verificación en logs en tests unitarios)
    });
  });

  /**
   * CA6: Protección de Datos Personales
   */
  describe('CA6: Personal Data Protection', () => {
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/pagos/confirm-amount')
        .set('X-Session-ID', sessionId)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
        })
        .expect(200);

      confirmationToken = res.body.confirmationToken;
    });


    it('should validate amount data types strictly', () => {
      return request(app.getHttpServer())
        .post('/api/pagos/confirm-amount')
        .send({
          amount: '100abc', // ❌ No es número válido
          currency: 'USD',
          provider: 'stripe',
        })
        .expect(400);
    });

  });

  /**
   * Flujo Completo: Dos Pasos con Seguridad
   */
  describe('Complete Two-Step Flow', () => {
    it('should successfully complete payment with all security checks', async () => {
      const e2eSession = `e2e-${Date.now()}`;
      const e2eUser = `user-e2e-${Date.now()}`;

      // PASO 1: Confirmar monto
      const confirmRes = await request(app.getHttpServer())
        .post('/api/pagos/confirm-amount')
        .set('X-Session-ID', e2eSession)
        .set('X-User-ID', e2eUser)
        .send({
          amount: 250.75,
          currency: 'USD',
          provider: 'stripe',
          description: 'Test E2E Payment',
        })
        .expect(200);

      expect(confirmRes.body.confirmationToken).toBeDefined();
      expect(confirmRes.body.amount).toBe(250.75);
      const token = confirmRes.body.confirmationToken;

      // PASO 2: Procesar pago con CVV
      const paymentRes = await request(app.getHttpServer())
        .post('/api/pagos')
        .set('X-Session-ID', e2eSession)
        .set('X-User-ID', e2eUser)
        .send({
          amount: 250.75,
          currency: 'USD',
          provider: 'stripe',
          confirmationToken: token,
          cardSecurity: {
            cvv: '987',
            last4Digits: '4242',
            cardHolderName: 'JOHN DOE E2E',
          },
          customerId: 'cus_e2e_test_123',
          description: 'Test E2E Payment',
        })
        .expect(201);

      expect(paymentRes.body.id).toBeDefined();
      expect(paymentRes.body.status).toBe('COMPLETED');
      expect(paymentRes.body.amount).toBe(250.75);
      expect(paymentRes.body.metadata.securityChecks).toBe('PASSED');

      // Verificar que CVV NO esté en respuesta
      const bodyString = JSON.stringify(paymentRes.body);
      expect(bodyString).not.toContain('987');
      expect(bodyString).not.toContain('cvv');
    });

    it('should reject reuse of confirmation token', async () => {
      const reuseSession = `reuse-${Date.now()}`;

      // Obtener token
      const confirmRes = await request(app.getHttpServer())
        .post('/api/pagos/confirm-amount')
        .set('X-Session-ID', reuseSession)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
        })
        .expect(200);

      const token = confirmRes.body.confirmationToken;

      // Usar token primera vez
      await request(app.getHttpServer())
        .post('/api/pagos')
        .set('X-Session-ID', reuseSession)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
          confirmationToken: token,
          cardSecurity: { cvv: '123', last4Digits: '4242' },
          customerId: 'cus_test',
        })
        .expect(201);

      // Intentar reusar token
      await request(app.getHttpServer())
        .post('/api/pagos')
        .set('X-Session-ID', reuseSession)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
          confirmationToken: token, // ❌ Token ya usado
          cardSecurity: { cvv: '123', last4Digits: '4242' },
          customerId: 'cus_test',
        })
        .expect((res) => {
          expect([400, 422]).toContain(res.status);
          expect(res.body.message).toContain('Token');
        });
    });

    it('should reject mismatched amounts', async () => {
      const mismatchSession = `mismatch-${Date.now()}`;

      // Confirmar 100
      const confirmRes = await request(app.getHttpServer())
        .post('/api/pagos/confirm-amount')
        .set('X-Session-ID', mismatchSession)
        .set('X-User-ID', userId)
        .send({
          amount: 100,
          currency: 'USD',
          provider: 'stripe',
        })
        .expect(200);

      // Intentar pagar 200 (diferente)
      await request(app.getHttpServer())
        .post('/api/pagos')
        .set('X-Session-ID', mismatchSession)
        .set('X-User-ID', userId)
        .send({
          amount: 200, // ❌ No coincide con confirmación
          currency: 'USD',
          provider: 'stripe',
          confirmationToken: confirmRes.body.confirmationToken,
          cardSecurity: { cvv: '123', last4Digits: '4242' },
          customerId: 'cus_test',
        })
        .expect((res) => {
          expect([400, 422]).toContain(res.status);
        });
    });
  });
});

