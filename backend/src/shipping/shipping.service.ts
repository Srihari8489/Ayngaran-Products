import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateShippingSettingsDto } from './dto/shipping-settings.dto';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { normalizeStateCode } from '../common/utils/gst.util';

export interface ShippingCalculationResult {
  shippingZone: 'TAMIL_NADU' | 'OUTSIDE_TAMIL_NADU';
  destinationState: string;
  destinationStateCode: string;
  totalWeightGrams: number;
  billableWeightGrams: number;
  billableUnits: number;
  ratePerUnit: number;
  shippingAmount: number;
  estimatedDelivery: string;
  baseWeightGrams: number;
}

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper to normalize product/variant weight into grams.
   * ProductVariant.weight: < 10 represents Kilograms (e.g. 0.05 = 50g, 0.5 = 500g, 1.0 = 1000g).
   * Values >= 10 represent grams directly (e.g. 250, 500).
   */
  extractWeightInGrams(variant?: any, product?: any): number {
    if (variant?.weight != null) {
      const w = Number(variant.weight);
      if (!isNaN(w) && w > 0) {
        return w < 10 ? Math.round(w * 1000) : Math.round(w);
      }
    }

    // Check variant attribute values (e.g. Package Size: 50g, 20g, 1kg)
    if (Array.isArray(variant?.variantValues)) {
      for (const vv of variant.variantValues) {
        const val = `${vv?.attributeValue?.displayName || ''} ${vv?.attributeValue?.value || ''}`;
        const km = val.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo)/i);
        if (km) return Math.round(parseFloat(km[1]) * 1000);
        const gm = val.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram)/i);
        if (gm) return Math.round(parseFloat(gm[1]));
      }
    }

    // Check variant SKU or label if weight not explicit
    const labelToCheck = `${variant?.sku || ''} ${variant?.variantLabel || ''} ${variant?.barcode || ''}`;
    const kgMatch = labelToCheck.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo)/i);
    if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);
    const gMatch = labelToCheck.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram|grams)/i);
    if (gMatch) return Math.round(parseFloat(gMatch[1]));

    if (product?.weightKg != null) {
      const pw = Number(product.weightKg);
      if (!isNaN(pw) && pw > 0) {
        return pw < 10 ? Math.round(pw * 1000) : Math.round(pw);
      }
    }

    return 500; // Default fallback: 500 grams
  }

  /**
   * Get active shipping configuration. Auto-seeds default row if none exists.
   */
  async getShippingConfig() {
    let config = await (this.prisma.client as any).shippingConfig.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!config) {
      config = await (this.prisma.client as any).shippingConfig.create({
        data: {
          tamilNaduRatePerKg: 60.00,
          tamilNaduDeliveryTime: 'Within 2 days',
          outsideTnRatePerKg: 120.00,
          outsideTnMinDays: 3,
          outsideTnMaxDays: 5,
          outsideTnDeliveryTime: '3-5 days',
          baseWeightGrams: 1000,
          isActive: true,
        },
      });
    }

    return {
      id: config.id,
      tamilNaduRatePerKg: Number(config.tamilNaduRatePerKg),
      tamilNaduDeliveryTime: config.tamilNaduDeliveryTime,
      outsideTnRatePerKg: Number(config.outsideTnRatePerKg),
      outsideTnMinDays: config.outsideTnMinDays,
      outsideTnMaxDays: config.outsideTnMaxDays,
      outsideTnDeliveryTime: config.outsideTnDeliveryTime,
      baseWeightGrams: config.baseWeightGrams,
      isActive: config.isActive,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Update shipping configuration (Admin only).
   */
  async updateShippingConfig(dto: UpdateShippingSettingsDto, staffId?: number) {
    if (dto.outsideTnMinDays > dto.outsideTnMaxDays) {
      throw new BadRequestException('Minimum delivery days cannot be greater than maximum delivery days');
    }

    const current = await (this.prisma.client as any).shippingConfig.findFirst({
      orderBy: { id: 'asc' },
    });

    const outsideTnDeliveryTime =
      dto.outsideTnDeliveryTime?.trim() ||
      `${dto.outsideTnMinDays}-${dto.outsideTnMaxDays} days`;

    let updated;
    if (current) {
      updated = await (this.prisma.client as any).shippingConfig.update({
        where: { id: current.id },
        data: {
          tamilNaduRatePerKg: dto.tamilNaduRatePerKg,
          tamilNaduDeliveryTime: dto.tamilNaduDeliveryTime.trim(),
          outsideTnRatePerKg: dto.outsideTnRatePerKg,
          outsideTnMinDays: dto.outsideTnMinDays,
          outsideTnMaxDays: dto.outsideTnMaxDays,
          outsideTnDeliveryTime,
          baseWeightGrams: dto.baseWeightGrams,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });
    } else {
      updated = await (this.prisma.client as any).shippingConfig.create({
        data: {
          tamilNaduRatePerKg: dto.tamilNaduRatePerKg,
          tamilNaduDeliveryTime: dto.tamilNaduDeliveryTime.trim(),
          outsideTnRatePerKg: dto.outsideTnRatePerKg,
          outsideTnMinDays: dto.outsideTnMinDays,
          outsideTnMaxDays: dto.outsideTnMaxDays,
          outsideTnDeliveryTime,
          baseWeightGrams: dto.baseWeightGrams,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });
    }

    // Write audit log if staffId present
    if (staffId) {
      await this.prisma.raw.auditLog.create({
        data: {
          staffId,
          action: 'UPDATE_SHIPPING_SETTINGS',
          entityType: 'ShippingConfig',
          entityId: String(updated.id),
          newValueJson: JSON.stringify(dto),
        },
      });
    }

    return {
      id: updated.id,
      tamilNaduRatePerKg: Number(updated.tamilNaduRatePerKg),
      tamilNaduDeliveryTime: updated.tamilNaduDeliveryTime,
      outsideTnRatePerKg: Number(updated.outsideTnRatePerKg),
      outsideTnMinDays: updated.outsideTnMinDays,
      outsideTnMaxDays: updated.outsideTnMaxDays,
      outsideTnDeliveryTime: updated.outsideTnDeliveryTime,
      baseWeightGrams: updated.baseWeightGrams,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Determine shipping zone from state or state code.
   * Tamil Nadu state code is 33.
   */
  determineShippingZone(stateInput?: string | null): {
    shippingZone: 'TAMIL_NADU' | 'OUTSIDE_TAMIL_NADU';
    destinationState: string;
    destinationStateCode: string;
  } {
    const raw = String(stateInput || 'Tamil Nadu').trim();
    const stateCode = normalizeStateCode(raw);
    const cleanLower = raw.toLowerCase().replace(/[^a-z]/g, '');

    const isTN =
      stateCode === '33' ||
      cleanLower === 'tamilnadu' ||
      cleanLower === 'tn';

    return {
      shippingZone: isTN ? 'TAMIL_NADU' : 'OUTSIDE_TAMIL_NADU',
      destinationState: isTN ? 'Tamil Nadu' : raw,
      destinationStateCode: stateCode,
    };
  }

  /**
   * Authoritative backend shipping calculation service.
   * Used uniformly across checkout, order placement, order viewing, and frontend calculation.
   */
  async calculateShipping(dto: CalculateShippingDto): Promise<ShippingCalculationResult> {
    const config = await this.getShippingConfig();

    let stateString = dto.destinationState || dto.state;

    // If addressId is provided, look up the state from userAddress
    if (dto.addressId) {
      const address = await this.prisma.client.userAddress.findUnique({
        where: { id: dto.addressId },
      });
      if (address) {
        stateString = address.state;
      }
    }

    const { shippingZone, destinationState, destinationStateCode } =
      this.determineShippingZone(stateString);

    // Calculate total weight in grams by summing: (item weight × quantity) across all items
    const baseWeight = config.baseWeightGrams > 0 ? config.baseWeightGrams : 1000;
    let totalWeightGrams = 0;

    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        let itemUnitWeight = 500;
        if (item.weight && item.weight > 0) {
          itemUnitWeight = Math.round(item.weight);
        } else if (item.variantId) {
          const variant = await this.prisma.client.productVariant.findUnique({
            where: { id: item.variantId },
            include: {
              product: true,
              variantValues: {
                include: { attributeValue: true },
              },
            },
          });
          itemUnitWeight = this.extractWeightInGrams(variant, variant?.product);
        } else if (item.productId) {
          const product = await this.prisma.client.product.findUnique({
            where: { id: item.productId },
          });
          itemUnitWeight = this.extractWeightInGrams(null, product);
        } else {
          itemUnitWeight = 500;
        }

        totalWeightGrams += itemUnitWeight * qty;
      }
    } else if (dto.totalWeightGrams && dto.totalWeightGrams > 0) {
      totalWeightGrams = Math.round(dto.totalWeightGrams);
    } else {
      totalWeightGrams = 0;
    }

    // Billable slabs: Math.max(1, Math.ceil(totalWeightGrams / 1000))
    // 0g – 1000g -> 1 slab
    // 1001g – 2000g -> 2 slabs
    // 2001g – 3000g -> 3 slabs
    // 3001g – 4000g -> 4 slabs
    const billableUnits = Math.max(1, Math.ceil(totalWeightGrams / baseWeight));
    const billableWeightGrams = billableUnits * baseWeight;

    let ratePerUnit: number;
    let shippingAmount: number;
    let estimatedDelivery: string;

    if (shippingZone === 'TAMIL_NADU') {
      ratePerUnit = config.tamilNaduRatePerKg;
      shippingAmount = billableUnits * ratePerUnit;
      estimatedDelivery = config.tamilNaduDeliveryTime || 'Within 2 days';
    } else {
      ratePerUnit = config.outsideTnRatePerKg;
      shippingAmount = billableUnits * ratePerUnit;
      estimatedDelivery =
        config.outsideTnDeliveryTime ||
        `${config.outsideTnMinDays}-${config.outsideTnMaxDays} days`;
    }

    return {
      shippingZone,
      destinationState,
      destinationStateCode,
      totalWeightGrams,
      billableWeightGrams,
      billableUnits,
      ratePerUnit,
      shippingAmount,
      estimatedDelivery,
      baseWeightGrams: baseWeight,
    };
  }
}
