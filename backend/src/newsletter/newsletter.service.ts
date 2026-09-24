import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService) {}

  async subscribe(email: string) {
    if (!email || !email.trim()) {
      throw new BadRequestException('Email address is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new BadRequestException('Please provide a valid email address');
    }

    const existing = await this.prisma.client.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (!existing.isActive) {
        await this.prisma.client.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
      return {
        success: true,
        message: 'Welcome back! You are subscribed to our newsletter.',
        alreadySubscribed: true,
      };
    }

    const subscriber = await this.prisma.client.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        isActive: true,
      },
    });

    return {
      success: true,
      message: 'Thank you for subscribing! Check your inbox for updates.',
      subscriber,
    };
  }

  async findAll(query?: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.search && query.search.trim()) {
      where.email = { contains: query.search.trim().toLowerCase() };
    }

    const [items, total] = await Promise.all([
      this.prisma.client.newsletterSubscriber.findMany({
        where,
        orderBy: { subscribedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.client.newsletterSubscriber.count({ where }),
    ]);

    const [activeCount, totalAll] = await Promise.all([
      this.prisma.client.newsletterSubscriber.count({ where: { isActive: true } }),
      this.prisma.client.newsletterSubscriber.count(),
    ]);

    return createPaginatedResponse(items, total, page, limit, {
      totalAll,
      activeCount,
    });
  }

  async exportAll() {
    return this.prisma.client.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        subscribedAt: true,
      },
      orderBy: { subscribedAt: 'desc' },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.client.newsletterSubscriber.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Subscriber not found');
    }

    await this.prisma.client.newsletterSubscriber.delete({
      where: { id },
    });

    return { success: true, message: 'Subscriber removed successfully' };
  }
}
