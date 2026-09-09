import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MapCategoryAttributeDto } from './dto/map-category-attribute.dto';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  // -------------------------------------------------------------
  // PUBLIC / CUSTOMER ENDPOINTS
  // -------------------------------------------------------------

  @Get('tree')
  async getCategoryTree() {
    return this.categoriesService.getCategoryTree();
  }

  @Get(':id/breadcrumbs')
  async getBreadcrumbs(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.getBreadcrumbs(id);
  }

  @Get(':id/attributes')
  async getInheritedAttributes(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.getInheritedAttributes(id);
  }

  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  // -------------------------------------------------------------
  // PROTECTED ADMIN / STAFF ENDPOINTS
  // -------------------------------------------------------------

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CATEGORIES_MANAGE')
  @Post()
  async create(@Body() dto: CreateCategoryDto, @CurrentStaff() staff: any) {
    return this.categoriesService.create(dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CATEGORIES_MANAGE')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @CurrentStaff() staff: any,
  ) {
    return this.categoriesService.update(id, dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CATEGORIES_MANAGE')
  @Delete(':id')
  async softDelete(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.categoriesService.softDelete(id, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CATEGORIES_MANAGE')
  @Post(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.categoriesService.restore(id, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CATEGORIES_MANAGE')
  @Post(':id/attributes')
  async mapAttribute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MapCategoryAttributeDto,
    @CurrentStaff() staff: any,
  ) {
    return this.categoriesService.mapAttribute(id, dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('CATEGORIES_MANAGE')
  @Delete(':id/attributes/:attributeId')
  async unmapAttribute(
    @Param('id', ParseIntPipe) id: number,
    @Param('attributeId', ParseIntPipe) attributeId: number,
    @CurrentStaff() staff: any,
  ) {
    return this.categoriesService.unmapAttribute(id, attributeId, staff?.id);
  }
}
