import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { HistorialErrorEntity } from './historial-error.entity';

export enum EstadoPago {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ProveedorPago {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  WEBPAY = 'webpay',
}

@Entity('pagos')
export class PagoEntity {
  @PrimaryGeneratedColumn({ name: 'id_pagos' })
  idPagos: number;

  @Column({ name: 'id_pedido', type: 'int' })
  idPedido: number;

  @Column({ name: 'id_usuario', type: 'varchar', length: 45 })
  idUsuario: string;

  @Column({ name: 'id_carrito', type: 'varchar', length: 45, nullable: true })
  idCarrito: string;

  @Column({ name: 'monto', type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'tipo_moneda', type: 'varchar', length: 3, default: 'CLP' })
  tipoMoneda: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
  })
  estado: string;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'datetime' })
  fechaCreacion: Date;

  @Column({ name: 'proveedor', type: 'enum', enum: ['stripe', 'paypal', 'webpay'] })
  proveedor: string;

  @Column({ name: 'id_transaccion_proveedor', type: 'varchar', length: 255, nullable: true })
  idTransaccionProveedor: string;

  @Column({ name: 'ultimos_cuatro_digitos', type: 'varchar', length: 4, nullable: true })
  ultimosCuatroDigitos: string;

  @Column({ name: 'nombre_titular', type: 'varchar', length: 255, nullable: true })
  nombreTitular: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'id_pago_stripe', type: 'varchar', length: 255, nullable: true })
  idPagoStripe: string;

  @Column({ name: 'id_pago_contabilidad_stripe', type: 'varchar', length: 255, nullable: true })
  idPagoContabilidadStripe: string;

  @Column({ name: 'id_pago_paypal', type: 'varchar', length: 255, nullable: true })
  idPagoPaypal: string;

  @Column({ name: 'fecha_reembolso', type: 'datetime', nullable: true })
  fechaReembolso: Date;

  @Column({ name: 'razon_reembolso', type: 'varchar', length: 500, nullable: true })
  razonReembolso: string;

  @Column({ name: 'monto_reembolsado', type: 'decimal', precision: 10, scale: 2, nullable: true })
  montoReembolsado: number;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'datetime' })
  fechaActualizacion: Date;

  @OneToMany(() => HistorialErrorEntity, (error) => error.pago)
  errores: HistorialErrorEntity[];
}
