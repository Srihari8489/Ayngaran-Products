import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { AuthModule } from '../auth/auth.module';
import { ShippingModule } from '../shipping/shipping.module';

@Module({
  imports: [AuthModule, ShippingModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
