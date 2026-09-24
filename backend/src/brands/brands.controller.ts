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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@Controller('brands')
export class BrandsController {
  constructor(private brandsService: BrandsService) {}

  @Get()
  async findAll(@Query() query?: any) {
    return this.brandsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findOne(id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('BRANDS_MANAGE')
  @Post()
  async create(@Body() dto: CreateBrandDto, @CurrentStaff() staff: any) {
    return this.brandsService.create(dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('BRANDS_MANAGE')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBrandDto,
    @CurrentStaff() staff: any,
  ) {
    return this.brandsService.update(id, dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('BRANDS_MANAGE')
  @Delete(':id')
  async softDelete(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.brandsService.softDelete(id, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('BRANDS_MANAGE')
  @Post(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.brandsService.restore(id, staff?.id);
  }
}
