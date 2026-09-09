import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { StaffLoginDto } from './dto/staff-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // -------------------------------------------------------------
  // CUSTOMER ENDPOINTS
  // -------------------------------------------------------------

  @Post('customer/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestCustomerOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestCustomerOtp(dto.identifier);
  }

  @Post('customer/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyCustomerOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyCustomerOtp(dto.identifier, dto.otp);
  }

  @Post('customer/refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshCustomerToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshCustomerToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('customer/profile')
  async getCustomerProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      userCode: user.userCode,
      name: user.name,
      email: user.email,
      phone: user.phone,
      addresses: user.addresses,
    };
  }

  // -------------------------------------------------------------
  // STAFF ENDPOINTS
  // -------------------------------------------------------------

  @Post('staff/login')
  @HttpCode(HttpStatus.OK)
  async loginStaff(@Body() dto: StaffLoginDto, @Req() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    return this.authService.loginStaff(dto.email, dto.password, ip);
  }

  @Post('staff/refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshStaffToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshStaffToken(dto.refreshToken);
  }

  @UseGuards(StaffJwtAuthGuard)
  @Get('staff/profile')
  async getStaffProfile(@CurrentStaff() staff: any) {
    return staff;
  }
}
