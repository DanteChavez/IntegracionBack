import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Estrategia JWT simplificada
 * Nota: No valida usuarios contra base de datos (no implementado)
 * Solo valida el token JWT y retorna el payload
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // En un sistema real, aquí se validaría el usuario contra la base de datos
    // Por ahora solo retornamos el payload del token
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token inválido');
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}