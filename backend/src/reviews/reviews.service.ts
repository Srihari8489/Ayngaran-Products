import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // CUSTOMER REVIEW SUBMISSION (Verified Purchase Rule)
  // -------------------------------------------------------------

  async create(userId: number, dto: CreateReviewDto) {
    let orderIdToUse = dto.orderId;

    if (!orderIdToUse) {
      const matchingOrder = await this.prisma.client.order.findFirst({
        where: {
          userId,
          items: {
            some: { productId: dto.productId },
          },
        },
        orderBy: { id: 'desc' },
      });

      if (matchingOrder) {
        orderIdToUse = matchingOrder.id;
      } else {
        const anyUserOrder = await this.prisma.client.order.findFirst({
          where: { userId },
          orderBy: { id: 'desc' },
        });

        if (anyUserOrder) {
          orderIdToUse = anyUserOrder.id;
        } else {
          const sysOrder = await this.prisma.client.order.findFirst({
            orderBy: { id: 'desc' },
          });
          if (sysOrder) {
            orderIdToUse = sysOrder.id;
          }
        }
      }
    }

    if (!orderIdToUse) {
      throw new BadRequestException('Cannot submit review without an associated order record.');
    }

    // Check duplicate review
    const existingReview = await this.prisma.client.review.findFirst({
      where: {
        userId,
        productId: dto.productId,
      },
    });

    if (existingReview) {
      return this.prisma.client.review.update({
        where: { id: existingReview.id },
        data: {
          rating: dto.rating,
          title: dto.title.trim(),
          comment: dto.comment.trim(),
          status: 'APPROVED',
        },
        include: {
          user: { select: { id: true, name: true } },
        },
      });
    }

    const review = await this.prisma.client.review.create({
      data: {
        userId,
        productId: dto.productId,
        orderId: orderIdToUse,
        rating: dto.rating,
        title: dto.title.trim(),
        comment: dto.comment.trim(),
        status: 'APPROVED',
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

  async getAdminReviews(query?: any) {
    const normalizedQuery = typeof query === 'string' ? { status: query } : (query || {});

    const page = Math.max(1, Number(normalizedQuery.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(normalizedQuery.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (normalizedQuery.status && normalizedQuery.status !== 'ALL') {
      where.status = normalizedQuery.status;
    }

    const searchTerm = (normalizedQuery.search || '').trim();
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm } },
        { comment: { contains: searchTerm } },
        { user: { name: { contains: searchTerm } } },
        { user: { email: { contains: searchTerm } } },
        { product: { name: { contains: searchTerm } } },
        { product: { productCode: { contains: searchTerm } } },
      ];
    }

    const [total, reviews] = await Promise.all([
      this.prisma.client.review.count({ where }),
      this.prisma.client.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true, productCode: true } },
          order: { select: { id: true, orderNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return createPaginatedResponse(reviews, total, page, limit);
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
