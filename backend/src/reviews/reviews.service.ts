import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // CUSTOMER REVIEW SUBMISSION (Verified Purchase Rule)
  // -------------------------------------------------------------

  async create(userId: number, dto: CreateReviewDto) {
    // 1. Enforce Verified Purchase Rule:
    // User must have an order containing this product that is paid/confirmed or delivered
    const purchasedOrder = await this.prisma.client.order.findFirst({
      where: {
        id: dto.orderId,
        userId,
        orderStatus: { notIn: ['CANCELLED', 'PENDING'] },
        items: {
          some: { productId: dto.productId },
        },
      },
    });

    if (!purchasedOrder) {
      throw new ForbiddenException(
        'Only customers who have purchased and confirmed this product can leave a verified review.',
      );
    }

    // Check duplicate review
    const existingReview = await this.prisma.raw.review.findFirst({
      where: {
        userId,
        orderId: dto.orderId,
        productId: dto.productId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already submitted a review for this purchase.');
    }

    const review = await this.prisma.client.review.create({
      data: {
        userId,
        productId: dto.productId,
        orderId: dto.orderId,
        rating: dto.rating,
        title: dto.title.trim(),
        comment: dto.comment.trim(),
        status: 'APPROVED', // Default to approved (can be moderated by admin)
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return review;
  }

  async getProductReviews(productId: number) {
    const reviews = await this.prisma.client.review.findMany({
      where: {
        productId,
        status: 'APPROVED',
      },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    }

    const avgRating =
      reviews.length > 0 ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length : 0;

    return {
      reviews,
      totalReviews: reviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
      ratingDistribution,
    };
  }

  // -------------------------------------------------------------
  // ADMIN MODERATION
  // -------------------------------------------------------------

  async getAdminReviews(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.client.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, productCode: true } },
        order: { select: { id: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderateReview(reviewId: number, status: 'APPROVED' | 'REJECTED', staffId?: number) {
    const existing = await this.prisma.client.review.findUnique({ where: { id: reviewId } });
    if (!existing) throw new NotFoundException('Review not found');

    const updated = await this.prisma.client.review.update({
      where: { id: reviewId },
      data: { status },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'MODERATE_REVIEW',
        entityType: 'Review',
        entityId: String(reviewId),
        oldValueJson: JSON.stringify({ status: existing.status }),
        newValueJson: JSON.stringify({ status: updated.status }),
      },
    });

    return updated;
  }

  async softDelete(reviewId: number, staffId?: number) {
    return this.prisma.softDelete('Review', reviewId, staffId);
  }
}
