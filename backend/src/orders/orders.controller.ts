import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // -------------------------------------------------------------
  // CUSTOMER ORDER ENDPOINTS
  // -------------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserOrders(@CurrentUser() user: any) {
    return this.ordersService.getUserOrders(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserOrderDetails(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.getUserOrderDetails(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelOrder(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.ordersService.cancelOrder(user.id, id, reason);
  }

  // -------------------------------------------------------------
  // ADMIN ORDER ENDPOINTS
  // -------------------------------------------------------------

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ORDERS_MANAGE')
  @Get('admin/all')
  async getAllOrders(@Query() query: any) {
    return this.ordersService.getAllOrders(query);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ORDERS_MANAGE')
  @Get('admin/:id')
  async getAdminOrderDetails(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.getAdminOrderDetails(id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ORDERS_MANAGE')
  @Patch('admin/:id/status')
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentStaff() staff: any,
  ) {
    return this.ordersService.updateOrderStatus(id, dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('DELIVERY_MANAGE')
  @Post('admin/:id/assign-delivery')
  async assignDeliveryPartner(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignDeliveryDto,
    @CurrentStaff() staff: any,
  ) {
    return this.ordersService.assignDeliveryPartner(id, dto, staff?.id);
  }
}
