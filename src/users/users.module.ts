import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';

/**
 * Módulo simplificado de Users
 * Solo proporciona endpoints para obtener datos del usuario y carrito desde JSON
 * No incluye CRUD de usuarios (fuera del alcance del sistema de pagos)
 */
@Module({
  controllers: [UsersController],
})
export class UsersModule {}