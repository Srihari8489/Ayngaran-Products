import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { StaffJwtAuthGuard } from '../common/guards/staff-jwt-auth.guard';

@Controller('newsletter')
export class NewsletterController {
  constructor(private newsletterService: NewsletterService) {}

  // Public subscription endpoint from Footer
  @Post('subscribe')
  async subscribe(@Body('email') email: string) {
    return this.newsletterService.subscribe(email);
  }

  // Admin: List all subscribers with pagination & search
  @UseGuards(StaffJwtAuthGuard)
  @Get('subscribers')
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.newsletterService.findAll({ search, page, limit });
  }

  // Admin: Export all active subscribers
  @UseGuards(StaffJwtAuthGuard)
  @Get('export')
  async exportAll() {
    return this.newsletterService.exportAll();
  }

  // Admin: Remove a subscriber
  @UseGuards(StaffJwtAuthGuard)
  @Delete('subscribers/:id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.newsletterService.remove(id);
  }
}
