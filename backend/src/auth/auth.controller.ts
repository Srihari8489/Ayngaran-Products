import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
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

  @Post('customer/send-otp')
  @HttpCode(HttpStatus.OK)
  async sendCustomerOtp(@Body() dto: RequestOtpDto) {
    const target = dto.phone || dto.identifier || '';
    if (!target) throw new BadRequestException('Phone number is required');
    return this.authService.requestCustomerOtp(target);
  }

  @Post('customer/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestCustomerOtp(@Body() dto: RequestOtpDto) {
    const target = dto.phone || dto.identifier || '';
    if (!target) throw new BadRequestException('Phone number is required');
    return this.authService.requestCustomerOtp(target);
  }

  @Post('customer/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyCustomerOtp(@Body() dto: VerifyOtpDto) {
    const target = dto.phone || dto.identifier || '';
    if (!target) throw new BadRequestException('Phone number is required');
    return this.authService.verifyCustomerOtp(target, dto.otp, dto.name);
  }

  @Post('customer/refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshCustomerToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshCustomerToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('customer/profile')
  async getCustomerProfile(@CurrentUser() user: any) {
    const addresses = await this.authService.getCustomerAddresses(user.id);
    return {
      id: user.id,
      userCode: user.userCode,
      name: user.name,
      email: user.email,
      phone: user.phone,
      addresses,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('customer/profile')
  @HttpCode(HttpStatus.OK)
  async updateCustomerProfile(
    @CurrentUser() user: any,
    @Body() body: { name?: string; email?: string },
  ) {
    return this.authService.updateCustomerProfile(user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put('customer/profile')
  @HttpCode(HttpStatus.OK)
  async putCustomerProfile(
    @CurrentUser() user: any,
    @Body() body: { name?: string; email?: string },
  ) {
    return this.authService.updateCustomerProfile(user.id, body);
  }

  // -------------------------------------------------------------
  // CUSTOMER ADDRESS ENDPOINTS
  // -------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('customer/addresses')
  async getCustomerAddresses(@CurrentUser() user: any) {
    return this.authService.getCustomerAddresses(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('customer/addresses')
  @HttpCode(HttpStatus.OK)
  async addCustomerAddress(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.authService.addCustomerAddress(user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('customer/addresses/:id')
  @HttpCode(HttpStatus.OK)
  async updateCustomerAddress(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.authService.updateCustomerAddress(user.id, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('customer/addresses/:id/set-default')
  @HttpCode(HttpStatus.OK)
  async setDefaultAddress(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.authService.setDefaultAddress(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('customer/addresses/:id')
  @HttpCode(HttpStatus.OK)
  async deleteCustomerAddress(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.authService.deleteCustomerAddress(user.id, id);
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
