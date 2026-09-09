import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@UseGuards(StaffJwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @RequirePermissions('REPORTS_VIEW')
  @Get('dashboard')
  async getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @RequirePermissions('REPORTS_VIEW')
  @Get('location')
  async getLocationOrdersReport(@Query() query: any) {
    return this.reportsService.getLocationOrdersReport(query);
  }

  @RequirePermissions('REPORTS_VIEW')
  @Get('category')
  async getCategorySalesReport() {
    return this.reportsService.getCategorySalesReport();
  }

  @RequirePermissions('REPORTS_VIEW')
  @Get('brand')
  async getBrandSalesReport() {
    return this.reportsService.getBrandSalesReport();
  }

  @RequirePermissions('REPORTS_VIEW')
  @Get('export-location-csv')
  async exportLocationCsv(@Query() query: any, @Res() res: Response) {
    const reportData = await this.reportsService.getLocationOrdersReport(query);
    const csvContent = this.reportsService.exportCsv(reportData);

    res.header('Content-Type', 'text/csv');
    res.attachment(`ayngaran_location_report_${Date.now()}.csv`);
    return res.send(csvContent);
  }
}
