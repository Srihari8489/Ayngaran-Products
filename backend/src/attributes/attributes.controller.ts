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
import { AttributesService } from './attributes.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@Controller('attributes')
export class AttributesController {
  constructor(private attributesService: AttributesService) {}

  @Get()
  async findAll(@Query() query?: any) {
    return this.attributesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attributesService.findOne(id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ATTRIBUTES_MANAGE')
  @Post()
  async create(@Body() dto: CreateAttributeDto, @CurrentStaff() staff: any) {
    return this.attributesService.create(dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ATTRIBUTES_MANAGE')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttributeDto,
    @CurrentStaff() staff: any,
  ) {
    return this.attributesService.update(id, dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ATTRIBUTES_MANAGE')
  @Delete(':id')
  async softDelete(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.attributesService.softDelete(id, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ATTRIBUTES_MANAGE')
  @Post(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.attributesService.restore(id, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ATTRIBUTES_MANAGE')
  @Post(':id/values')
  async addValue(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAttributeValueDto,
    @CurrentStaff() staff: any,
  ) {
    return this.attributesService.addValue(id, dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ATTRIBUTES_MANAGE')
  @Patch('values/:valueId')
  async updateValue(
    @Param('valueId', ParseIntPipe) valueId: number,
    @Body() dto: Partial<CreateAttributeValueDto>,
    @CurrentStaff() staff: any,
  ) {
    return this.attributesService.updateValue(valueId, dto, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('ATTRIBUTES_MANAGE')
  @Delete('values/:valueId')
  async softDeleteValue(
    @Param('valueId', ParseIntPipe) valueId: number,
    @CurrentStaff() staff: any,
  ) {
    return this.attributesService.softDeleteValue(valueId, staff?.id);
  }
}
