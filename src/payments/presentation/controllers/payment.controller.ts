import { Controller, Post, Body, Get, Param, Patch, HttpStatus, HttpCode } from '@nestjs/common';
import { PaymentApplicationService } from '../../application/services/payment-application.service';
import { ProcessPaymentDto } from '../../application/dto/process-payment.dto';
import { RefundPaymentDto } from '../../application/dto/refund-payment.dto';

@Controller('pagos')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentApplicationService,
  ) {}

  // POST api/pagos - Crear un nuevo pago
  @Post()
  @HttpCode(HttpStatus.CREATED) // 201 Created
  async createPayment(@Body() dto: ProcessPaymentDto) {
    return await this.paymentService.processPayment(dto);
  }

  // GET api/pagos - Obtener todos los pagos
  @Get()
  @HttpCode(HttpStatus.OK) // 200 OK
  async getAllPayments() {
    return await this.paymentService.getAllPayments();
  }

  // GET api/pagos/:id - Obtener un pago específico por ID
  @Get(':id')
  @HttpCode(HttpStatus.OK) // 200 OK
  async getPayment(@Param('id') id: string) {
    return await this.paymentService.getPaymentById(id);
  }

  // POST api/pagos/:id/refund - Reembolsar un pago
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK) // 200 OK
  async refundPayment(
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return await this.paymentService.refundPayment({ ...dto, paymentId: id });
  }

  // PATCH api/pagos/:id/cancel - Cancelar un pago
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK) // 200 OK
  async cancelPayment(@Param('id') id: string) {
    return await this.paymentService.cancelPayment(id);
  }

  // GET api/pagos/:id/status - Obtener estado de un pago
  @Get(':id/status')
  @HttpCode(HttpStatus.OK) // 200 OK
  async getPaymentStatus(@Param('id') id: string) {
    return await this.paymentService.getPaymentStatus(id);
  }
}
// TODO
// GET reembolso de pago por id
// GET todos los reembolsos
