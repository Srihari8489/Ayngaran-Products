import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@UseGuards(StaffJwtAuthGuard)
@Controller('admin/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@Query() query?: any) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/status')
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
    @CurrentStaff() staff: any,
  ) {
    return this.usersService.toggleStatus(id, isActive, staff?.id);
  }
}
