import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { AuthModule } from '../auth/auth.module';
import { ShippingModule } from '../shipping/shipping.module';

@Module({
  imports: [AuthModule, ShippingModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
