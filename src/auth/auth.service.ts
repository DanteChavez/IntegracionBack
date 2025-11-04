// src/auth/auth.service.ts
import { Injectable, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/**
 * Servicio de autenticación simplificado
 * Nota: Autenticación completa no implementada (fuera del alcance del sistema de pagos)
 * Los endpoints lanzan NotImplementedException
 */
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    throw new NotImplementedException('Autenticación no implementada - Base de datos de usuarios no configurada');
  }

  async login(loginDto: LoginDto) {
    throw new NotImplementedException('Login no implementado - Base de datos de usuarios no configurada');
  }

  async register(registerDto: RegisterDto) {
    throw new NotImplementedException('Registro no implementado - Base de datos de usuarios no configurada');
  }

  async me(userId: string) {
    throw new NotImplementedException('Perfil de usuario no implementado - Base de datos de usuarios no configurada');
  }
}
