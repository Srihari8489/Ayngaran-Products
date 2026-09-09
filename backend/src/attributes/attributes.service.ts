import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';

@Injectable()
export class AttributesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.attribute.findMany({
      include: {
        values: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { categoryAttributes: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const attribute = await this.prisma.client.attribute.findUnique({
      where: { id },
      include: {
        values: {
          orderBy: { sortOrder: 'asc' },
        },
        categoryAttributes: {
          include: { category: true },
        },
      },
    });

    if (!attribute) throw new NotFoundException(`Attribute with ID ${id} not found`);
    return attribute;
  }

  async create(dto: CreateAttributeDto, staffId?: number) {
    const existing = await this.prisma.raw.attribute.findFirst({
      where: { slug: dto.slug.trim().toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException(`Attribute with slug "${dto.slug}" already exists or is reserved.`);
    }

    const attribute = await this.prisma.client.attribute.create({
      data: {
        name: dto.name.trim(),
        slug: dto.slug.trim().toLowerCase(),
        dataType: dto.dataType,
        unit: dto.unit || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'CREATE_ATTRIBUTE',
        entityType: 'Attribute',
        entityId: String(attribute.id),
        newValueJson: JSON.stringify(attribute),
      },
    });

    return attribute;
  }

  async update(id: number, dto: UpdateAttributeDto, staffId?: number) {
    const existing = await this.prisma.client.attribute.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Attribute with ID ${id} not found`);

    const updated = await this.prisma.client.attribute.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.slug?.trim().toLowerCase(),
        dataType: dto.dataType,
        unit: dto.unit !== undefined ? dto.unit : existing.unit,
        isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'UPDATE_ATTRIBUTE',
        entityType: 'Attribute',
        entityId: String(id),
        oldValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async softDelete(id: number, staffId?: number) {
    const existing = await this.prisma.client.attribute.findUnique({
      where: { id },
      include: {
        categoryAttributes: true,
      },
    });

    if (!existing) throw new NotFoundException(`Attribute with ID ${id} not found`);

    if (existing.categoryAttributes.length > 0) {
      throw new BadRequestException(
        `Cannot delete attribute "${existing.name}" because it is mapped to ${existing.categoryAttributes.length} categories. Please unmap it first.`,
      );
    }

    return this.prisma.softDelete('Attribute', id, staffId);
  }

  async restore(id: number, staffId?: number) {
    return this.prisma.restore('Attribute', id, staffId);
  }

  // -------------------------------------------------------------
  // ATTRIBUTE VALUES MANAGEMENT
  // -------------------------------------------------------------

  async addValue(attributeId: number, dto: CreateAttributeValueDto, staffId?: number) {
    const attribute = await this.prisma.client.attribute.findUnique({ where: { id: attributeId } });
    if (!attribute) throw new NotFoundException(`Attribute with ID ${attributeId} not found`);

    const value = await this.prisma.client.attributeValue.create({
      data: {
        attributeId,
        value: dto.value.trim(),
        displayName: dto.displayName.trim(),
        sortOrder: dto.sortOrder || 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'CREATE_ATTRIBUTE_VALUE',
        entityType: 'AttributeValue',
        entityId: String(value.id),
        newValueJson: JSON.stringify(value),
      },
    });

    return value;
  }

  async updateValue(valueId: number, dto: Partial<CreateAttributeValueDto>, staffId?: number) {
    const existing = await this.prisma.client.attributeValue.findUnique({ where: { id: valueId } });
    if (!existing) throw new NotFoundException(`Attribute value with ID ${valueId} not found`);

    const updated = await this.prisma.client.attributeValue.update({
      where: { id: valueId },
      data: {
        value: dto.value?.trim(),
        displayName: dto.displayName?.trim(),
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'UPDATE_ATTRIBUTE_VALUE',
        entityType: 'AttributeValue',
        entityId: String(valueId),
        oldValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async softDeleteValue(valueId: number, staffId?: number) {
    return this.prisma.softDelete('AttributeValue', valueId, staffId);
  }
}
