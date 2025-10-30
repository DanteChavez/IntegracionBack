// src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './schemas/dto/create-user.dto';
import { UpdateUserDto } from './schemas/dto/update-user.dto';

@Injectable()
export class UsersService {
  // Sin MongoDB, los métodos retornarán datos mock o lanzarán NotImplementedException
  
  async create(createUserDto: CreateUserDto): Promise<any> {
    throw new ConflictException('Base de datos no configurada');
  }

  async findAll(): Promise<any[]> {
    return [];
  }

  async findOne(id: string): Promise<any> {
    throw new NotFoundException('Usuario con ID ' + id + ' no encontrado');
  }

  async findByEmail(email: string): Promise<any> {
    throw new NotFoundException('Usuario con email ' + email + ' no encontrado');
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    throw new NotFoundException('Usuario con ID ' + id + ' no encontrado');
  }

  async remove(id: string): Promise<void> {
    throw new NotFoundException('Usuario con ID ' + id + ' no encontrado');
  }
}
