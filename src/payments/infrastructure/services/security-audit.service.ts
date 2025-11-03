import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

export enum SecurityEventType {
  PAYMENT_ATTEMPT = 'PAYMENT_ATTEMPT',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILURE = 'PAYMENT_FAILURE',
  CVV_VALIDATION_FAILED = 'CVV_VALIDATION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
  AMOUNT_CONFIRMATION = 'AMOUNT_CONFIRMATION',
}

export interface SecurityLogData {
  eventType: SecurityEventType;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  paymentId?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class SecurityAuditService {
  private readonly logger: winston.Logger;
  private readonly suspiciousActivityThreshold = 3;

  // En memoria para demo - en producción usar Redis o similar
  private failedAttempts: Map<string, { count: number; firstAttempt: Date }> = new Map();

  constructor(private readonly configService: ConfigService) {
    // Configurar Winston con formato específico para seguridad
    this.logger = winston.createLogger({
      level: this.configService.get('NODE_ENV') === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...metadata }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...metadata,
          });
        }),
      ),
      defaultMeta: { service: 'payment-security' },
      transports: [
        // Log de seguridad en archivo separado
        new winston.transports.File({
          filename: 'logs/security-error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/security-audit.log',
          maxsize: 5242880,
          maxFiles: 10,
        }),
        // Console para desarrollo
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  /**
   * Registra un evento de seguridad
   */
  logSecurityEvent(data: SecurityLogData): void {
    const logEntry = {
      ...data,
      environment: this.configService.get('NODE_ENV'),
      // Enmascarar datos sensibles
      maskedData: this.maskSensitiveData(data),
    };

    const level = this.getLogLevel(data.eventType);
    
    this.logger.log(level, 'Security Event', logEntry);

    // Verificar si es actividad sospechosa
    if (this.isSuspiciousActivity(data)) {
      this.handleSuspiciousActivity(data);
    }
  }

  /**
   * Registra un intento de pago
   */
  logPaymentAttempt(
    userId: string,
    sessionId: string,
    ipAddress: string,
    amount: number,
    provider: string,
  ): void {
    this.logSecurityEvent({
      eventType: SecurityEventType.PAYMENT_ATTEMPT,
      userId,
      sessionId,
      ipAddress,
      amount,
      provider,
      timestamp: new Date(),
    });
  }

  /**
   * Registra un pago exitoso
   */
  logPaymentSuccess(
    userId: string,
    sessionId: string,
    paymentId: string,
    amount: number,
    provider: string,
  ): void {
    // Limpiar intentos fallidos al tener éxito
    this.clearFailedAttempts(sessionId);

    this.logSecurityEvent({
      eventType: SecurityEventType.PAYMENT_SUCCESS,
      userId,
      sessionId,
      paymentId,
      amount,
      provider,
      timestamp: new Date(),
    });
  }

  /**
   * Registra un pago fallido
   */
  logPaymentFailure(
    userId: string,
    sessionId: string,
    ipAddress: string,
    amount: number,
    provider: string,
    errorCode: string,
    errorMessage: string,
  ): void {
    // Incrementar contador de intentos fallidos
    this.incrementFailedAttempts(sessionId);

    this.logSecurityEvent({
      eventType: SecurityEventType.PAYMENT_FAILURE,
      userId,
      sessionId,
      ipAddress,
      amount,
      provider,
      errorCode,
      errorMessage,
      timestamp: new Date(),
    });
  }

  /**
   * Registra validación CVV fallida (CA3)
   */
  logCvvValidationFailed(
    userId: string,
    sessionId: string,
    ipAddress: string,
  ): void {
    this.incrementFailedAttempts(sessionId);

    this.logSecurityEvent({
      eventType: SecurityEventType.CVV_VALIDATION_FAILED,
      userId,
      sessionId,
      ipAddress,
      timestamp: new Date(),
    });
  }

  /**
   * Registra exceso de límite de intentos (CA4)
   */
  logRateLimitExceeded(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
  ): void {
    this.logSecurityEvent({
      eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
      userId,
      sessionId,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }

  /**
   * Verifica si se alcanzó el límite de intentos fallidos (CA4)
   */
  hasExceededFailedAttempts(sessionId: string): boolean {
    const attempts = this.failedAttempts.get(sessionId);
    return attempts ? attempts.count >= this.suspiciousActivityThreshold : false;
  }

  /**
   * Obtiene el número de intentos fallidos
   */
  getFailedAttemptsCount(sessionId: string): number {
    const attempts = this.failedAttempts.get(sessionId);
    return attempts ? attempts.count : 0;
  }

  /**
   * Limpia los intentos fallidos después de un tiempo o éxito
   */
  clearFailedAttempts(sessionId: string): void {
    this.failedAttempts.delete(sessionId);
  }

  /**
   * Registra confirmación de monto
   */
  logAmountConfirmation(
    userId: string,
    sessionId: string,
    amount: number,
    currency: string,
  ): void {
    this.logSecurityEvent({
      eventType: SecurityEventType.AMOUNT_CONFIRMATION,
      userId,
      sessionId,
      amount,
      currency,
      timestamp: new Date(),
    });
  }

  // ===== MÉTODOS PRIVADOS =====

  private incrementFailedAttempts(sessionId: string): void {
    const current = this.failedAttempts.get(sessionId);
    if (current) {
      current.count++;
    } else {
      this.failedAttempts.set(sessionId, {
        count: 1,
        firstAttempt: new Date(),
      });
    }

    // Limpiar intentos antiguos (más de 1 hora)
    this.cleanupOldAttempts();
  }

  private cleanupOldAttempts(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [sessionId, data] of this.failedAttempts.entries()) {
      if (data.firstAttempt < oneHourAgo) {
        this.failedAttempts.delete(sessionId);
      }
    }
  }

  private getLogLevel(eventType: SecurityEventType): string {
    switch (eventType) {
      case SecurityEventType.PAYMENT_SUCCESS:
      case SecurityEventType.AMOUNT_CONFIRMATION:
        return 'info';
      case SecurityEventType.PAYMENT_FAILURE:
      case SecurityEventType.CVV_VALIDATION_FAILED:
        return 'warn';
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
      case SecurityEventType.UNAUTHORIZED_ACCESS:
      case SecurityEventType.DATA_BREACH_ATTEMPT:
        return 'error';
      default:
        return 'info';
    }
  }

  private isSuspiciousActivity(data: SecurityLogData): boolean {
    // Múltiples intentos fallidos
    if (data.sessionId && this.hasExceededFailedAttempts(data.sessionId)) {
      return true;
    }

    // Montos inusuales según la moneda
    if (data.amount && data.currency) {
      const suspiciousThresholds = {
        'USD': 10000,    // $10,000 USD
        'CLP': 10000000, // $10,000,000 CLP (~$10,500 USD)
        'EUR': 9000,     // €9,000 EUR (~$10,000 USD)
      };
      
      const threshold = suspiciousThresholds[data.currency] || suspiciousThresholds['USD'];
      if (data.amount > threshold) {
        return true;
      }
    }

    // Eventos críticos
    const criticalEvents = [
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventType.UNAUTHORIZED_ACCESS,
      SecurityEventType.DATA_BREACH_ATTEMPT,
    ];
    return criticalEvents.includes(data.eventType);
  }

  private handleSuspiciousActivity(data: SecurityLogData): void {
    // Evitar recursión infinita: no registrar actividad sospechosa si ya es un evento de actividad sospechosa
    if (data.eventType === SecurityEventType.SUSPICIOUS_ACTIVITY) {
      return;
    }
    
    this.logSecurityEvent({
      eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
      userId: data.userId,
      sessionId: data.sessionId,
      ipAddress: data.ipAddress,
      metadata: {
        originalEvent: data.eventType,
        reason: 'Actividad sospechosa detectada',
        failedAttempts: data.sessionId ? this.getFailedAttemptsCount(data.sessionId) : 0,
      },
      timestamp: new Date(),
    });

    // En producción: enviar alerta a equipo de seguridad, bloquear temporalmente, etc.
  }

  /**
   * Enmascara datos sensibles para logs (CA6)
   */
  private maskSensitiveData(data: SecurityLogData): Record<string, any> {
    const masked: Record<string, any> = {};

    // Enmascarar userId (mostrar solo últimos 4 caracteres)
    if (data.userId) {
      masked.userId = this.maskString(data.userId);
    }

    // Enmascarar IP (mostrar solo primeros 2 octetos)
    if (data.ipAddress) {
      masked.ipAddress = this.maskIpAddress(data.ipAddress);
    }

    // Enmascarar metadata sensible
    if (data.metadata) {
      masked.metadata = this.maskMetadata(data.metadata);
    }

    return masked;
  }

  private maskString(str: string): string {
    if (str.length <= 4) return '****';
    return '***' + str.slice(-4);
  }

  private maskIpAddress(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***. ***`;
    }
    return '***';
  }

  private maskMetadata(metadata: Record<string, any>): Record<string, any> {
    const masked: Record<string, any> = {};
    const sensitiveKeys = ['cvv', 'password', 'token', 'card', 'cardNumber', 'securityCode'];

    for (const [key, value] of Object.entries(metadata)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        masked[key] = '***MASKED***';
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }
}
