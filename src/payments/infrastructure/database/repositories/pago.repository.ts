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
  ): Promise<PagoEntity> {
    return await this.actualizarEstadoPago(idPagos, EstadoPago.FAILED, {
      descripcion: `${codigoError}: ${mensajeError}`,
    });
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
   * Obtener todos los pagos de un pedido específico
   */
  async obtenerPagosPorPedido(idPedido: number): Promise<PagoEntity[]> {
    return await this.pagoRepo.find({
      where: { idPedido },
      order: { fechaCreacion: 'DESC' },
    });
  }

  /**
   * Obtener todos los pagos de un usuario específico
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
}
