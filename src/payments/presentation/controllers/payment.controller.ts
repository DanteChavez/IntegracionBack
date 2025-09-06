import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { PaymentApplicationService } from '../../application/services/payment-application.service';
import { ProcessPaymentDto } from '../../application/dto/process-payment.dto';
import { RefundPaymentDto } from '../../application/dto/refund-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentApplicationService,
  ) {
      
  }

  // TODO: Implementar endpoints
  // @Post()
  // async processPayment(@Body() dto: ProcessPaymentDto) {
  //   return await this.paymentService.processPayment(dto);
  // }

  // @Post(':id/refund')
  // async refundPayment(
  //   @Param('id') id: string,
  //   @Body() dto: RefundPaymentDto,
  // ) {
  //   return await this.paymentService.refundPayment({ ...dto, paymentId: id });
  // }

  // @Patch(':id/cancel')
  // async cancelPayment(@Param('id') id: string) {
  //   return await this.paymentService.cancelPayment(id);
  // }

  // @Get(':id')
  // async getPayment(@Param('id') id: string) {
  //   return await this.paymentService.getPaymentStatus(id);
  // }

  // @Get(':id/status')
  // async getPaymentStatus(@Param('id') id: string) {
  //   return await this.paymentService.getPaymentStatus(id);
  // }
}
