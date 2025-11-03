import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PagoEntity } from './pago.entity';

@Entity('historial_de_errores')
export class HistorialErrorEntity {
  @PrimaryGeneratedColumn({ name: 'id_historial_de_errores' })
  idHistorialDeErrores: number;

  @Column({ name: 'id_pagos', type: 'int' })
  idPagos: number;

  @CreateDateColumn({ name: 'fecha', type: 'datetime' })
  fecha: Date;

  @Column({ name: 'codigo', type: 'varchar', length: 50 })
  codigo: string;

  @Column({ name: 'mensaje', type: 'text' })
  mensaje: string;

  @Column({ name: 'proveedor', type: 'enum', enum: ['stripe', 'paypal', 'webpay'] })
  proveedor: string;

  @Column({ name: 'otro', type: 'json', nullable: true })
  otro: any;

  @ManyToOne(() => PagoEntity, (pago) => pago.errores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_pagos' })
  pago: PagoEntity;
}
