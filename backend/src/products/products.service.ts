import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private categoriesService: CategoriesService,
  ) {}

  // -------------------------------------------------------------
  // DYNAMIC FILTER ENGINE (Database-driven, Zero Hardcoding)
  // -------------------------------------------------------------

  async getCategoryFilters(categoryId: number) {
    // 1. Get all descendant category IDs (recursive)
    const categoryIds = await this.getAllDescendantCategoryIds(categoryId);

    // 2. Fetch all inherited filterable attributes
    const inheritedAttributes = await this.categoriesService.getInheritedAttributes(categoryId);
    const filterableAttrs = inheritedAttributes.filter((a) => a.isFilterable);

    // 3. Aggregate Brands in this category
    const productsInCategory = await this.prisma.client.product.findMany({
      where: {
        categoryId: { in: categoryIds },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        basePrice: true,
        brand: { select: { id: true, name: true, slug: true } },
        attributeValues: {
          select: {
            attributeId: true,
            attributeValueId: true,
            valueText: true,
            valueNumber: true,
            valueBoolean: true,
            attributeValue: { select: { value: true, displayName: true } },
          },
        },
        variants: {
          select: {
            price: true,
            variantValues: {
              select: {
                attributeId: true,
                attributeValueId: true,
                attributeValue: { select: { value: true, displayName: true } },
              },
            },
          },
        },
      },
    });

    // Compute Price Range
    let minPrice = Infinity;
    let maxPrice = 0;
    const brandFacetMap = new Map<number, { id: number; name: string; slug: string; count: number }>();

    for (const p of productsInCategory) {
      const pPrice = Number(p.basePrice);
      if (pPrice < minPrice) minPrice = pPrice;
      if (pPrice > maxPrice) maxPrice = pPrice;

      for (const v of p.variants) {
        const vPrice = Number(v.price);
        if (vPrice < minPrice) minPrice = vPrice;
        if (vPrice > maxPrice) maxPrice = vPrice;
      }

      const bId = p.brand.id;
      if (!brandFacetMap.has(bId)) {
        brandFacetMap.set(bId, { id: p.brand.id, name: p.brand.name, slug: p.brand.slug, count: 0 });
      }
      brandFacetMap.get(bId)!.count++;
    }

    if (minPrice === Infinity) minPrice = 0;

    // Compute Attribute Facets
    const dynamicAttributeFacets = filterableAttrs.map((attr) => {
      const valueCountMap = new Map<string, { value: string; displayName: string; count: number }>();

      // Prepopulate known values
      for (const val of attr.values) {
        valueCountMap.set(val.value, { value: val.value, displayName: val.displayName, count: 0 });
      }

      // Count occurrences in category products
      for (const p of productsInCategory) {
        // Check product specs
        for (const pav of p.attributeValues) {
          if (pav.attributeId === attr.id) {
            const valStr = pav.attributeValue?.value || pav.valueText || String(pav.valueNumber || pav.valueBoolean || '');
            if (valStr) {
              if (!valueCountMap.has(valStr)) {
                valueCountMap.set(valStr, { value: valStr, displayName: valStr, count: 0 });
              }
              valueCountMap.get(valStr)!.count++;
            }
          }
        }

        // Check variant specs
        for (const v of p.variants) {
          for (const vav of v.variantValues) {
            if (vav.attributeId === attr.id && vav.attributeValue) {
              const valStr = vav.attributeValue.value;
              if (valueCountMap.has(valStr)) {
                valueCountMap.get(valStr)!.count++;
              }
            }
          }
        }
      }

      return {
        id: attr.id,
        name: attr.name,
        slug: attr.slug,
        dataType: attr.dataType,
        unit: attr.unit,
        isVariant: attr.isVariant,
        options: Array.from(valueCountMap.values()).filter((opt) => opt.count > 0 || attr.values.length > 0),
      };
    });

    return {
      priceRange: {
        min: minPrice,
        max: maxPrice,
      },
      brands: Array.from(brandFacetMap.values()),
      attributes: dynamicAttributeFacets,
    };
  }

  // Helper to fetch category and all child category IDs recursively
  private async getAllDescendantCategoryIds(categoryId: number): Promise<number[]> {
    const ids = [categoryId];
    const children = await this.prisma.client.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });

    for (const child of children) {
      const subIds = await this.getAllDescendantCategoryIds(child.id);
      ids.push(...subIds);
    }
    return ids;
  }

  // -------------------------------------------------------------
  // CATALOG SEARCH & LISTING
  // -------------------------------------------------------------

  async findAll(query: QueryProductsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
    };

    // 1. Category Filter (including subcategories)
    if (query.categoryId) {
      const catId = Number(query.categoryId);
      const allCatIds = await this.getAllDescendantCategoryIds(catId);
      where.categoryId = { in: allCatIds };
    }

    // 2. Brand Filter
    if (query.brandId) {
      where.brandId = Number(query.brandId);
    }

    // 3. Price Filter
    if (query.minPrice || query.maxPrice) {
      where.basePrice = {};
      if (query.minPrice) where.basePrice.gte = Number(query.minPrice);
      if (query.maxPrice) where.basePrice.lte = Number(query.maxPrice);
    }

    // 4. Text Search
    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q } },
        { productCode: { contains: q } },
        { description: { contains: q } },
        { brand: { name: { contains: q } } },
      ];
    }

    // 5. Dynamic Attributes Filter
    if (query.attrs) {
      try {
        const parsedAttrs: Record<string, string> = JSON.parse(query.attrs);
        const attributeConditions: any[] = [];

        for (const [slug, val] of Object.entries(parsedAttrs)) {
          attributeConditions.push({
            OR: [
              // Matches product attribute value
              {
                attributeValues: {
                  some: {
                    attribute: { slug },
                    OR: [
                      { attributeValue: { value: val } },
                      { valueText: val },
                    ],
                  },
                },
              },
              // Matches variant attribute value
              {
                variants: {
                  some: {
                    variantValues: {
                      some: {
                        attribute: { slug },
                        attributeValue: { value: val },
                      },
                    },
                  },
                },
              },
            ],
          });
        }

        if (attributeConditions.length > 0) {
          where.AND = attributeConditions;
        }
      } catch (e) {
        // Ignore invalid JSON in attrs
      }
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { basePrice: 'asc' };
    if (query.sort === 'price_desc') orderBy = { basePrice: 'desc' };
    if (query.sort === 'newest') orderBy = { createdAt: 'desc' };

    const [total, products] = await Promise.all([
      this.prisma.client.product.count({ where }),
      this.prisma.client.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          brand: { select: { id: true, name: true, logo: true, slug: true } },
          category: { select: { id: true, name: true, slug: true, categoryCode: true } },
          images: { orderBy: { sortOrder: 'asc' } },
          variants: {
            where: { status: 'ACTIVE' },
            include: {
              variantValues: {
                include: {
                  attribute: true,
                  attributeValue: true,
                },
              },
            },
          },
          reviews: {
            where: { status: 'APPROVED' },
            select: { rating: true },
          },
        },
      }),
    ]);

    const items = products.map((p) => {
      const ratings = p.reviews.map((r) => r.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const totalStock = p.variants.reduce((acc, v) => acc + v.stockQuantity, 0);

      return {
        id: p.id,
        productCode: p.productCode,
        name: p.name,
        slug: p.slug,
        description: p.description,
        basePrice: p.basePrice,
        status: p.status,
        minStockAlert: p.minStockAlert,
        categoryId: p.categoryId,
        brandId: p.brandId,
        brand: p.brand,
        category: p.category,
        images: p.images,
        primaryImage: p.images.find((img) => img.isPrimary)?.url || p.images[0]?.url || null,
        variantsCount: p.variants.length,
        totalStock,
        isLowStock: totalStock <= p.minStockAlert,
        rating: Math.round(avgRating * 10) / 10,
        reviewsCount: ratings.length,
        variants: p.variants,
      };
    });

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(idOrSlug: string | number) {
    const isId = typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug));
    const where = isId ? { id: Number(idOrSlug) } : { slug: String(idOrSlug) };

    const product = await this.prisma.client.product.findUnique({
      where: where as any,
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        attributeValues: {
          include: {
            attribute: true,
            attributeValue: true,
          },
        },
        variants: {
          where: { status: 'ACTIVE' },
          include: {
            variantValues: {
              include: {
                attribute: true,
                attributeValue: true,
              },
            },
          },
        },
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    const breadcrumbs = await this.categoriesService.getBreadcrumbs(product.categoryId);

    // Compute rating breakdown
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of product.reviews) {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    }
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
        : 0;

    const totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);

    return {
      ...product,
      breadcrumbs,
      totalStock,
      isLowStock: totalStock <= product.minStockAlert,
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: product.reviews.length,
      ratingDistribution,
    };
  }

  // -------------------------------------------------------------
  // DYNAMIC PRODUCT CREATION
  // -------------------------------------------------------------

  async create(dto: CreateProductDto, staffId?: number) {
    // 1. Check/Autogenerate Product Code
    let finalProductCode = dto.productCode?.trim().toUpperCase();
    if (!finalProductCode) {
      const prefix = dto.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 4) || 'PRD';
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        finalProductCode = `PRD-${prefix}-${rand}`;
        const exists = await this.prisma.raw.product.findFirst({
          where: { productCode: finalProductCode },
        });
        if (!exists) isUnique = true;
        attempts++;
      }
    } else {
      const existingCode = await this.prisma.raw.product.findFirst({
        where: { productCode: finalProductCode },
      });
      if (existingCode) {
        throw new BadRequestException(`Product code "${finalProductCode}" is already reserved or in use.`);
      }
    }

    const existingSlug = await this.prisma.raw.product.findFirst({
      where: { slug: dto.slug.trim().toLowerCase() },
    });
    if (existingSlug) {
      throw new BadRequestException(`Product slug "${dto.slug}" is already in use.`);
    }

    // 2. Validate Category & Brand exist
    const category = await this.prisma.client.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException(`Category ID ${dto.categoryId} not found`);

    const brand = await this.prisma.client.brand.findUnique({ where: { id: dto.brandId } });
    if (!brand) throw new BadRequestException(`Brand ID ${dto.brandId} not found`);

    // 3. Execute in Atomic Database Transaction
    const result = await this.prisma.raw.$transaction(async (tx) => {
      // Create Base Product
      const product = await tx.product.create({
        data: {
          productCode: finalProductCode!,
          name: dto.name.trim(),
          slug: dto.slug.trim().toLowerCase(),
          description: dto.description || null,
          categoryId: dto.categoryId,
          brandId: dto.brandId,
          basePrice: dto.basePrice,
          status: dto.status || 'ACTIVE',
          minStockAlert: dto.minStockAlert || 5,
        },
      });

      // Add Product Images
      if (dto.images && dto.images.length > 0) {
        await tx.productImage.createMany({
          data: dto.images.map((img, idx) => ({
            productId: product.id,
            url: img.url,
            altText: img.altText || product.name,
            isPrimary: img.isPrimary ?? idx === 0,
            sortOrder: img.sortOrder ?? idx,
          })),
        });
      }

      // Add Dynamic Attribute Values
      if (dto.attributes && dto.attributes.length > 0) {
        await tx.productAttributeValue.createMany({
          data: dto.attributes.map((attr) => ({
            productId: product.id,
            attributeId: attr.attributeId,
            attributeValueId: attr.attributeValueId || null,
            valueText: attr.valueText || null,
            valueNumber: attr.valueNumber !== undefined ? attr.valueNumber : null,
            valueBoolean: attr.valueBoolean !== undefined ? attr.valueBoolean : null,
          })),
        });
      }

      // Add Variants & Initial Inventory Transactions
      if (dto.variants && dto.variants.length > 0) {
        for (let idx = 0; idx < dto.variants.length; idx++) {
          const v = dto.variants[idx];
          let finalSku = v.sku?.trim().toUpperCase();
          if (!finalSku) {
            finalSku = `${finalProductCode}-VAR-${idx + 1}`;
          }
          const existingSku = await tx.productVariant.findFirst({
            where: { sku: finalSku },
          });
          if (existingSku) {
            finalSku = `${finalSku}-${Math.floor(100 + Math.random() * 900)}`;
          }

          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: finalSku,
              price: v.price,
              stockQuantity: v.stockQuantity,
              barcode: v.barcode || null,
              weight: v.weight || null,
              status: 'ACTIVE',
            },
          });

          // Map variant attributes
          if (v.attributes && v.attributes.length > 0) {
            await tx.variantAttributeValue.createMany({
              data: v.attributes.map((va) => ({
                variantId: variant.id,
                attributeId: va.attributeId,
                attributeValueId: va.attributeValueId,
              })),
            });
          }

          // Record Initial Stock Ledger Transaction (Immutable)
          await tx.inventoryTransaction.create({
            data: {
              productId: product.id,
              variantId: variant.id,
              staffId: staffId || null,
              type: 'INITIAL',
              quantityChange: v.stockQuantity,
              previousQuantity: 0,
              newQuantity: v.stockQuantity,
              reason: 'Initial stock intake on product creation',
            },
          });
        }
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          staffId: staffId || null,
          action: 'CREATE_PRODUCT',
          entityType: 'Product',
          entityId: String(product.id),
          newValueJson: JSON.stringify({
            productCode: product.productCode,
            name: product.name,
            categoryId: product.categoryId,
            variantsCount: dto.variants?.length || 0,
          }),
        },
      });

      return product;
    });

    return this.findOne(result.id);
  }

  async update(id: number, dto: UpdateProductDto, staffId?: number) {
    const existing = await this.prisma.client.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Product with ID ${id} not found`);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name.trim();
    if (dto.slug) updateData.slug = dto.slug.trim().toLowerCase();
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.categoryId) updateData.categoryId = dto.categoryId;
    if (dto.brandId) updateData.brandId = dto.brandId;
    if (dto.basePrice !== undefined) updateData.basePrice = dto.basePrice;
    if (dto.status) updateData.status = dto.status;
    if (dto.minStockAlert !== undefined) updateData.minStockAlert = dto.minStockAlert;

    await this.prisma.raw.$transaction(async (tx) => {
      // 1. Update Base Product
      await tx.product.update({
        where: { id },
        data: updateData,
      });

      // 2. Update Images if provided
      if (dto.images && Array.isArray(dto.images)) {
        await tx.productImage.deleteMany({
          where: { productId: id },
        });
        if (dto.images.length > 0) {
          await tx.productImage.createMany({
            data: dto.images.map((img, idx) => ({
              productId: id,
              url: img.url,
              isPrimary: img.isPrimary !== undefined ? img.isPrimary : idx === 0,
              sortOrder: img.sortOrder ?? idx,
            })),
          });
        }
      }

      // 3. Update Product Attribute Values if provided
      if (dto.attributes && Array.isArray(dto.attributes)) {
        await tx.productAttributeValue.deleteMany({
          where: { productId: id },
        });
        if (dto.attributes.length > 0) {
          await tx.productAttributeValue.createMany({
            data: dto.attributes.map((attr) => ({
              productId: id,
              attributeId: attr.attributeId,
              attributeValueId: attr.attributeValueId || null,
              valueText: attr.valueText || null,
              valueNumber: attr.valueNumber !== undefined ? attr.valueNumber : null,
              valueBoolean: attr.valueBoolean !== undefined ? attr.valueBoolean : null,
            })),
          });
        }
      }

      // 4. Update Variants & Inventory Ledger if provided
      if (dto.variants && Array.isArray(dto.variants)) {
        const currentVariants = await tx.productVariant.findMany({
          where: { productId: id },
        });

        const keptIds: number[] = [];

        for (let idx = 0; idx < dto.variants.length; idx++) {
          const v = dto.variants[idx];

          if (v.id) {
            // Existing variant update
            keptIds.push(v.id);
            const current = currentVariants.find((cv) => cv.id === v.id);
            if (current) {
              const diff = Number(v.stockQuantity) - current.stockQuantity;

              await tx.productVariant.update({
                where: { id: v.id },
                data: {
                  sku: v.sku?.trim().toUpperCase() || current.sku,
                  price: v.price,
                  stockQuantity: v.stockQuantity,
                  barcode: v.barcode !== undefined ? v.barcode : current.barcode,
                  weight: v.weight !== undefined ? v.weight : current.weight,
                  status: v.status || current.status,
                },
              });

              // Log stock adjustment if stock quantity changed
              if (diff !== 0) {
                await tx.inventoryTransaction.create({
                  data: {
                    productId: id,
                    variantId: v.id,
                    staffId: staffId || null,
                    type: 'ADJUSTMENT',
                    quantityChange: diff,
                    previousQuantity: current.stockQuantity,
                    newQuantity: v.stockQuantity,
                    reason: 'Manual stock adjustment during product update',
                  },
                });
              }

              // Update variant attributes if provided
              if (v.attributes && Array.isArray(v.attributes)) {
                await tx.variantAttributeValue.deleteMany({
                  where: { variantId: v.id },
                });
                if (v.attributes.length > 0) {
                  await tx.variantAttributeValue.createMany({
                    data: v.attributes.map((va) => ({
                      variantId: v.id!,
                      attributeId: va.attributeId,
                      attributeValueId: va.attributeValueId,
                    })),
                  });
                }
              }
            }
          } else {
            // New variant added to existing product
            let finalSku =
              v.sku?.trim().toUpperCase() ||
              `${existing.productCode}-VAR-${Math.floor(100 + Math.random() * 900)}`;

            const newVariant = await tx.productVariant.create({
              data: {
                productId: id,
                sku: finalSku,
                price: v.price,
                stockQuantity: v.stockQuantity,
                barcode: v.barcode || null,
                weight: v.weight || null,
                status: v.status || 'ACTIVE',
              },
            });

            keptIds.push(newVariant.id);

            if (v.attributes && v.attributes.length > 0) {
              await tx.variantAttributeValue.createMany({
                data: v.attributes.map((va) => ({
                  variantId: newVariant.id,
                  attributeId: va.attributeId,
                  attributeValueId: va.attributeValueId,
                })),
              });
            }

            await tx.inventoryTransaction.create({
              data: {
                productId: id,
                variantId: newVariant.id,
                staffId: staffId || null,
                type: 'INITIAL',
                quantityChange: v.stockQuantity,
                previousQuantity: 0,
                newQuantity: v.stockQuantity,
                reason: 'New variant added during product update',
              },
            });
          }
        }

        // Deactivate variants removed by admin
        const removedVariants = currentVariants.filter((cv) => !keptIds.includes(cv.id));
        for (const rv of removedVariants) {
          await tx.productVariant.update({
            where: { id: rv.id },
            data: { status: 'INACTIVE' },
          });
        }
      }

      // 5. Create Audit Log
      await tx.auditLog.create({
        data: {
          staffId: staffId || null,
          action: 'UPDATE_PRODUCT',
          entityType: 'Product',
          entityId: String(id),
          oldValueJson: JSON.stringify({
            name: existing.name,
            basePrice: existing.basePrice,
            status: existing.status,
          }),
          newValueJson: JSON.stringify({
            ...updateData,
            attributesUpdated: Boolean(dto.attributes),
            variantsUpdated: Boolean(dto.variants),
          }),
        },
      });
    });

    return this.findOne(id);
  }

  async softDelete(id: number, staffId?: number) {
    return this.prisma.softDelete('Product', id, staffId);
  }

  async restore(id: number, staffId?: number) {
    return this.prisma.restore('Product', id, staffId);
  }
}
