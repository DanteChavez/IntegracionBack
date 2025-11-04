import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('usuarios')
@Controller('users')
export class UsersController {
  /**
   * Obtiene los datos del usuario actual desde archivo JSON
   * @returns Datos del usuario
   */
  @Get('current')
  @ApiOperation({ 
    summary: 'Obtener usuario actual',
    description: 'Obtiene los datos del usuario desde usuario.json (mock data)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Usuario encontrado',
    schema: {
      example: {
        id: 'user_123',
        name: 'Juan Pérez',
        email: 'juan@ejemplo.com'
      }
    }
  })
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

  /**
   * Obtiene el carrito del usuario con cálculo de IVA y total
   * @returns Carrito con subtotal, IVA y total calculados
   */
  @Get('cart')
  @ApiOperation({ 
    summary: 'Obtener carrito del usuario',
    description: 'Obtiene el carrito desde carrito.json con cálculo automático de IVA (19%) y total'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Carrito con cálculos completos',
    schema: {
      example: {
        cartId: 'cart_019',
        userId: 'user_123',
        items: [
          {
            id: 'prod-001',
            name: 'Audífonos Pro',
            price: 29990,
            quantity: 2
          }
        ],
        subtotal: 59980,
        iva: {
          rate: 0.19,
          percentage: 19,
          amount: 11396,
          description: 'Impuesto al Valor Agregado (IVA)'
        },
        total: 71376,
        currency: {
          code: 'CLP',
          symbol: '$',
          name: 'Peso Chileno'
        }
      }
    }
  })
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
        cartId: cartData.id,
        userId: cartData.userId,
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
}