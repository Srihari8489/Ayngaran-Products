import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { UpdateShippingSettingsDto } from './dto/shipping-settings.dto';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@Controller()
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  // -------------------------------------------------------------
  // ADMIN SHIPPING CONFIGURATION
  // -------------------------------------------------------------

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('SETTINGS_MANAGE')
  @Get(['admin/shipping/settings', 'shipping/settings'])
  async getShippingSettings() {
    return this.shippingService.getShippingConfig();
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('SETTINGS_MANAGE')
  @Put(['admin/shipping/settings', 'shipping/settings'])
  async updateShippingSettings(
    @Body() dto: UpdateShippingSettingsDto,
    @CurrentStaff() staff: any,
  ) {
    return this.shippingService.updateShippingConfig(dto, staff?.id);
  }

  // -------------------------------------------------------------
  // CHECKOUT SHIPPING CALCULATION
  // -------------------------------------------------------------

  @Post(['checkout/shipping/calculate', 'shipping/calculate'])
  @HttpCode(HttpStatus.OK)
  async calculateShipping(@Body() dto: CalculateShippingDto) {
    return this.shippingService.calculateShipping(dto);
  }
}
