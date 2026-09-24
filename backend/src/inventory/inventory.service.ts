import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStockOverview(query?: any) {
    const isPaginated = query && (query.page || query.limit || query.search || query.lowStockOnly !== undefined);

    if (!isPaginated) {
      const products = await this.prisma.client.product.findMany({
        include: {
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          variants: {
            include: {
              variantValues: {
                include: {
                  attribute: true,
                  attributeValue: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      const stockItems: any[] = [];
      for (const p of products) {
        if (p.variants.length > 0) {
          for (const v of p.variants) {
            const variantName = v.variantValues
              .map((vv) => `${vv.attribute.name}: ${vv.attributeValue.displayName}`)
              .join(' | ');

            stockItems.push({
              productId: p.id,
              productCode: p.productCode,
              productName: p.name,
              brand: p.brand.name,
              category: p.category.name,
              variantId: v.id,
              sku: v.sku,
              variantDescription: variantName || 'Default Variant',
              price: v.price,
              stockQuantity: v.stockQuantity,
              minStockAlert: p.minStockAlert,
              isLowStock: v.stockQuantity <= p.minStockAlert,
              isOutOfStock: v.stockQuantity === 0,
              status: v.status,
            });
          }
        }
      }
      return stockItems;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    const searchTerm = (query.search || '').trim();
    if (searchTerm) {
      where.OR = [
        { sku: { contains: searchTerm } },
        { product: { name: { contains: searchTerm } } },
        { product: { productCode: { contains: searchTerm } } },
        { product: { brand: { name: { contains: searchTerm } } } },
      ];
    }

    const [total, variants] = await Promise.all([
      this.prisma.client.productVariant.count({ where }),
      this.prisma.client.productVariant.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              productCode: true,
              name: true,
              minStockAlert: true,
              brand: { select: { name: true } },
              category: { select: { name: true } },
            },
          },
          variantValues: {
            include: {
              attribute: true,
              attributeValue: true,
            },
          },
        },
        orderBy: { product: { name: 'asc' } },
        skip,
        take: limit,
      }),
    ]);

    let stockItems = variants.map((v) => {
      const variantName = v.variantValues
        .map((vv) => `${vv.attribute.name}: ${vv.attributeValue.displayName}`)
        .join(' | ');

      const minAlert = v.product.minStockAlert || 5;
      return {
        productId: v.product.id,
        productCode: v.product.productCode,
        productName: v.product.name,
        brand: v.product.brand?.name || '—',
        category: v.product.category?.name || '—',
        variantId: v.id,
        sku: v.sku,
        variantDescription: variantName || 'Default Variant',
        price: v.price,
        stockQuantity: v.stockQuantity,
        minStockAlert: minAlert,
        isLowStock: v.stockQuantity <= minAlert,
        isOutOfStock: v.stockQuantity === 0,
        status: v.status,
      };
    });

    if (query.lowStockOnly === 'true' || query.lowStockOnly === true) {
      stockItems = stockItems.filter((i) => i.isLowStock);
    }

    return createPaginatedResponse(stockItems, total, page, limit);
  }

  async getLowStockAlerts() {
    const allStock = await this.getStockOverview();
    return allStock.filter((item) => item.isLowStock);
  }

  async adjustStock(dto: AdjustStockDto, staffId?: number) {
    if (dto.quantityChange === 0) {
      throw new BadRequestException('Quantity change cannot be zero.');
    }

    return this.prisma.raw.$transaction(async (tx) => {
      let previousQuantity = 0;
      let newQuantity = 0;
      let targetSku = '';

      if (dto.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: dto.variantId },
        });

        if (!variant) throw new NotFoundException(`Variant with ID ${dto.variantId} not found`);

        previousQuantity = variant.stockQuantity;
        newQuantity = previousQuantity + dto.quantityChange;
        targetSku = variant.sku;

        if (newQuantity < 0) {
          throw new BadRequestException(
            `Insufficient stock for adjustment. Current: ${previousQuantity}, Requested Change: ${dto.quantityChange}`,
          );
        }

        await tx.productVariant.update({
          where: { id: dto.variantId },
          data: { stockQuantity: newQuantity },
        });
      }

      // Record in immutable inventory_transactions ledger
      const transactionRecord = await tx.inventoryTransaction.create({
        data: {
          productId: dto.productId,
          variantId: dto.variantId || null,
          staffId: staffId || null,
          type: dto.type,
          quantityChange: dto.quantityChange,
          previousQuantity,
          newQuantity,
          reason: dto.reason || `Manual ${dto.type} adjustment`,
        },
      });

      // Write Audit Log
      await tx.auditLog.create({
        data: {
          staffId: staffId || null,
          action: 'UPDATE_STOCK',
          entityType: 'Inventory',
          entityId: String(dto.variantId || dto.productId),
          oldValueJson: JSON.stringify({ sku: targetSku, stockQuantity: previousQuantity }),
          newValueJson: JSON.stringify({ sku: targetSku, stockQuantity: newQuantity, change: dto.quantityChange }),
        },
      });

      return {
        message: 'Stock adjusted successfully',
        transaction: transactionRecord,
        newStock: newQuantity,
      };
    });
  }

  async getHistory(query?: any) {
    if (!query || (!query.page && !query.limit && !query.search && !query.type)) {
      const where: any = {};
      if (query?.productId) where.productId = Number(query.productId);
      if (query?.variantId) where.variantId = Number(query.variantId);

      return this.prisma.raw.inventoryTransaction.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, productCode: true } },
          variant: { select: { id: true, sku: true } },
          staff: { select: { id: true, name: true, staffCode: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.productId) where.productId = Number(query.productId);
    if (query.variantId) where.variantId = Number(query.variantId);
    if (query.type && query.type !== 'ALL') where.type = query.type;

    const searchTerm = (query.search || '').trim();
    if (searchTerm) {
      where.OR = [
        { product: { name: { contains: searchTerm } } },
        { product: { productCode: { contains: searchTerm } } },
        { variant: { sku: { contains: searchTerm } } },
        { staff: { name: { contains: searchTerm } } },
        { reason: { contains: searchTerm } },
      ];
    }

    const [total, transactions] = await Promise.all([
      this.prisma.raw.inventoryTransaction.count({ where }),
      this.prisma.raw.inventoryTransaction.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, productCode: true } },
          variant: { select: { id: true, sku: true } },
          staff: { select: { id: true, name: true, staffCode: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return createPaginatedResponse(transactions, total, page, limit);
  }
}
