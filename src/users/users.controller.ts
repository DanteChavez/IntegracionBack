import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './schemas/dto/create-user.dto';
import { UpdateUserDto } from './schemas/dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('current')
  getCurrentUser() {
    try {
      const dataPath = path.join(process.cwd(), 'src', 'data', 'usuario.json');
      const fileContent = fs.readFileSync(dataPath, 'utf-8');
      const userData = JSON.parse(fileContent);
      return userData;
    } catch (error) {
      console.error('❌ Error leyendo usuario.json:', error.message);
      throw error;
    }
  }

  @Get('cart')
  getCart() {
    try {
      // Leer carrito
      const cartPath = path.join(process.cwd(), 'src', 'data', 'carrito.json');
      const cartData = JSON.parse(fs.readFileSync(cartPath, 'utf-8'));

      // Leer configuración de impuestos
      const taxConfigPath = path.join(process.cwd(), 'src', 'config', 'tax.config.json');
      const taxConfig = JSON.parse(fs.readFileSync(taxConfigPath, 'utf-8'));

      // Calcular subtotal
      const subtotal = cartData.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Calcular IVA
      const ivaAmount = Math.round(subtotal * taxConfig.iva.rate);

      // Calcular total
      const total = subtotal + ivaAmount;

      // Retornar resumen completo
      return {
        items: cartData.items,
        subtotal: subtotal,
        iva: {
          rate: taxConfig.iva.rate,
          percentage: Math.round(taxConfig.iva.rate * 100),
          amount: ivaAmount,
          description: taxConfig.iva.description
        },
        total: total,
        currency: taxConfig.currency,
        checkout: taxConfig.checkout
      };
    } catch (error) {
      console.error('❌ Error leyendo carrito:', error.message);
      throw error;
    }
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}