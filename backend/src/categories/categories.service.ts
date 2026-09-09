import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MapCategoryAttributeDto } from './dto/map-category-attribute.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // HIERARCHICAL TREE & BREADCRUMBS
  // -------------------------------------------------------------

  async getCategoryTree() {
    // Normal query automatically excludes soft-deleted records
    const allCategories = await this.prisma.client.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const categoryMap = new Map<number, any>();
    const rootCategories: any[] = [];

    // Initialize nodes
    for (const cat of allCategories) {
      categoryMap.set(cat.id, { ...cat, children: [] });
    }

    // Build hierarchy using self-referencing parentId
    for (const cat of allCategories) {
      const node = categoryMap.get(cat.id);
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId).children.push(node);
      } else {
        rootCategories.push(node);
      }
    }

    return rootCategories;
  }

  async getBreadcrumbs(categoryId: number) {
    const breadcrumbs: any[] = [];
    let currentId: number | null = categoryId;

    while (currentId !== null) {
      const cat = await this.prisma.client.category.findUnique({
        where: { id: currentId },
      });

      if (!cat) break;

      breadcrumbs.unshift({
        id: cat.id,
        categoryCode: cat.categoryCode,
        name: cat.name,
        slug: cat.slug,
      });

      currentId = cat.parentId;
    }

    return breadcrumbs;
  }

  // -------------------------------------------------------------
  // ATTRIBUTE INHERITANCE RESOLUTION ENGINE
  // -------------------------------------------------------------

  async getInheritedAttributes(categoryId: number) {
    const targetCategory = await this.prisma.client.category.findUnique({
      where: { id: categoryId },
    });

    if (!targetCategory) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    // 1. Traverse ancestry chain from current category up to the root parent
    const ancestryChain: { id: number; name: string }[] = [];
    let currentId: number | null = categoryId;

    while (currentId !== null) {
      const cat = await this.prisma.client.category.findUnique({
        where: { id: currentId },
      });
      if (!cat) break;
      ancestryChain.push({ id: cat.id, name: cat.name });
      currentId = cat.parentId;
    }

    // Root-first order (e.g., Electronics -> Mobiles -> Android Phones)
    const rootToLeaf = ancestryChain.reverse();

    // 2. Collect attributes level by level, allowing child categories to override parent settings
    // Key: attributeId, Value: resolved attribute metadata
    const resolvedAttributes = new Map<number, any>();

    for (const levelCat of rootToLeaf) {
      const mappings = await this.prisma.client.categoryAttribute.findMany({
        where: { categoryId: levelCat.id },
        include: {
          attribute: {
            include: {
              values: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      for (const m of mappings) {
        const isInherited = levelCat.id !== categoryId;
        resolvedAttributes.set(m.attributeId, {
          id: m.attribute.id,
          attributeId: m.attribute.id,
          name: m.attribute.name,
          slug: m.attribute.slug,
          dataType: m.attribute.dataType,
          unit: m.attribute.unit,
          isRequired: m.isRequired,
          isFilterable: m.isFilterable,
          isVariant: m.isVariant,
          sortOrder: m.sortOrder,
          sourceCategoryId: levelCat.id,
          sourceCategoryName: levelCat.name,
          isInherited,
          values: m.attribute.values.map((v) => ({
            id: v.id,
            value: v.value,
            displayName: v.displayName,
            sortOrder: v.sortOrder,
          })),
        });
      }
    }

    return Array.from(resolvedAttributes.values());
  }

  // -------------------------------------------------------------
  // CRUD OPERATIONS
  // -------------------------------------------------------------

  async findAll() {
    return this.prisma.client.category.findMany({
      include: {
        parent: { select: { id: true, name: true, categoryCode: true } },
        _count: { select: { products: true, children: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: number) {
    const cat = await this.prisma.client.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        categoryAttributes: {
          include: { attribute: true },
        },
      },
    });

    if (!cat) throw new NotFoundException(`Category with ID ${id} not found`);
    return cat;
  }

  async create(dto: CreateCategoryDto, staffId?: number) {
    // Autogenerate categoryCode if not provided
    let finalCategoryCode = dto.categoryCode?.trim().toUpperCase();
    if (!finalCategoryCode) {
      const prefix = dto.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4) || 'CAT';
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        finalCategoryCode = `CAT-${prefix}-${rand}`;
        const existingCode = await this.prisma.raw.category.findFirst({
          where: { categoryCode: finalCategoryCode },
        });
        if (!existingCode) isUnique = true;
        attempts++;
      }
    } else {
      // Check uniqueness across both active and soft-deleted records (reserved identifiers!)
      const existingCode = await this.prisma.raw.category.findFirst({
        where: { categoryCode: finalCategoryCode },
      });
      if (existingCode) {
        throw new BadRequestException(
          `Category code ${finalCategoryCode} is already reserved or exists.`,
        );
      }
    }

    const existingSlug = await this.prisma.raw.category.findFirst({
      where: { slug: dto.slug.trim().toLowerCase() },
    });
    if (existingSlug) {
      throw new BadRequestException(`Category slug ${dto.slug} is already taken.`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.client.category.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) throw new BadRequestException(`Parent category ID ${dto.parentId} not found`);
    }

    const category = await this.prisma.client.category.create({
      data: {
        categoryCode: finalCategoryCode!,
        name: dto.name.trim(),
        slug: dto.slug.trim().toLowerCase(),
        description: dto.description || null,
        image: dto.image || null,
        parentId: dto.parentId || null,
        sortOrder: dto.sortOrder || 0,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    // Write audit log
    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'CREATE_CATEGORY',
        entityType: 'Category',
        entityId: String(category.id),
        newValueJson: JSON.stringify(category),
      },
    });

    return category;
  }

  async update(id: number, dto: UpdateCategoryDto, staffId?: number) {
    const existing = await this.prisma.client.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Category with ID ${id} not found`);

    if (dto.parentId === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    const updated = await this.prisma.client.category.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.slug?.trim().toLowerCase(),
        description: dto.description,
        image: dto.image,
        parentId: dto.parentId !== undefined ? dto.parentId : existing.parentId,
        sortOrder: dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder,
        isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
      },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'UPDATE_CATEGORY',
        entityType: 'Category',
        entityId: String(id),
        oldValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(updated),
      },
    });

    return updated;
  }

  async mapAttribute(categoryId: number, dto: MapCategoryAttributeDto, staffId?: number) {
    const category = await this.prisma.client.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new NotFoundException(`Category with ID ${categoryId} not found`);

    const attribute = await this.prisma.client.attribute.findUnique({ where: { id: dto.attributeId } });
    if (!attribute) throw new NotFoundException(`Attribute with ID ${dto.attributeId} not found`);

    const mapping = await this.prisma.client.categoryAttribute.upsert({
      where: {
        categoryId_attributeId: {
          categoryId,
          attributeId: dto.attributeId,
        },
      },
      update: {
        isRequired: dto.isRequired ?? false,
        isFilterable: dto.isFilterable ?? true,
        isVariant: dto.isVariant ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
      create: {
        categoryId,
        attributeId: dto.attributeId,
        isRequired: dto.isRequired ?? false,
        isFilterable: dto.isFilterable ?? true,
        isVariant: dto.isVariant ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: { attribute: true },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'MAP_CATEGORY_ATTRIBUTE',
        entityType: 'CategoryAttribute',
        entityId: `${categoryId}_${dto.attributeId}`,
        newValueJson: JSON.stringify(mapping),
      },
    });

    return mapping;
  }

  async unmapAttribute(categoryId: number, attributeId: number, staffId?: number) {
    const mapping = await this.prisma.client.categoryAttribute.findUnique({
      where: {
        categoryId_attributeId: {
          categoryId,
          attributeId,
        },
      },
    });

    if (!mapping) {
      throw new NotFoundException(`Attribute mapping for Category ${categoryId} and Attribute ${attributeId} not found`);
    }

    await this.prisma.raw.categoryAttribute.delete({
      where: { id: mapping.id },
    });

    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'UNMAP_CATEGORY_ATTRIBUTE',
        entityType: 'CategoryAttribute',
        entityId: `${categoryId}_${attributeId}`,
        oldValueJson: JSON.stringify(mapping),
      },
    });

    return { message: 'Attribute unmapped successfully' };
  }

  async softDelete(id: number, staffId?: number) {
    const category = await this.prisma.client.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
      },
    });

    if (!category) throw new NotFoundException(`Category with ID ${id} not found`);

    if (category.children.length > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it contains ${category.children.length} subcategories. Please delete or reassign them first.`,
      );
    }

    if (category.products.length > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it contains ${category.products.length} active products.`,
      );
    }

    return this.prisma.softDelete('Category', id, staffId);
  }

  async restore(id: number, staffId?: number) {
    return this.prisma.restore('Category', id, staffId);
  }
}
