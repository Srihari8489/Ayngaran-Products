import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { staffId?: string; entityType?: string; limit?: string }) {
    const where: any = {};
    if (query.staffId) where.staffId = Number(query.staffId);
    if (query.entityType) where.entityType = query.entityType;

    const limit = Math.min(100, Number(query.limit) || 50);

    return this.prisma.raw.auditLog.findMany({
      where,
      include: {
        staff: { select: { id: true, name: true, email: true, staffCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
