import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { InquiriesService, CreateInquiryDto } from './inquiries.service';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';

@Controller('inquiries')
export class InquiriesController {
  constructor(private inquiriesService: InquiriesService) {}

  // Public submission endpoint from Contact Us page
  @Post()
  async create(@Body() dto: CreateInquiryDto) {
    return this.inquiriesService.create(dto);
  }

  // Admin: List all inquiries with filters & search
  @UseGuards(StaffJwtAuthGuard)
  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inquiriesService.findAll({ status, search, page, limit });
  }

  // Admin: Update status (PENDING / RESOLVED) & notes
  @UseGuards(StaffJwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.inquiriesService.updateStatus(id, status, notes);
  }

  // Admin: Delete inquiry
  @UseGuards(StaffJwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.inquiriesService.remove(id);
  }
}
