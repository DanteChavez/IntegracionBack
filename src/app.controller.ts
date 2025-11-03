import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const isConnected = this.connection.isInitialized;
    return {
      status: 'ok',
      database: {
        connected: isConnected,
        type: 'mysql',
        database: process.env.DB_DATABASE || 'tite',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
