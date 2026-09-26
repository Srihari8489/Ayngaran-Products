import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController, AdminOrdersController } from './orders.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
