import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SpotBillingService } from './spot-billing.service';
import { CreateSpotBillDto } from './dto/create-spot-bill.dto';
import { CalculateSpotBillDto } from './dto/calculate-spot-bill.dto';
import { ReturnSpotBillDto } from './dto/return-spot-bill.dto';
import { CancelSpotBillDto } from './dto/cancel-spot-bill.dto';
import { SpotBillQueryDto } from './dto/spot-bill-query.dto';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@Controller('spot-bills')
@UseGuards(StaffJwtAuthGuard, PermissionsGuard)
export class SpotBillingController {
  constructor(private spotBillingService: SpotBillingService) {}

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // POS CATALOG & CUSTOMER SEARCH
  // -------------------------------------------------------------

  @Get('products')
  @RequirePermissions('SPOT_BILLING_VIEW')
  async searchProducts(@Query('search') search?: string, @Query('q') q?: string) {
    return this.spotBillingService.searchProducts(q || search);
  }

  @Get('products/search')
  @RequirePermissions('SPOT_BILLING_VIEW')
  async searchProductsSearch(@Query('search') search?: string, @Query('q') q?: string) {
    return this.spotBillingService.searchProducts(q || search);
  }

  @Get('customers')
  @RequirePermissions('SPOT_BILLING_VIEW')
  async searchCustomers(@Query('search') search?: string, @Query('q') q?: string) {
    return this.spotBillingService.searchCustomers(q || search);
  }

  @Get('customers/search')
  @RequirePermissions('SPOT_BILLING_VIEW')
  async searchCustomersSearch(@Query('search') search?: string, @Query('q') q?: string) {
    return this.spotBillingService.searchCustomers(q || search);
  }

  // -------------------------------------------------------------
  // BILL CALCULATION PREVIEW
  // -------------------------------------------------------------

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('SPOT_BILLING_VIEW')
  async calculateBill(@Body() dto: CalculateSpotBillDto) {
    return this.spotBillingService.calculateBill(dto);
  }

  // -------------------------------------------------------------
  // GENERATE BILL (ATOMIC TRANSACTION & STOCK DEDUCTION)
  // -------------------------------------------------------------

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('SPOT_BILLING_MANAGE')
  async createSpotBill(
    @Body() dto: CreateSpotBillDto,
    @CurrentStaff() staff: any,
  ) {
    return this.spotBillingService.createSpotBill(dto, staff);
  }

  // -------------------------------------------------------------
  // BILLING HISTORY & REPORTS
  // -------------------------------------------------------------

  @Get('reports')
  @RequirePermissions('SPOT_BILLING_VIEW')
  async getReports(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.spotBillingService.getReports(startDate, endDate);
  }

  @Get('reports/summary')
  @RequirePermissions('SPOT_BILLING_VIEW')
  async getReportsSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.spotBillingService.getReports(startDate, endDate);
  }

  @Get()
  @RequirePermissions('SPOT_BILLING_VIEW')
  async findAll(@Query() query: SpotBillQueryDto) {
    return this.spotBillingService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('SPOT_BILLING_VIEW')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.spotBillingService.findOne(id);
  }

  @Get(':id/invoice')
  @RequirePermissions('SPOT_BILLING_VIEW')
  async getInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.spotBillingService.getInvoice(id);
  }

  // -------------------------------------------------------------
  // RETURNS & REFUNDS
  // -------------------------------------------------------------

  @Post(':id/return')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('SPOT_BILLING_MANAGE')
  async returnBill(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnSpotBillDto,
    @CurrentStaff() staff: any,
  ) {
    return this.spotBillingService.returnBill(id, dto, staff);
  }

  // -------------------------------------------------------------
  // CANCELLATION
  // -------------------------------------------------------------

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('SPOT_BILLING_MANAGE')
  async cancelBill(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelSpotBillDto,
    @CurrentStaff() staff: any,
  ) {
    return this.spotBillingService.cancelBill(id, dto, staff);
  }
}
