import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { UpdateGatewayDto } from './dto/update-gateway.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // -------------------------------------------------------------
  // CUSTOMER ENDPOINTS
  // -------------------------------------------------------------

  @Get('gateways')
  async getCustomerGateways() {
    return this.paymentsService.getCustomerGateways();
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  async createPaymentSession(
    @CurrentUser() user: any,
    @Body('orderId', ParseIntPipe) orderId: number,
    @Body('gatewayCode') gatewayCode: string,
  ) {
    return this.paymentsService.createPaymentSession(orderId, gatewayCode, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verifyAndFinalizePayment(
    @CurrentUser() user: any,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyAndFinalizePayment(dto, user.id);
  }

  // -------------------------------------------------------------
  // ADMIN / STAFF GATEWAY CONFIGURATION
  // -------------------------------------------------------------

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PAYMENTS_MANAGE')
  @Get('admin/gateways')
  async getAdminGateways() {
    return this.paymentsService.getAdminGateways();
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PAYMENTS_MANAGE')
  @Patch('admin/gateways/:id')
  async updateGateway(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGatewayDto,
    @CurrentStaff() staff: any,
  ) {
    return this.paymentsService.updateGateway(id, dto, staff?.id);
  }
}
