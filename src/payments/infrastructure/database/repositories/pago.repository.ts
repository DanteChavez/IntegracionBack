import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagoEntity, EstadoPago } from '../entities/pago.entity';
import { HistorialErrorEntity } from '../entities/historial-error.entity';

@Injectable()
export class PagoRepository {
  constructor(
    @InjectRepository(PagoEntity)
    private readonly pagoRepo: Repository<PagoEntity>,
    @InjectRepository(HistorialErrorEntity)
    private readonly errorRepo: Repository<HistorialErrorEntity>,
  ) {}

  /**
   * Crear un nuevo registro de pago en la base de datos
   */
  async crearPago(datos: Partial<PagoEntity>): Promise<PagoEntity> {
    const pago = this.pagoRepo.create({
      ...datos,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
    });
    return await this.pagoRepo.save(pago);
  }

  /**
   * Actualizar el estado de un pago por su ID numérico
   */
  async actualizarEstadoPago(
    idPagos: number,
    estado: EstadoPago,
    datosAdicionales?: Partial<PagoEntity>,
  ): Promise<PagoEntity> {
    const pago = await this.pagoRepo.findOne({ where: { idPagos } });
    if (!pago) {
      throw new Error(`Pago con ID ${idPagos} no encontrado`);
    }

    Object.assign(pago, { estado, ...datosAdicionales });
    return await this.pagoRepo.save(pago);
  }

  /**
   * Marcar un pago como completado
   */
  async marcarComoCompletado(
    idPagos: number,
    idTransaccionProveedor: string,
  ): Promise<PagoEntity> {
    return await this.actualizarEstadoPago(idPagos, EstadoPago.COMPLETED, {
      idTransaccionProveedor,
    });
  }

  /**
   * Marcar un pago como fallido
   */
  async marcarComoFallido(
    idPagos: number,
    codigoError: string,
    mensajeError: string,
    idTransaccionProveedor?: string,
  ): Promise<PagoEntity> {
    const updateData: any = {
      descripcion: `${codigoError}: ${mensajeError}`,
    };
    
    // Si se proporciona ID de transacción, guardarlo
    if (idTransaccionProveedor) {
      updateData.idTransaccionProveedor = idTransaccionProveedor;
    }
    
    return await this.actualizarEstadoPago(idPagos, EstadoPago.FAILED, updateData);
  }

  /**
   * Registrar un error en el historial
   */
  async registrarError(
    idPagos: number,
    codigo: string,
    mensaje: string,
    proveedor: string,
    otro?: any,
  ): Promise<HistorialErrorEntity> {
    const error = this.errorRepo.create({
      idPagos,
      fecha: new Date(), // Establecer fecha manualmente
      codigo,
      mensaje,
      proveedor,
      otro: otro || null,
    });
    return await this.errorRepo.save(error);
  }

  /**
   * Obtener pagos por usuario
   */
  async obtenerPagosPorUsuario(idUsuario: string): Promise<PagoEntity[]> {
    return await this.pagoRepo.find({
      where: { idUsuario },
      order: { fechaCreacion: 'DESC' },
    });
  }

  /**
   * Obtener un pago por su ID numérico
   */
  async obtenerPagoPorId(idPagos: number): Promise<PagoEntity | null> {
    return await this.pagoRepo.findOne({
      where: { idPagos },
      relations: ['errores'],
    });
  }

  /**
   * Obtener historial de errores de un pago (usando id_pagos numérico)
   */
  async obtenerErroresDePago(idPagos: number): Promise<HistorialErrorEntity[]> {
    return await this.errorRepo.find({
      where: { idPagos },
      order: { fecha: 'DESC' },
    });
  }

  /**
   * Marcar un pago como exitoso (para PayPal)
   * Busca por metadata.paypalOrderId y actualiza el estado
   */
  async marcarComoExitoso(
    paypalOrderId: string,
    transactionId: string,
    metadata?: any,
  ): Promise<PagoEntity> {
    // Buscar el pago por paypalOrderId en metadata
    const pagos = await this.pagoRepo
      .createQueryBuilder('pago')
      .where("JSON_EXTRACT(pago.metadata, '$.paypalOrderId') = :orderId", {
        orderId: paypalOrderId,
      })
      .getMany();

    if (!pagos || pagos.length === 0) {
      throw new Error(`Pago con PayPal Order ID ${paypalOrderId} no encontrado`);
    }

    const pago = pagos[0];
    pago.estado = EstadoPago.COMPLETED;
    pago.idTransaccionProveedor = transactionId;
    pago.metadata = { ...pago.metadata, ...metadata };
    pago.fechaActualizacion = new Date();

    return await this.pagoRepo.save(pago);
  }

  /**
   * Marcar un pago como reembolsado (para PayPal)
   */
  async marcarComoReembolsado(
    captureId: string,
    refundId: string,
  ): Promise<PagoEntity> {
    const pago = await this.pagoRepo.findOne({
      where: { idTransaccionProveedor: captureId },
    });

    if (!pago) {
      throw new Error(`Pago con capture ID ${captureId} no encontrado`);
    }

    pago.estado = EstadoPago.REFUNDED;
    pago.metadata = { ...pago.metadata, refundId, refundDate: new Date() };
    pago.fechaActualizacion = new Date();

    return await this.pagoRepo.save(pago);
  }

  /**
   * Marcar un pago de PayPal como fallido por Order ID
   */
  async marcarPayPalComoFallido(
    paypalOrderId: string,
    reason: string,
  ): Promise<PagoEntity> {
    const pagos = await this.pagoRepo
      .createQueryBuilder('pago')
      .where("JSON_EXTRACT(pago.metadata, '$.paypalOrderId') = :orderId", {
        orderId: paypalOrderId,
      })
      .getMany();

    if (!pagos || pagos.length === 0) {
      throw new Error(`Pago con PayPal Order ID ${paypalOrderId} no encontrado`);
    }

    const pago = pagos[0];
    pago.estado = EstadoPago.FAILED;
    pago.descripcion = reason;
    pago.fechaActualizacion = new Date();

    return await this.pagoRepo.save(pago);
  }
}
