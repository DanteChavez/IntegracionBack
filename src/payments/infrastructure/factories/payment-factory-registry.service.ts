import { Injectable }               from '@nestjs/common';
import { PaymentProcessorFactory }  from './payment-processor.factory';
import { PaymentProvider }          from '../../domain/entities/payment.entity';

@Injectable()
export class PaymentFactoryRegistry {
  private readonly factories = new Map<PaymentProvider, PaymentProcessorFactory>();
  
  register(provider: PaymentProvider, factory: PaymentProcessorFactory): void {
    this.factories.set(provider, factory);
  }
  
  getFactory(provider: PaymentProvider): PaymentProcessorFactory{
    const factory = this.factories.get(provider);
    if(!factory){
      throw new Error(`Payment factory not found for provider: ${provider}`);
    }
    return factory;
  }

  getAvailableProviders(): PaymentProvider[] {
    return Array.from(this.factories.keys());
  }
  
  hasProvider(provider: PaymentProvider): boolean{
    return this.factories.has(provider);
  }
}
