import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

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
      const itemGstAmount = Math.round(totalPrice * (effectiveGstRate / 100) * 100) / 100;

      subtotal += totalPrice;
      taxAmount += itemGstAmount;
      totalItems += item.quantity;

      const variantName = item.variant?.variantValues
        .map((vv) => `${vv.attribute.name}: ${vv.attributeValue.displayName}`)
        .join(' / ');

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
        quantity: item.quantity,
        unitPrice,
        totalPrice,
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

    return {
      cartId: cart.id,
      items,
      totalItems,
      subtotal,
      taxAmount: Math.round(taxAmount * 100) / 100,
      allItemsAvailable,
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
