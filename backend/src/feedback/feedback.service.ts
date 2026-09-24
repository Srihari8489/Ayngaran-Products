import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  // Initial seed feedbacks to ensure the storefront is lively on launch
  private readonly defaultSeedFeedbacks = [
    {
      name: 'Senthil Kumar',
      email: 'senthil.k@gmail.com',
      rating: 5,
      feedback:
        'Excellent service and prompt delivery. The packaging was eco-friendly and clean. Will order again.',
      status: 'APPROVED',
    },
    {
      name: 'Meera Raghavan',
      email: 'meera.raghavan@yahoo.com',
      rating: 5,
      feedback:
        'Great initiative bringing back traditional healthy grains! U-Malt has become a part of our morning routine.',
      status: 'APPROVED',
    },
    {
      name: 'Ananya Sundaram',
      email: 'ananya.s@outlook.com',
      rating: 5,
      feedback:
        'Pure homemade taste without any chemical preservatives. The cold-pressed oils and herbal health mixes remind me of my grandmother recipes.',
      status: 'APPROVED',
    },
    {
      name: 'Karthik Raja',
      email: 'karthik.raja@gmail.com',
      rating: 5,
      feedback:
        'Fast shipping and authentic quality. Customer support was also very helpful when I asked about usage instructions.',
      status: 'APPROVED',
    },
  ];

  async create(dto: CreateFeedbackDto) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Full name is required');
    }
    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException('Email address is required');
    }
    if (!dto.feedback || !dto.feedback.trim()) {
      throw new BadRequestException('Feedback text is required');
    }

    const rating = Math.min(5, Math.max(1, Number(dto.rating) || 5));

    return this.prisma.client.customerFeedback.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        rating,
        feedback: dto.feedback.trim(),
        status: 'APPROVED',
      },
    });
  }

  async getApprovedFeedbacks(limit = 10) {
    let list = await this.prisma.client.customerFeedback.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (list.length === 0) {
      // Auto-seed defaults into DB so they become persistent
      for (const item of this.defaultSeedFeedbacks) {
        await this.prisma.client.customerFeedback.create({ data: item });
      }
      list = await this.prisma.client.customerFeedback.findMany({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    }

    return list;
  }

  async findAllAdmin(query?: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query?.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s } },
        { email: { contains: s } },
        { feedback: { contains: s } },
      ];
    }

    const [total, feedbacks] = await Promise.all([
      this.prisma.client.customerFeedback.count({ where }),
      this.prisma.client.customerFeedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return createPaginatedResponse(feedbacks, total, page, limit);
  }

  async updateStatus(id: number, status: string) {
    const existing = await this.prisma.client.customerFeedback.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Feedback not found');
    }

    return this.prisma.client.customerFeedback.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.client.customerFeedback.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Feedback not found');
    }

    await this.prisma.client.customerFeedback.delete({ where: { id } });
    return { success: true, message: 'Feedback deleted successfully' };
  }
}
