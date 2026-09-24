import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createPaginatedResponse } from '../common/utils/pagination.util';

export interface CreateInquiryDto {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInquiryDto) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Full name is required');
    }
    if (!dto.email || !dto.email.trim()) {
      throw new BadRequestException('Email address is required');
    }
    if (!dto.message || !dto.message.trim()) {
      throw new BadRequestException('Message is required');
    }

    return this.prisma.client.contactInquiry.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone ? dto.phone.trim() : null,
        subject: dto.subject ? dto.subject.trim() : 'General Inquiry',
        message: dto.message.trim(),
        status: 'PENDING',
      },
    });
  }

  async findAll(query?: { status?: string; search?: string; page?: number; limit?: number }) {
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
        { phone: { contains: s } },
        { subject: { contains: s } },
        { message: { contains: s } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.contactInquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.client.contactInquiry.count({ where }),
    ]);

    const [pendingCount, resolvedCount, totalAll] = await Promise.all([
      this.prisma.client.contactInquiry.count({ where: { status: 'PENDING' } }),
      this.prisma.client.contactInquiry.count({ where: { status: 'RESOLVED' } }),
      this.prisma.client.contactInquiry.count(),
    ]);

    return createPaginatedResponse(items, total, page, limit, {
      totalAll,
      pendingCount,
      resolvedCount,
    });
  }

  async updateStatus(id: number, status: string, notes?: string) {
    const existing = await this.prisma.client.contactInquiry.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Inquiry not found');
    }

    return this.prisma.client.contactInquiry.update({
      where: { id },
      data: {
        status: status === 'RESOLVED' ? 'RESOLVED' : 'PENDING',
        ...(notes !== undefined ? { notes } : {}),
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.client.contactInquiry.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Inquiry not found');
    }

    await this.prisma.client.contactInquiry.delete({
      where: { id },
    });

    return { success: true, message: 'Inquiry deleted successfully' };
  }
}
