import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: any) {
    const page = Math.max(1, parseInt(query?.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query?.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.status === 'ACTIVE') where.isActive = true;
    else if (query?.status === 'INACTIVE') where.isActive = false;

    if (query?.search) {
      const s = String(query.search).trim();
      where.OR = [
        { name: { contains: s } },
        { email: { contains: s } },
        { phone: { contains: s } },
        { userCode: { contains: s } },
      ];
    }

    const [users, total, totalAll, activeCount] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              orders: true,
              reviews: true,
              addresses: true,
            },
          },
          orders: {
            where: {
              paymentStatus: 'PAID',
            },
            select: {
              totalAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.user.count({ where }),
      this.prisma.client.user.count(),
      this.prisma.client.user.count({ where: { isActive: true } }),
    ]);

    const items = users.map((u) => {
      const totalSpent = u.orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      return {
        id: u.id,
        userCode: u.userCode,
        name: u.name || 'Unnamed Customer',
        email: u.email || null,
        phone: u.phone || null,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        orderCount: u._count.orders,
        reviewCount: u._count.reviews,
        addressCount: u._count.addresses,
        totalSpent: Math.round(totalSpent * 100) / 100,
      };
    });

    return createPaginatedResponse(items, total, page, limit, {
      totalAll,
      activeCount,
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      include: {
        addresses: {
          orderBy: { isDefault: 'desc' },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              take: 3,
            },
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException(`Customer #${id} not found`);

    const paidOrders = await this.prisma.client.order.findMany({
      where: { userId: id, paymentStatus: 'PAID' },
      select: { totalAmount: true },
    });
    const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    return {
      id: user.id,
      userCode: user.userCode,
      name: user.name || 'Unnamed Customer',
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      orderCount: user._count.orders,
      reviewCount: user._count.reviews,
      addressCount: user._count.addresses,
      totalSpent: Math.round(totalSpent * 100) / 100,
      addresses: user.addresses,
      recentOrders: user.orders,
    };
  }

  async toggleStatus(id: number, isActive: boolean, staffId?: number) {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
    });
    if (!user) throw new NotFoundException(`Customer #${id} not found`);

    const updated = await this.prisma.client.user.update({
      where: { id },
      data: { isActive },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: isActive ? 'CUSTOMER_ACTIVATE' : 'CUSTOMER_DEACTIVATE',
        entityType: 'User',
        entityId: String(id),
        oldValueJson: JSON.stringify({ isActive: user.isActive }),
        newValueJson: JSON.stringify({ isActive }),
      },
    });

    return updated;
  }
}
