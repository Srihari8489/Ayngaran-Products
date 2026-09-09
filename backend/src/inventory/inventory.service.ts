import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStockOverview() {
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

  async getHistory(productId?: number, variantId?: number) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;

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
}
