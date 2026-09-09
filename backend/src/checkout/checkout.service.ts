import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(private prisma: PrismaService) {}

  async processCheckout(userId: number, dto: CheckoutDto) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // 1. Resolve Delivery Address
    let shippingAddress: any = null;
    if (dto.addressId) {
      shippingAddress = await this.prisma.client.userAddress.findFirst({
        where: { id: dto.addressId, userId },
      });
      if (!shippingAddress) throw new BadRequestException('Selected address not found');
    } else if (dto.newAddress) {
      shippingAddress = await this.prisma.client.userAddress.create({
        data: {
          userId,
          recipientName: dto.newAddress.recipientName,
          phone: dto.newAddress.phone,
          addressLine1: dto.newAddress.addressLine1,
          addressLine2: dto.newAddress.addressLine2 || null,
          city: dto.newAddress.city,
          state: dto.newAddress.state,
          pincode: dto.newAddress.pincode,
          country: 'India',
        },
      });
    } else {
      // Pick user's default address
      shippingAddress = await this.prisma.client.userAddress.findFirst({
        where: { userId, isDefault: true },
      });
      if (!shippingAddress) {
        shippingAddress = await this.prisma.client.userAddress.findFirst({
          where: { userId },
        });
      }
      if (!shippingAddress) {
        throw new BadRequestException('A delivery address is required for checkout.');
      }
    }

    // 2. Resolve Checkout Items (From Cart or Explicit items)
    let orderItemsToProcess: { productId: number; variantId: number | null; quantity: number }[] = [];

    if (dto.items && dto.items.length > 0) {
      orderItemsToProcess = dto.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || null,
        quantity: i.quantity,
      }));
    } else if (user.cart && user.cart.items.length > 0) {
      orderItemsToProcess = user.cart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
    } else {
      throw new BadRequestException('Your cart is empty. Please add products to checkout.');
    }

    // 3. Authoritative Price Recalculation & Stock Pre-check (Never trust client prices!)
    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of orderItemsToProcess) {
      const product = await this.prisma.client.product.findUnique({
        where: { id: item.productId },
        include: { brand: true, images: { where: { isPrimary: true }, take: 1 } },
      });

      if (!product || product.status !== 'ACTIVE') {
        throw new BadRequestException(`Product ${item.productId} is not available.`);
      }

      let unitPrice = Number(product.basePrice);
      let variantSku: string | null = null;

      if (item.variantId) {
        const variant = await this.prisma.client.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant || variant.status !== 'ACTIVE') {
          throw new BadRequestException(`Selected variant for "${product.name}" is not available.`);
        }

        if (variant.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Available: ${variant.stockQuantity}, Requested: ${item.quantity}.`,
          );
        }

        unitPrice = Number(variant.price);
        variantSku = variant.sku;
      }

      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        productSnapshot: {
          name: product.name,
          productCode: product.productCode,
          brand: product.brand.name,
          sku: variantSku,
          image: product.images[0]?.url || null,
        },
      });
    }

    // Taxes & Shipping calculations
    const shippingFee = subtotal >= 1000 ? 0 : 99;
    const taxAmount = Math.round(subtotal * 0.18 * 100) / 100; // 18% GST
    const totalAmount = subtotal + shippingFee + taxAmount;

    // Generate unique order number (e.g. ORD-2026-874123)
    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // -------------------------------------------------------------
    // DUAL FLOW BRANCHING (Requested explicitly by user)
    // -------------------------------------------------------------

    // CASE 1: CASH ON DELIVERY (COD)
    if (dto.paymentMethod === 'COD') {
      return this.prisma.raw.$transaction(async (tx) => {
        // Authoritative stock deduction inside transaction
        for (const item of validatedItems) {
          if (item.variantId) {
            const currentVariant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
            });

            if (!currentVariant || currentVariant.stockQuantity < item.quantity) {
              throw new BadRequestException(`Stock for ${item.productSnapshot.name} just sold out.`);
            }

            const newStock = currentVariant.stockQuantity - item.quantity;
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQuantity: newStock },
            });

            // Write to immutable inventory ledger
            await tx.inventoryTransaction.create({
              data: {
                productId: item.productId,
                variantId: item.variantId,
                type: 'ORDER_DEDUCTION',
                quantityChange: -item.quantity,
                previousQuantity: currentVariant.stockQuantity,
                newQuantity: newStock,
                reason: `COD Order placed #${orderNumber}`,
              },
            });
          }
        }

        // Create CONFIRMED order immediately for COD
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            subtotal,
            shippingFee,
            taxAmount,
            totalAmount,
            orderStatus: 'CONFIRMED',
            paymentStatus: 'PENDING_COD',
            shippingAddressJson: JSON.stringify(shippingAddress),
            items: {
              create: validatedItems.map((vi) => ({
                productId: vi.productId,
                variantId: vi.variantId,
                quantity: vi.quantity,
                unitPrice: vi.unitPrice,
                totalPrice: vi.totalPrice,
                productSnapshotJson: JSON.stringify(vi.productSnapshot),
              })),
            },
          },
        });

        // Clear purchased cart items
        if (user.cart) {
          await tx.cartItem.deleteMany({ where: { cartId: user.cart.id } });
        }

        // Send order confirmation notification
        await tx.notificationLog.create({
          data: {
            recipient: user.email || user.phone || 'customer',
            channel: user.email ? 'EMAIL' : 'SMS',
            subject: `Ayngaran Store: COD Order Confirmed #${orderNumber}`,
            content: `Your Cash on Delivery order #${orderNumber} for ₹${totalAmount} has been confirmed and is being packed!`,
            status: 'SENT',
          },
        });

        return {
          message: 'Order confirmed successfully via Cash on Delivery',
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          totalAmount: Number(order.totalAmount),
          paymentRequired: false,
        };
      });
    }

    // CASE 2: ONLINE PAYMENT (MOCK / RAZORPAY / STRIPE)
    // Create PENDING order (Stock is NOT deducted yet. Stock will be deducted upon server verification!)
    const pendingOrder = await this.prisma.raw.order.create({
      data: {
        orderNumber,
        userId,
        subtotal,
        shippingFee,
        taxAmount,
        totalAmount,
        orderStatus: 'PENDING',
        paymentStatus: 'UNPAID',
        shippingAddressJson: JSON.stringify(shippingAddress),
        items: {
          create: validatedItems.map((vi) => ({
            productId: vi.productId,
            variantId: vi.variantId,
            quantity: vi.quantity,
            unitPrice: vi.unitPrice,
            totalPrice: vi.totalPrice,
            productSnapshotJson: JSON.stringify(vi.productSnapshot),
          })),
        },
      },
    });

    return {
      message: 'Pending order created. Proceed to payment verification.',
      orderId: pendingOrder.id,
      orderNumber: pendingOrder.orderNumber,
      orderStatus: pendingOrder.orderStatus,
      paymentStatus: pendingOrder.paymentStatus,
      totalAmount: Number(pendingOrder.totalAmount),
      paymentRequired: true,
      paymentMethod: dto.paymentMethod,
    };
  }
}
