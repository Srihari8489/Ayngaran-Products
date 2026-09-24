import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@CurrentUser() user: any) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Post(':productId')
  async addToWishlist(
    @CurrentUser() user: any,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.addToWishlist(user.id, productId);
  }

  @Delete(':productId')
  async removeFromWishlist(
    @CurrentUser() user: any,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.wishlistService.removeFromWishlist(user.id, productId);
  }

  @Delete()
  async clearWishlist(@CurrentUser() user: any) {
    return this.wishlistService.clearWishlist(user.id);
  }

  @Get('admin/all')
  async getAllWishlists() {
    return this.wishlistService.getAllWishlists();
  }
}
