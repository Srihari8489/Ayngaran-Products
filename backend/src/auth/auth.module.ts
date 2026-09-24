import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

import { OtpDeliveryService } from './otp-delivery.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'ayngaran_secret_jwt_key_2026_super_secure_access_token',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpDeliveryService, JwtAuthGuard, StaffJwtAuthGuard, PermissionsGuard],
  exports: [AuthService, OtpDeliveryService, JwtModule, JwtAuthGuard, StaffJwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}
