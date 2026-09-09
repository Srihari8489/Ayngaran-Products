import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@UseGuards(StaffJwtAuthGuard, PermissionsGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @RequirePermissions('AUDIT_VIEW')
  @Get()
  async findAll(@Query() query: any) {
    return this.auditService.findAll(query);
  }
}
