import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShippingService } from '../shipping/shipping.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { computeGstBreakdown } from '../common/utils/gst.util';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private shippingService: ShippingService,
  ) {}

  async getCart(userId: number) {
    let cart = await this.prisma.client.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: { select: { id: true, name: true } },
                category: { select: { id: true, name: true, gstRate: true } },
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: {
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
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.client.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  brand: { select: { id: true, name: true } },
                  category: { select: { id: true, name: true, gstRate: true } },
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
              variant: {
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
          },
        },
      });
    }

    let subtotal = 0;
    let taxAmount = 0;
    let totalItems = 0;
    let allItemsAvailable = true;

    const items = cart.items.map((item) => {
      const unitPrice = item.variant ? Number(item.variant.price) : Number(item.product.basePrice);
      const totalPrice = unitPrice * item.quantity;
      const currentStock = item.variant ? item.variant.stockQuantity : 0;
      const isAvailable = currentStock >= item.quantity && (item.variant ? item.variant.status === 'ACTIVE' : item.product.status === 'ACTIVE');

      if (!isAvailable) allItemsAvailable = false;

      const categoryGst = Number(item.product.category?.gstRate ?? 5);
      const effectiveGstRate = item.product.useCategoryGst
        ? categoryGst
        : (item.product.gstRate !== null && item.product.gstRate !== undefined ? Number(item.product.gstRate) : categoryGst);
      // Reverse GST calculation: Selling price is inclusive of GST
      const itemTaxable = Math.round((totalPrice / (1 + effectiveGstRate / 100)) * 100) / 100;
      const itemGstAmount = Math.round((totalPrice - itemTaxable) * 100) / 100;

      subtotal += totalPrice;
      taxAmount += itemGstAmount;
      totalItems += item.quantity;

      let variantName = item.variant?.variantValues
        ?.map((vv) => {
          const val = vv.attributeValue?.displayName || vv.attributeValue?.value;
          if (!val) return null;
          const attr = vv.attribute?.name;
          if (attr && !['size', 'weight', 'package size', 'pack size', 'quantity', 'volume'].includes(attr.toLowerCase())) {
            return `${attr}: ${val}`;
          }
          return val;
        })
        .filter(Boolean)
        .join(' / ');

      if (!variantName && item.variant?.weight) {
        const num = Number(item.variant.weight);
        if (num > 0) {
          if (num < 10) {
            variantName = num < 1 ? `${Math.round(num * 1000)}g` : `${Number(num.toFixed(2))} KG`;
          } else if (num >= 1000) {
            variantName = `${Number((num / 1000).toFixed(2))} KG`;
          } else {
            variantName = `${Math.round(num)}g`;
          }
        }
      }

      if (!variantName && item.variant?.sku) {
        const match = item.variant.sku.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|g|gm|gram)\b/i);
        if (match) {
          const unit = match[2].toLowerCase().startsWith('k') ? ' KG' : 'g';
          variantName = `${match[1]}${unit}`;
        }
      }

      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productCode: item.product.productCode,
        brandName: item.product.brand.name,
        image: item.product.images[0]?.url || null,
        variantId: item.variantId,
        sku: item.variant?.sku || null,
        variantDescription: variantName || null,
        variantWeight: item.variant?.weight ? Number(item.variant.weight) : null,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        taxableValue: itemTaxable,
        gstRate: effectiveGstRate,
        gstAmount: itemGstAmount,
        currentStock,
        isAvailable,
        stockWarning:
          currentStock < item.quantity
            ? currentStock === 0
              ? 'Item is currently Out of Stock'
              : `Only ${currentStock} units left in stock`
            : null,
      };
    });

    const userAddress = await this.prisma.client.userAddress.findFirst({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });

    const destinationState = userAddress?.state || 'Tamil Nadu';
    const shippingCalc = await this.shippingService.calculateShipping({
      destinationState,
      items: items.map((it) => ({
        variantId: it.variantId,
        productId: it.productId,
        quantity: it.quantity,
      })),
    });

    const totalTaxable = Math.round(items.reduce((acc, it) => acc + it.taxableValue, 0) * 100) / 100;
    const gstBreakdown = computeGstBreakdown(totalTaxable, taxAmount, destinationState);

    return {
      cartId: cart.id,
      items,
      totalItems,
      subtotal,
      taxableAmount: gstBreakdown.taxableAmount,
      taxAmount: gstBreakdown.totalGst,
      supplyType: gstBreakdown.supplyType,
      sellerStateCode: gstBreakdown.sellerStateCode,
      customerStateCode: gstBreakdown.customerStateCode,
      cgstAmount: gstBreakdown.cgstAmount,
      sgstAmount: gstBreakdown.sgstAmount,
      igstAmount: gstBreakdown.igstAmount,
      allItemsAvailable,
      shipping: {
        shippingZone: shippingCalc.shippingZone,
        destinationState: shippingCalc.destinationState,
        totalWeightGrams: shippingCalc.totalWeightGrams,
        billableWeightGrams: shippingCalc.billableWeightGrams,
        billableUnits: shippingCalc.billableUnits,
        ratePerUnit: shippingCalc.ratePerUnit,
        shippingAmount: shippingCalc.shippingAmount,
        estimatedDelivery: shippingCalc.estimatedDelivery,
      },
    };
  }

  async addItem(userId: number, dto: AddCartItemDto) {
    const product = await this.prisma.client.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new BadRequestException('Product is not available.');
    }

    let targetVariant = null;
    if (dto.variantId) {
      targetVariant = product.variants.find((v) => v.id === dto.variantId);
      if (!targetVariant || targetVariant.status !== 'ACTIVE') {
        throw new BadRequestException('Selected product variant is not available.');
      }
      if (targetVariant.stockQuantity < dto.quantity) {
        throw new BadRequestException(
          targetVariant.stockQuantity === 0
            ? 'Item is currently out of stock.'
            : `Only ${targetVariant.stockQuantity} items available.`,
        );
      }
    }

    let cart = await this.prisma.client.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.client.cart.create({ data: { userId } });
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.raw.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId || null,
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + dto.quantity;
      if (targetVariant && targetVariant.stockQuantity < newQty) {
        throw new BadRequestException(
          `Cannot add more items. Maximum available in stock is ${targetVariant.stockQuantity}.`,
        );
      }

      await this.prisma.raw.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.raw.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId || null,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: number, cartItemId: number, quantity: number) {
    const cart = await this.prisma.client.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.raw.cartItem.findUnique({
      where: { id: cartItemId },
      include: { variant: true },
    });

    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException('Cart item not found');
    }

    if (item.variant && item.variant.stockQuantity < quantity) {
      throw new BadRequestException(
        `Only ${item.variant.stockQuantity} units available in stock.`,
      );
    }

    await this.prisma.raw.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: number, cartItemId: number) {
    const cart = await this.prisma.client.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.prisma.raw.cartItem.findUnique({ where: { id: cartItemId } });
    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.raw.cartItem.delete({ where: { id: cartItemId } });
    return this.getCart(userId);
  }

  async clearCart(userId: number) {
    const cart = await this.prisma.client.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.raw.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return { message: 'Cart cleared successfully' };
  }
}
