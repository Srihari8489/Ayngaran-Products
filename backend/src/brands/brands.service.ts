import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.brand.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const brand = await this.prisma.client.brand.findUnique({
      where: { id },
      include: {
        products: {
          take: 10,
          select: { id: true, name: true, productCode: true, basePrice: true },
        },
      },
    });

    if (!brand) throw new NotFoundException(`Brand with ID ${id} not found`);
    return brand;
  }

  async create(dto: CreateBrandDto, staffId?: number) {
    let finalBrandCode = dto.brandCode?.trim().toUpperCase();
    if (!finalBrandCode) {
      const prefix = dto.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4) || 'BRD';
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        finalBrandCode = `BRD-${prefix}-${rand}`;
        const exists = await this.prisma.raw.brand.findFirst({
          where: { brandCode: finalBrandCode },
        });
        if (!exists) isUnique = true;
        attempts++;
      }
    } else {
      const existingCode = await this.prisma.raw.brand.findFirst({
        where: { brandCode: finalBrandCode },
      });

      if (existingCode) {
        throw new BadRequestException(`Brand code ${finalBrandCode} is already reserved or exists.`);
      }
    }

    const existingSlug = await this.prisma.raw.brand.findFirst({
      where: { slug: dto.slug.trim().toLowerCase() },
    });

    if (existingSlug) {
      throw new BadRequestException(`Brand slug "${dto.slug}" is already taken.`);
    }

    const brand = await this.prisma.client.brand.create({
      data: {
        brandCode: finalBrandCode!,
        name: dto.name.trim(),
        slug: dto.slug.trim().toLowerCase(),
        description: dto.description || null,
        logo: dto.logo || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'CREATE_BRAND',
        entityType: 'Brand',
        entityId: String(brand.id),
        newValueJson: JSON.stringify(brand),
      },
    });

    return brand;
  }

  async update(id: number, dto: UpdateBrandDto, staffId?: number) {
    const existing = await this.prisma.client.brand.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Brand with ID ${id} not found`);

    const updated = await this.prisma.client.brand.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.slug?.trim().toLowerCase(),
        description: dto.description,
        logo: dto.logo,
        isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'UPDATE_BRAND',
        entityType: 'Brand',
        entityId: String(id),
        oldValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async softDelete(id: number, staffId?: number) {
    const existing = await this.prisma.client.brand.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!existing) throw new NotFoundException(`Brand with ID ${id} not found`);

    if (existing.products.length > 0) {
      throw new BadRequestException(
        `Cannot delete brand "${existing.name}" because it has ${existing.products.length} associated products.`,
      );
    }

    return this.prisma.softDelete('Brand', id, staffId);
  }

  async restore(id: number, staffId?: number) {
    return this.prisma.restore('Brand', id, staffId);
  }
}
