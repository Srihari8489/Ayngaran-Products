import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryPartnerDto } from './dto/create-delivery-partner.dto';

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.deliveryPartner.findMany({
      include: {
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const partner = await this.prisma.client.deliveryPartner.findUnique({
      where: { id },
      include: {
        assignments: {
          take: 20,
          orderBy: { assignedAt: 'desc' },
          include: { order: { select: { orderNumber: true, totalAmount: true } } },
        },
      },
    });

    if (!partner) throw new NotFoundException('Delivery partner not found');
    return partner;
  }

  async create(dto: CreateDeliveryPartnerDto, staffId?: number) {
    const existing = await this.prisma.raw.deliveryPartner.findFirst({
      where: { partnerCode: dto.partnerCode.trim() },
    });

    if (existing) {
      throw new BadRequestException(`Partner code "${dto.partnerCode}" is already reserved or exists.`);
    }

    const partner = await this.prisma.client.deliveryPartner.create({
      data: {
        partnerCode: dto.partnerCode.trim(),
        name: dto.name.trim(),
        contactPhone: dto.contactPhone || null,
        contactEmail: dto.contactEmail || null,
        trackingUrlTemplate: dto.trackingUrlTemplate || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'CREATE_DELIVERY_PARTNER',
        entityType: 'DeliveryPartner',
        entityId: String(partner.id),
        newValueJson: JSON.stringify(partner),
      },
    });

    return partner;
  }

  async update(id: number, dto: Partial<CreateDeliveryPartnerDto>, staffId?: number) {
    const existing = await this.prisma.client.deliveryPartner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Delivery partner not found');

    const updated = await this.prisma.client.deliveryPartner.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        trackingUrlTemplate: dto.trackingUrlTemplate,
        isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'UPDATE_DELIVERY_PARTNER',
        entityType: 'DeliveryPartner',
        entityId: String(id),
        oldValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async softDelete(id: number, staffId?: number) {
    return this.prisma.softDelete('DeliveryPartner', id, staffId);
  }
}
