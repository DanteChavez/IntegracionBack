// src/auth/auth.service.ts
import { Injectable, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    throw new NotImplementedException('Autenticación no implementada - MongoDB no configurado');
  }

  async login(loginDto: LoginDto) {
    throw new NotImplementedException('Login no implementado - MongoDB no configurado');
  }

  async register(registerDto: RegisterDto) {
    throw new NotImplementedException('Registro no implementado - MongoDB no configurado');
  }

  async me(userId: string) {
    throw new NotImplementedException('Perfil de usuario no implementado - MongoDB no configurado');
  }
}
