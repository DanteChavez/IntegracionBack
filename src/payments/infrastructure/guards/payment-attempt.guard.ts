import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { SecurityAuditService } from '../services/security-audit.service';

/**
 * Guard para limitar intentos de pago fallidos por sesión (CA4)
 * Máximo 3 intentos fallidos por sesión
 */
@Injectable()
export class PaymentAttemptGuard implements CanActivate {
  private readonly MAX_ATTEMPTS = 3;

  constructor(private readonly securityAuditService: SecurityAuditService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = this.extractSessionId(request);
    const userId = this.extractUserId(request);
    const ipAddress = this.extractIpAddress(request);
    const userAgent = request.headers['user-agent'] || 'unknown';

    // Verificar si se excedió el límite de intentos
    const failedAttempts = this.securityAuditService.getFailedAttemptsCount(sessionId);

    if (failedAttempts >= this.MAX_ATTEMPTS) {
      // Log del evento de rate limit excedido
      this.securityAuditService.logRateLimitExceeded(
        userId,
        sessionId,
        ipAddress,
        userAgent,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Límite de intentos de pago excedido. Por favor, intente más tarde.',
          error: 'Too Many Requests',
          details: {
            maxAttempts: this.MAX_ATTEMPTS,
            currentAttempts: failedAttempts,
            retryAfter: '1 hour',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Adjuntar información de sesión a la request para uso posterior
    request.securityContext = {
      sessionId,
      userId,
      ipAddress,
      userAgent,
      failedAttempts,
    };

    return true;
  }

  private extractSessionId(request: any): string {
    // Intentar obtener de diferentes fuentes
    return (
      request.headers['x-session-id'] ||
      request.session?.id ||
      request.cookies?.sessionId ||
      this.generateSessionId(request)
    );
  }

  private extractUserId(request: any): string {
    // Obtener del token JWT o header
    return (
      request.user?.id ||
      request.headers['x-user-id'] ||
      'anonymous'
    );
  }

  private extractIpAddress(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private generateSessionId(request: any): string {
    // Generar un ID de sesión temporal basado en IP + User Agent
    const ip = this.extractIpAddress(request);
    const userAgent = request.headers['user-agent'] || '';
    return `${ip}-${Buffer.from(userAgent).toString('base64').slice(0, 10)}`;
  }
}
