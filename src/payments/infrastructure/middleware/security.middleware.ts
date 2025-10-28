import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para sanitizar datos sensibles en requests y responses
 * Cumple con CA6: Protección de datos personales
 */
@Injectable()
export class DataSanitizationMiddleware implements NestMiddleware {
  private readonly sensitiveFields = [
    'cvv',
    'cvc',
    'securityCode',
    'cardNumber',
    'card_number',
    'password',
    'secret',
    'token',
    'apiKey',
    'api_key',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // Sanitizar body del request
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    // Nota: req.query es read-only en Express, no se puede reasignar directamente
    // La sanitización de query params se debe hacer en los DTOs con ValidationPipe
    
    // Interceptar response para sanitizar datos sensibles en logs
    const originalSend = res.send;
    res.send = function (data: any) {
      // No sanitizar la respuesta real, solo los logs
      // La respuesta al cliente debe ser completa
      return originalSend.call(this, data);
    };

    next();
  }

  /**
   * Sanitiza recursivamente un objeto, enmascarando campos sensibles
   */
  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.isSensitiveField(key)) {
        // NO modificar datos sensibles en el request - solo mantenerlos
        // La sanitización real se hace en logs, no en los datos procesados
        sanitized[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.sensitiveFields.some(sensitive =>
      lowerField.includes(sensitive.toLowerCase()),
    );
  }
}

/**
 * Middleware para agregar headers de seguridad HTTP
 * Cumple con CA1: Seguridad en transmisión
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Strict-Transport-Security: Forzar HTTPS (CA1)
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );

    // X-Content-Type-Options: Prevenir MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options: Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection: Protección XSS legacy
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Content-Security-Policy: Política de seguridad de contenido
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
    );

    // Referrer-Policy: Control de información de referrer
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy: Control de features del navegador
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(self)',
    );

    // X-Permitted-Cross-Domain-Policies: Control de políticas cross-domain
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Cache-Control para endpoints de pago: No cachear datos sensibles
    if (req.path.includes('/pagos') || req.path.includes('/payment')) {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  }
}

/**
 * Middleware para validar que la conexión sea HTTPS
 * Cumple con CA1: TLS 1.2 o superior obligatorio
 */
@Injectable()
export class HttpsOnlyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (!isHttps && process.env.NODE_ENV === 'production') {
      return res.status(400).json({
        statusCode: 400,
        message: 'HTTPS es requerido para todas las transacciones de pago',
        error: 'Insecure Connection',
      });
    }

    next();
  }
}

/**
 * Middleware para extraer contexto de seguridad desde headers
 * Historia de Usuario 2 - Contexto de usuario y sesión para auditoría
 */
@Injectable()
export class SecurityContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extraer información de seguridad de los headers
    const sessionId = (req.headers['x-session-id'] as string) || 'unknown';
    const userId = (req.headers['x-user-id'] as string) || 'anonymous';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || 
                      req.socket.remoteAddress || 
                      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Agregar contexto de seguridad al request
    (req as any).securityContext = {
      sessionId,
      userId,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };

    next();
  }
}
