import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const isPaginated = query && (query.page !== undefined || query.limit !== undefined || query.search !== undefined || query.entityType !== undefined || query.staffId !== undefined);
    const page = Math.max(1, parseInt(query?.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query?.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.staffId) where.staffId = Number(query.staffId);
    if (query?.entityType && query.entityType !== 'ALL') where.entityType = query.entityType;

    if (query?.search) {
      const s = String(query.search).trim();
      where.OR = [
        { action: { contains: s } },
        { entityType: { contains: s } },
        { entityId: { contains: s } },
        { staff: { is: { name: { contains: s } } } },
        { staff: { is: { email: { contains: s } } } },
        { staff: { is: { staffCode: { contains: s } } } },
      ];
    }

    const include = {
      staff: { select: { id: true, name: true, email: true, staffCode: true } },
    };

    if (!isPaginated) {
      return this.prisma.raw.auditLog.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
      });
    }

    const [items, total] = await Promise.all([
      this.prisma.raw.auditLog.findMany({
        where,
        skip,
        take: limit,
        include,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.raw.auditLog.count({ where }),
    ]);

    return createPaginatedResponse(items, total, page, limit);
  }
}
