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
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@UseGuards(StaffJwtAuthGuard, PermissionsGuard)
@Controller('staff')
export class StaffController {
  constructor(private staffService: StaffService) {}

  @RequirePermissions('STAFF_MANAGE')
  @Get()
  async findAll(@Query() query?: any) {
    return this.staffService.findAll(query);
  }

  @RequirePermissions('STAFF_MANAGE')
  @Get('roles')
  async findAllRoles() {
    return this.staffService.findAllRoles();
  }

  @RequirePermissions('STAFF_MANAGE')
  @Get('permissions')
  async findAllPermissions() {
    return this.staffService.findAllPermissions();
  }

  @RequirePermissions('STAFF_MANAGE')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.staffService.findOne(id);
  }

  @RequirePermissions('STAFF_MANAGE')
  @Post()
  async create(@Body() dto: CreateStaffDto, @CurrentStaff() staff: any) {
    return this.staffService.create(dto, staff?.id);
  }

  @RequirePermissions('STAFF_MANAGE')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffDto,
    @CurrentStaff() staff: any,
  ) {
    return this.staffService.update(id, dto, staff?.id);
  }

  @RequirePermissions('STAFF_MANAGE')
  @Delete(':id')
  async softDelete(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.staffService.softDelete(id, staff?.id);
  }

  @RequirePermissions('STAFF_MANAGE')
  @Post(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.staffService.restore(id, staff?.id);
  }
}
