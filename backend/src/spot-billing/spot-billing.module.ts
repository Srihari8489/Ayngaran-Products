import { Module } from '@nestjs/common';
import { SpotBillingService } from './spot-billing.service';
import { SpotBillingController } from './spot-billing.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SpotBillingController],
  providers: [SpotBillingService],
  exports: [SpotBillingService],
})
export class SpotBillingModule {}
