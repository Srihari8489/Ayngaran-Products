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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';

@Controller('feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  // Public: Submit feedback
  @Post()
  async create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.create(dto);
  }

  // Public: Get approved feedbacks for storefront Home Page
  @Get('approved')
  async getApproved(@Query('limit') limit?: number) {
    return this.feedbackService.getApprovedFeedbacks(limit ? Number(limit) : 10);
  }

  // Admin: List all feedbacks with server-side pagination & search
  @UseGuards(StaffJwtAuthGuard)
  @Get('admin/all')
  async findAllAdmin(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.feedbackService.findAllAdmin({ status, search, page, limit });
  }

  // Admin: Update feedback status (APPROVED / PENDING / REJECTED)
  @UseGuards(StaffJwtAuthGuard)
  @Patch('admin/:id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.feedbackService.updateStatus(id, status);
  }

  // Admin: Delete feedback
  @UseGuards(StaffJwtAuthGuard)
  @Delete('admin/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackService.remove(id);
  }
}
