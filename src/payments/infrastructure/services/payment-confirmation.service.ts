import { Injectable, BadRequestException } from '@nestjs/common';
import { SecurityAuditService } from './security-audit.service';
import { 
  ConfirmPaymentAmountDto, 
  PaymentAmountConfirmationResponse 
} from '../../application/dto/confirm-amount.dto';
import * as crypto from 'crypto';

interface ConfirmationCache {
  amount: number;
  currency: string;
  provider: string;
  userId: string;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Servicio para manejar confirmación de montos antes de procesar pagos
 * Cumple con requisito de seguridad de confirmación de monto
 */
@Injectable()
export class PaymentConfirmationService {
  private readonly CONFIRMATION_EXPIRY_MINUTES = 5;
  
  // En producción usar Redis para cache distribuido
  private confirmationCache: Map<string, ConfirmationCache> = new Map();

  constructor(private readonly securityAuditService: SecurityAuditService) {
    // Limpiar confirmaciones expiradas cada minuto
    setInterval(() => this.cleanupExpiredConfirmations(), 60000);
  }

  /**
   * Genera un token de confirmación para el monto
   */
  async generateConfirmation(
    dto: ConfirmPaymentAmountDto,
    userId: string,
    sessionId: string,
  ): Promise<PaymentAmountConfirmationResponse> {
    // Validar monto
    this.validateAmount(dto.amount, dto.currency);

    // Generar token único
    const confirmationToken = this.generateConfirmationToken();

    // Calcular expiración
    const expiresAt = new Date(
      Date.now() + this.CONFIRMATION_EXPIRY_MINUTES * 60 * 1000,
    );

    // Guardar en cache
    this.confirmationCache.set(confirmationToken, {
      amount: dto.amount,
      currency: dto.currency,
      provider: dto.provider,
      userId,
      sessionId,
      createdAt: new Date(),
      expiresAt,
    });

    // Log de auditoría
    this.securityAuditService.logAmountConfirmation(
      userId,
      sessionId,
      dto.amount,
      dto.currency,
    );

    // Formatear monto para display
    const formattedAmount = this.formatAmount(dto.amount, dto.currency);

    // Generar advertencias si aplica
    const warnings = this.generateWarnings(dto.amount, dto.currency);

    return {
      confirmationToken,
      amount: dto.amount, // Alias para compatibilidad con tests
      confirmedAmount: dto.amount,
      confirmedCurrency: dto.currency,
      formattedAmount,
      expiresAt,
      message: `El monto de ${formattedAmount} ha sido verificado y confirmado. Proceda con el pago usando este token.`,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Valida un token de confirmación antes de procesar el pago
   */
  async validateConfirmation(
    confirmationToken: string,
    amount: number,
    currency: string,
    userId: string,
    sessionId: string,
  ): Promise<boolean> {
    const confirmation = this.confirmationCache.get(confirmationToken);

    if (!confirmation) {
      throw new BadRequestException(
        'Token de confirmación inválido o expirado. Por favor, confirme el monto nuevamente.',
      );
    }

    // Verificar expiración
    if (new Date() > confirmation.expiresAt) {
      this.confirmationCache.delete(confirmationToken);
      throw new BadRequestException(
        'El token de confirmación ha expirado. Por favor, confirme el monto nuevamente.',
      );
    }

    // Verificar que coincidan los datos
    if (
      confirmation.amount !== amount ||
      confirmation.currency !== currency ||
      confirmation.userId !== userId ||
      confirmation.sessionId !== sessionId
    ) {
      throw new BadRequestException(
        'Los datos del pago no coinciden con la confirmación. Por favor, verifique e intente nuevamente.',
      );
    }

    // Eliminar el token después de validar (un solo uso)
    this.confirmationCache.delete(confirmationToken);

    return true;
  }

  /**
   * Invalida un token de confirmación
   */
  async invalidateConfirmation(confirmationToken: string): Promise<void> {
    this.confirmationCache.delete(confirmationToken);
  }

  // ===== MÉTODOS PRIVADOS =====

  private generateConfirmationToken(): string {
    return `conf_${crypto.randomBytes(16).toString('hex')}`;
  }

  private validateAmount(amount: number, currency: string): void {
    // Validar monto positivo
    if (amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    // Validar límites por moneda
    const limits: Record<string, { min: number; max: number }> = {
      USD: { min: 0.50, max: 999999.99 },
      CLP: { min: 100, max: 999999999 },
      EUR: { min: 0.50, max: 999999.99 },
      MXN: { min: 10, max: 999999.99 },
    };

    const limit = limits[currency.toUpperCase()];
    if (limit) {
      if (amount < limit.min) {
        throw new BadRequestException(
          `El monto mínimo para ${currency} es ${limit.min}`,
        );
      }
      if (amount > limit.max) {
        throw new BadRequestException(
          `El monto máximo para ${currency} es ${limit.max}`,
        );
      }
    }
  }

  private formatAmount(amount: number, currency: string): string {
    try {
      const formatter = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      return formatter.format(amount);
    } catch (error) {
      // Si el código de moneda es inválido, retornar formato simple
      return `${amount} ${currency}`;
    }
  }

  private generateWarnings(amount: number, currency: string): string[] {
    const warnings: string[] = [];

    // Advertencia para montos grandes
    const highAmountThresholds: Record<string, number> = {
      USD: 1000,
      CLP: 1000000,
      EUR: 1000,
      MXN: 20000,
    };

    const threshold = highAmountThresholds[currency.toUpperCase()];
    if (threshold && amount >= threshold) {
      warnings.push(
        'Este es un monto considerable. Verifique que sea correcto antes de continuar.',
      );
    }

    // Advertencia para procesamiento
    if (currency.toUpperCase() === 'CLP') {
      warnings.push('El pago se procesará en pesos chilenos (CLP).');
    }

    return warnings;
  }

  private cleanupExpiredConfirmations(): void {
    const now = new Date();
    for (const [token, confirmation] of this.confirmationCache.entries()) {
      if (confirmation.expiresAt < now) {
        this.confirmationCache.delete(token);
      }
    }
  }
}
