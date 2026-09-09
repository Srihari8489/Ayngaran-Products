import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // -------------------------------------------------------------
  // PUBLIC / CUSTOMER ENDPOINTS
  // -------------------------------------------------------------

  @Get('filters')
  async getCategoryFilters(@Query('categoryId', ParseIntPipe) categoryId: number) {
    return this.productsService.getCategoryFilters(categoryId);
  }

  @Get()
  async findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':idOrSlug')
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.productsService.findOne(idOrSlug);
  }

  // -------------------------------------------------------------
  // ADMIN / STAFF ENDPOINTS
  // -------------------------------------------------------------

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PRODUCTS_MANAGE')
  @Post()
  async create(@Body() dto: CreateProductDto, @CurrentStaff() staff: any) {
    return this.productsService.create(dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PRODUCTS_MANAGE')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @CurrentStaff() staff: any,
  ) {
    return this.productsService.update(id, dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PRODUCTS_MANAGE')
  @Delete(':id')
  async softDelete(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.productsService.softDelete(id, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PRODUCTS_MANAGE')
  @Post(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.productsService.restore(id, staff?.id);
  }
}
