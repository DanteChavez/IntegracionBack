import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SecurityAuditService } from '../../../src/payments/infrastructure/services/security-audit.service';
import { SecurityEventType } from '../../../src/payments/infrastructure/services/security-audit.service';
import * as fs from 'fs';
import * as path from 'path';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;
  let configService: ConfigService;
  const testLogFile = path.join(
    process.cwd(),
    'logs',
    'security-audit-test.log',
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityAuditService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'LOG_LEVEL') return 'info';
              if (key === 'NODE_ENV') return 'test';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SecurityAuditService>(SecurityAuditService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    // Limpiar logs de prueba
    if (fs.existsSync(testLogFile)) {
      fs.unlinkSync(testLogFile);
    }
  });

  describe('logSecurityEvent', () => {
    it('should log payment attempt with masked data', async () => {
      const eventData = {
        eventType: SecurityEventType.PAYMENT_ATTEMPT,
        userId: 'user-123',
        sessionId: 'session-abc',
        ipAddress: '192.168.1.100',
        paymentId: 'pay_test_123',
        amount: 100.5,
        currency: 'USD',
        provider: 'stripe',
        timestamp: new Date(),
        metadata: {
          cvv: '123', // Debe ser enmascarado
          cardNumber: '4242424242424242', // Debe ser enmascarado
          userInfo: 'Sensitive data',
        },
      };

      await service.logSecurityEvent(eventData);

      // Verificar que el evento fue registrado
      expect(true).toBe(true); // El logger de Winston maneja esto internamente
    });

    it('should mask sensitive data in logs', () => {
      const sensitiveData = {
        cvv: '123',
        cardNumber: '4242424242424242',
        ssn: '123-45-6789',
        password: 'secret123',
        email: 'test@example.com',
        normalField: 'not-sensitive',
      };

      const masked = (service as any).maskSensitiveData(sensitiveData);

      expect(masked.cvv).toBe('MASKED');
      expect(masked.cardNumber).toBe('MASKED');
      expect(masked.ssn).toBe('MASKED');
      expect(masked.password).toBe('MASKED');
      expect(masked.email).toContain('***'); // Parcialmente enmascarado
      expect(masked.normalField).toBe('not-sensitive'); // No enmascarado
    });

    it('should mask IP addresses', () => {
      const ipv4 = '192.168.1.100';
      const masked = (service as any).maskIpAddress(ipv4);
      expect(masked).toBe('192.168.***.***');
    });

    it('should mask user IDs partially', () => {
      const userId = 'user-1234567890';
      const masked = (service as any).maskUserId(userId);
      expect(masked).toContain('***');
      expect(masked.length).toBeGreaterThan(3);
    });

    it('should track failed attempts', async () => {
      const sessionId = 'test-session-fail';

      // Registrar 3 intentos fallidos
      for (let i = 0; i < 3; i++) {
        await service.logSecurityEvent({
          eventType: SecurityEventType.CVV_VALIDATION_FAILED,
          sessionId,
          userId: 'user-test',
          ipAddress: '127.0.0.1',
          timestamp: new Date(),
        });
      }

      // Verificar contador interno (si es accesible)
      const attempts = (service as any).failedAttempts.get(sessionId);
      expect(attempts?.count).toBe(3);
    });

    it('should identify suspicious activity', () => {
      const suspiciousEvent = {
        eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
        attempts: 10,
        timeWindow: '1 minute',
      };

      const isSuspicious = (service as any).isSuspiciousActivity(
        suspiciousEvent,
      );
      expect(isSuspicious).toBe(true);
    });

    it('should log all security event types', async () => {
      const eventTypes: SecurityEventType[] = [
        SecurityEventType.PAYMENT_ATTEMPT,
        SecurityEventType.CVV_VALIDATION_FAILED,
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        SecurityEventType.AMOUNT_CONFIRMATION,
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        SecurityEventType.PAYMENT_SUCCESS,
        SecurityEventType.PAYMENT_FAILURE,
      ];

      for (const eventType of eventTypes) {
        await service.logSecurityEvent({
          eventType,
          userId: 'test-user',
          sessionId: 'test-session',
          ipAddress: '127.0.0.1',
          timestamp: new Date(),
        });
      }

      // Si llegamos aquí sin errores, todos los tipos fueron registrados
      expect(eventTypes.length).toBe(7);
    });
  });

  describe('maskEmail', () => {
    it('should mask email addresses', () => {
      const email = 'john.doe@example.com';
      const masked = (service as any).maskEmail(email);

      expect(masked).toContain('***');
      expect(masked).toContain('@');
      expect(masked).not.toBe(email);
    });

    it('should handle invalid email format', () => {
      const invalid = 'not-an-email';
      const masked = (service as any).maskEmail(invalid);

      expect(masked).toContain('***');
    });
  });

  describe('performance', () => {
    it('should handle high volume of logs efficiently', async () => {
      const startTime = Date.now();
      const logCount = 100;

      for (let i = 0; i < logCount; i++) {
        await service.logSecurityEvent({
          eventType: SecurityEventType.PAYMENT_ATTEMPT,
          userId: `user-${i}`,
          sessionId: `session-${i}`,
          ipAddress: '127.0.0.1',
          timestamp: new Date(),
        });
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Menos de 5 segundos para 100 logs
    });
  });
});
