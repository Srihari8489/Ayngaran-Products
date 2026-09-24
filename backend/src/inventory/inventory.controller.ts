import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@UseGuards(StaffJwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @RequirePermissions('INVENTORY_MANAGE')
  @Get()
  async getStockOverview(@Query() query?: any) {
    return this.inventoryService.getStockOverview(query);
  }

  @RequirePermissions('INVENTORY_MANAGE')
  @Get('low-stock')
  async getLowStockAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }

  @RequirePermissions('INVENTORY_MANAGE')
  @Post('adjust')
  async adjustStock(@Body() dto: AdjustStockDto, @CurrentStaff() staff: any) {
    return this.inventoryService.adjustStock(dto, staff?.id);
  }

  @RequirePermissions('INVENTORY_MANAGE')
  @Get('history')
  async getHistory(@Query() query?: any) {
    return this.inventoryService.getHistory(query);
  }
}
