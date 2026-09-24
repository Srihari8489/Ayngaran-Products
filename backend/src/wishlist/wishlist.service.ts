import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(userId: number) {
    const items = await this.prisma.client.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            brand: true,
            images: { orderBy: { sortOrder: 'asc' } },
            variants: {
              include: {
                variantValues: {
                  include: { attributeValue: true },
                },
              },
            },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: {
        ...item.product,
        basePrice: Number(item.product.basePrice),
        primaryImage: item.product.images?.[0]?.url || null,
      },
    }));
  }

  async addToWishlist(userId: number, productId: number) {
    // Verify product exists
    const product = await this.prisma.client.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Upsert to handle concurrent additions gracefully
    const item = await this.prisma.client.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      create: {
        userId,
        productId,
      },
      update: {},
      include: {
        product: {
          include: {
            brand: true,
            images: true,
          },
        },
      },
    });

    return {
      message: 'Product added to wishlist',
      item,
    };
  }

  async removeFromWishlist(userId: number, productId: number) {
    try {
      const deleted = await this.prisma.raw.wishlistItem.deleteMany({
        where: {
          userId,
          productId,
        },
      });
      if (deleted.count > 0) {
        return { message: 'Product removed from wishlist' };
      }
      return { message: 'Product not in wishlist' };
    } catch (err) {
      console.error('Failed to remove item from wishlist:', err);
      return { message: 'Failed to remove from wishlist' };
    }
  }

  async clearWishlist(userId: number) {
    try {
      await this.prisma.raw.wishlistItem.deleteMany({
        where: { userId },
      });
      return { message: 'Wishlist cleared successfully' };
    } catch (err) {
      console.error('Failed to clear wishlist:', err);
      return { message: 'Failed to clear wishlist' };
    }
  }

  // Admin view to see who has saved which products
  async getAllWishlists() {
    const items = await this.prisma.client.wishlistItem.findMany({
      include: {
        user: {
          select: {
            id: true,
            userCode: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      user: item.user,
      product: {
        ...item.product,
        basePrice: Number(item.product.basePrice),
      },
      createdAt: item.createdAt,
    }));
  }
}
