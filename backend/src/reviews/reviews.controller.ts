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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentStaff } from '../common/decorators/current-staff.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, dto);
  }

  @Get('product/:productId')
  async getProductReviews(@Param('productId', ParseIntPipe) productId: number) {
    return this.reviewsService.getProductReviews(productId);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('REVIEWS_MODERATE')
  @Get('admin/all')
  async getAdminReviews(@Query('status') status?: string) {
    return this.reviewsService.getAdminReviews(status);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('REVIEWS_MODERATE')
  @Patch('admin/:id/moderate')
  async moderateReview(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @CurrentStaff() staff: any,
  ) {
    return this.reviewsService.moderateReview(id, status, staff?.id);
  }

  @UseGuards(StaffJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('REVIEWS_MODERATE')
  @Delete('admin/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number, @CurrentStaff() staff: any) {
    return this.reviewsService.softDelete(id, staff?.id);
  }
}
