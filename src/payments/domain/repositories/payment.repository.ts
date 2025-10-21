import { Payment } from '../entities/payment.entity';

export interface PaymentRepository {

    findById(id: string): Promise<Payment | null>;
    
  // TODO: Implementar métodos del repositorio
  // - save(payment: Payment): Promise<Payment>
  // - findById(id: string): Promise<Payment | null>
  // - findByProvider(provider: string): Promise<Payment[]>
  // - findByStatus(status: string): Promise<Payment[]>
  // - update(id: string, payment: Partial<Payment>): Promise<Payment>
  // - delete(id: string): Promise<void>
}
