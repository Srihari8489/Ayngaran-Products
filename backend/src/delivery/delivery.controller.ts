import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryPartnerDto } from './dto/create-delivery-partner.dto';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@UseGuards(StaffJwtAuthGuard, PermissionsGuard)
@Controller('delivery-partners')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @RequirePermissions('DELIVERY_MANAGE')
  @Get()
  async findAll(@Query() query?: any) {
    return this.deliveryService.findAll(query);
  }

  @RequirePermissions('DELIVERY_MANAGE')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.deliveryService.findOne(id);
  }

  @RequirePermissions('DELIVERY_MANAGE')
  @Post()
  async create(@Body() dto: CreateDeliveryPartnerDto, @CurrentStaff() staff: any) {
    return this.deliveryService.create(dto, staff?.id);
  }

  @RequirePermissions('DELIVERY_MANAGE')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateDeliveryPartnerDto>,
    @CurrentStaff() staff: any,
  ) {
    return this.deliveryService.update(id, dto, staff?.id);
  }

  @RequirePermissions('DELIVERY_MANAGE')
  @Delete(':id')
  async softDelete(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.deliveryService.softDelete(id, staff?.id);
  }
}
