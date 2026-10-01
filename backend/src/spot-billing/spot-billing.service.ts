import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpotBillDto, SpotBillItemDto } from './dto/create-spot-bill.dto';
import { CalculateSpotBillDto } from './dto/calculate-spot-bill.dto';
import { ReturnSpotBillDto } from './dto/return-spot-bill.dto';
import { CancelSpotBillDto } from './dto/cancel-spot-bill.dto';
import { SpotBillQueryDto } from './dto/spot-bill-query.dto';
import {
  computeGstBreakdown,
  resolveGstStateCode,
  getSupplyType,
  SELLER_STATE_NAME,
} from '../common/utils/gst.util';
import { createPaginatedResponse } from '../common/utils/pagination.util';

function formatVariantWeight(weight: any): string {
  if (weight === null || weight === undefined || weight === '') return '';
  const w = Number(weight);
  if (isNaN(w) || w <= 0) return '';
  if (w < 1) {
    return `${Math.round(w * 1000)}g`;
  } else if (w < 10) {
    return `${w}kg`;
  } else if (w >= 1000) {
    return `${w / 1000}kg`;
  } else {
    return `${w}g`;
  }
}

@Injectable()
export class SpotBillingService {
  private readonly logger = new Logger(SpotBillingService.name);

  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // 1. PRODUCT SEARCH & BARCODE SCANNING (POS CATALOG)
  // -------------------------------------------------------------

  async searchProducts(query?: string) {
    const s = (query || '').trim();

    const where: any = {
      deletedAt: null,
      status: 'ACTIVE',
    };

    if (s) {
      where.OR = [
        { name: { contains: s } },
        { productCode: { contains: s } },
        { brand: { name: { contains: s } } },
        { category: { name: { contains: s } } },
        { variants: { some: { sku: { contains: s } } } },
        { variants: { some: { barcode: { contains: s } } } },
      ];
    }

    const products = await this.prisma.client.product.findMany({
      where,
      take: s ? 30 : 20,
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, gstRate: true } },
        images: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        variants: {
          where: { deletedAt: null, status: 'ACTIVE' },
          include: {
            variantValues: {
              include: {
                attribute: { select: { name: true } },
                attributeValue: { select: { displayName: true, value: true } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Format products and variants for POS UX
    return products.map((p) => {
      const primaryImage = p.images?.[0]?.url || null;
      const categoryGst = Number(p.category?.gstRate ?? 5);
      const effectiveGstRate = p.useCategoryGst
        ? categoryGst
        : p.gstRate !== null && p.gstRate !== undefined
        ? Number(p.gstRate)
        : categoryGst;

      return {
        id: p.id,
        productCode: p.productCode,
        name: p.name,
        brand: p.brand?.name || 'Ayngaran',
        category: p.category?.name || 'General',
        imageUrl: primaryImage,
        effectiveGstRate,
        variants: p.variants.map((v) => {
          const attributeLabel = v.variantValues
            ?.map((vv) => vv.attributeValue?.displayName || vv.attributeValue?.value)
            .filter(Boolean)
            .join(' / ');
          const weightLabel = formatVariantWeight(v.weight);
          const variantLabel = attributeLabel || weightLabel || 'Standard';

          return {
            id: v.id,
            productId: p.id,
            sku: v.sku,
            barcode: v.barcode,
            weight: v.weight ? Number(v.weight) : null,
            price: Number(v.price),
            stockQuantity: v.stockQuantity,
            variantLabel,
          };
        }),
      };
    });
  }

  // -------------------------------------------------------------
  // 2. CUSTOMER LOOKUP (Walk-in vs Registered Customer)
  // -------------------------------------------------------------

  async searchCustomers(search?: string) {
    const s = (search || '').trim();
    if (!s) return [];

    const users = await this.prisma.client.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { name: { contains: s } },
          { phone: { contains: s } },
          { email: { contains: s } },
          { userCode: { contains: s } },
        ],
      },
      take: 10,
      select: {
        id: true,
        userCode: true,
        name: true,
        email: true,
        phone: true,
        addresses: {
          where: { deletedAt: null },
          orderBy: { isDefault: 'desc' },
          take: 1,
        },
      },
    });

    return users.map((u) => {
      const addr = u.addresses?.[0];
      return {
        id: u.id,
        userCode: u.userCode,
        name: u.name || 'Customer',
        email: u.email,
        phone: u.phone,
        address: addr
          ? `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}`
          : null,
        state: addr?.state || 'Tamil Nadu',
      };
    });
  }

  // -------------------------------------------------------------
  // 3. AUTHORITATIVE BILL CALCULATION PREVIEW
  // -------------------------------------------------------------

  async calculateBill(dto: CalculateSpotBillDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one product item is required.');
    }

    const state = dto.customerState || SELLER_STATE_NAME;
    const supplyType = getSupplyType(state);

    let subtotal = 0;
    const calculatedItems: any[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.client.product.findUnique({
        where: { id: item.productId, deletedAt: null },
        include: {
          category: { select: { id: true, name: true, gstRate: true } },
          brand: { select: { id: true, name: true } },
          images: { where: { deletedAt: null }, take: 1, orderBy: { sortOrder: 'asc' } },
        },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      let variant: any = null;
      if (item.variantId) {
        variant = await this.prisma.client.productVariant.findUnique({
          where: { id: item.variantId, deletedAt: null },
          include: {
            variantValues: {
              include: {
                attributeValue: true,
              },
            },
          },
        });
        if (!variant || variant.productId !== product.id) {
          throw new NotFoundException(`Variant with ID ${item.variantId} not found for this product`);
        }
      } else {
        // Find default variant if not specified
        variant = await this.prisma.client.productVariant.findFirst({
          where: { productId: product.id, deletedAt: null, status: 'ACTIVE' },
        });
      }

      const unitPrice = variant ? Number(variant.price) : Number(product.basePrice);
      const quantity = item.quantity;
      const lineSubtotal = Math.round(unitPrice * quantity * 100) / 100;
      subtotal += lineSubtotal;

      const categoryGst = Number(product.category?.gstRate ?? 5);
      const gstRate = product.useCategoryGst
        ? categoryGst
        : product.gstRate !== null && product.gstRate !== undefined
        ? Number(product.gstRate)
        : categoryGst;

      const attributeLabel = variant?.variantValues
        ?.map((vv: any) => vv.attributeValue?.displayName || vv.attributeValue?.value)
        .filter(Boolean)
        .join(' / ');
      const weightLabel = formatVariantWeight(variant?.weight);
      const variantLabel = attributeLabel || weightLabel || 'Standard';

      calculatedItems.push({
        productId: product.id,
        variantId: variant?.id || null,
        productName: product.name,
        productCode: product.productCode,
        brand: product.brand?.name || 'Ayngaran',
        sku: variant?.sku || product.productCode,
        variantLabel,
        imageUrl: product.images?.[0]?.url || null,
        unitPrice,
        quantity,
        availableStock: variant?.stockQuantity ?? 0,
        lineSubtotal,
        gstRate,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // Calculate discount
    let discountAmount = 0;
    if (dto.discountType === 'PERCENTAGE' && dto.discountValue) {
      const pct = Math.max(0, Math.min(100, Number(dto.discountValue)));
      discountAmount = Math.round((subtotal * (pct / 100)) * 100) / 100;
    } else if (dto.discountType === 'FIXED' && dto.discountValue) {
      discountAmount = Math.round(Math.min(subtotal, Math.max(0, Number(dto.discountValue))) * 100) / 100;
    }

    const totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;

    // Distribute discount proportionally across items and calculate item-level reverse GST
    let totalTaxableAmount = 0;
    let totalCgstAmount = 0;
    let totalSgstAmount = 0;
    let totalIgstAmount = 0;

    const itemsWithTax = calculatedItems.map((item) => {
      // Line discount portion
      const itemRatio = subtotal > 0 ? item.lineSubtotal / subtotal : 0;
      const itemDiscount = Math.round(discountAmount * itemRatio * 100) / 100;
      const lineFinalPrice = Math.round((item.lineSubtotal - itemDiscount) * 100) / 100;

      // Reverse GST calculation: MRP includes GST
      const taxableAmount = Math.round((lineFinalPrice / (1 + item.gstRate / 100)) * 100) / 100;
      const totalTax = Math.round((lineFinalPrice - taxableAmount) * 100) / 100;

      const breakdown = computeGstBreakdown(taxableAmount, totalTax, state);

      totalTaxableAmount += taxableAmount;
      totalCgstAmount += breakdown.cgstAmount;
      totalSgstAmount += breakdown.sgstAmount;
      totalIgstAmount += breakdown.igstAmount;

      return {
        ...item,
        discountAmount: itemDiscount,
        taxableAmount,
        cgstRate: supplyType === 'INTRA_STATE' ? item.gstRate / 2 : 0,
        cgstAmount: breakdown.cgstAmount,
        sgstRate: supplyType === 'INTRA_STATE' ? item.gstRate / 2 : 0,
        sgstAmount: breakdown.sgstAmount,
        igstRate: supplyType === 'INTER_STATE' ? item.gstRate : 0,
        igstAmount: breakdown.igstAmount,
        totalTaxAmount: totalTax,
        totalPrice: lineFinalPrice,
      };
    });

    totalTaxableAmount = Math.round(totalTaxableAmount * 100) / 100;
    totalCgstAmount = Math.round(totalCgstAmount * 100) / 100;
    totalSgstAmount = Math.round(totalSgstAmount * 100) / 100;
    totalIgstAmount = Math.round(totalIgstAmount * 100) / 100;
    const totalTaxAmount = Math.round((totalCgstAmount + totalSgstAmount + totalIgstAmount) * 100) / 100;

    return {
      subtotal,
      discountType: dto.discountType || null,
      discountValue: dto.discountValue || 0,
      discountAmount,
      taxableAmount: totalTaxableAmount,
      supplyType,
      customerState: state,
      customerStateCode: resolveGstStateCode(state),
      cgstAmount: totalCgstAmount,
      sgstAmount: totalSgstAmount,
      igstAmount: totalIgstAmount,
      totalTaxAmount,
      totalAmount,
      grandTotal: totalAmount,
      isInterState: supplyType === 'INTER_STATE',
      items: itemsWithTax,
    };
  }

  // -------------------------------------------------------------
  // 4. GENERATE SPOT BILL (ATOMIC DATABASE TRANSACTION)
  // -------------------------------------------------------------

  async createSpotBill(dto: CreateSpotBillDto, staff: any) {
    if (!staff || !staff.id) {
      throw new BadRequestException('Cashier authentication is required.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required to generate a bill.');
    }

    // Authoritative calculation
    const calc = await this.calculateBill({
      items: dto.items,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      customerState: dto.customerState,
    });

    // Validate payment amount for cash
    let changeReturned = 0;
    let amountReceived = dto.amountReceived !== undefined ? Number(dto.amountReceived) : calc.totalAmount;

    if (dto.paymentMethod === 'CASH') {
      if (amountReceived < calc.totalAmount) {
        throw new BadRequestException(
          `Amount received (₹${amountReceived}) cannot be less than Bill Total (₹${calc.totalAmount}).`,
        );
      }
      changeReturned = Math.round((amountReceived - calc.totalAmount) * 100) / 100;
    } else {
      amountReceived = calc.totalAmount;
      changeReturned = 0;
    }

    // Atomic Database Transaction
    return (this.prisma.raw as any).$transaction(async (tx: any) => {
      // 1. Stock Validation and Deductions (Concurrency-Safe)
      for (const item of calc.items) {
        if (item.variantId) {
          const currentVariant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { id: true, sku: true, stockQuantity: true },
          });

          if (!currentVariant) {
            throw new NotFoundException(`Variant SKU ${item.sku} no longer exists.`);
          }

          if (currentVariant.stockQuantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for ${item.productName} (${item.sku}). Available: ${currentVariant.stockQuantity}, Requested: ${item.quantity}`,
            );
          }

          // Atomic conditional update ensuring stock never drops below 0
          const updateResult = await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              stockQuantity: { gte: item.quantity },
            },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });

          if (updateResult.count === 0) {
            throw new BadRequestException(
              `Stock for ${item.productName} (${item.sku}) was depleted by a concurrent transaction. Please refresh and try again.`,
            );
          }

          // Append to immutable inventory ledger
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              variantId: item.variantId,
              staffId: staff.id,
              type: 'SPOT_BILL_SALE',
              quantityChange: -item.quantity,
              previousQuantity: currentVariant.stockQuantity,
              newQuantity: currentVariant.stockQuantity - item.quantity,
              reason: `Spot Bill Sale: ${item.sku} x${item.quantity}`,
            },
          });
        }
      }

      // 2. Generate Sequential Bill Number and Invoice Number
      const currentYear = new Date().getFullYear();
      const billCount = await tx.spotBill.count();
      const sequence = (billCount + 1).toString().padStart(6, '0');
      const billNumber = `SB-${currentYear}-${sequence}`;
      const invoiceNumber = `INV-${billNumber}`;

      // 3. Create SpotBill Header
      const spotBill = await tx.spotBill.create({
        data: {
          billNumber,
          invoiceNumber,
          customerId: dto.customerId || null,
          cashierId: staff.id,
          cashierName: staff.name || 'Staff Cashier',
          customerName: dto.customerName?.trim() || 'Walk-in Customer',
          customerPhone: dto.customerPhone?.trim() || null,
          customerEmail: dto.customerEmail?.trim() || null,
          customerGstin: dto.customerGstin?.trim() || null,
          customerAddress: dto.customerAddress?.trim() || null,
          customerState: calc.customerState,
          customerStateCode: calc.customerStateCode,
          supplyType: calc.supplyType,
          subtotal: calc.subtotal,
          discountType: calc.discountType,
          discountValue: calc.discountValue,
          discountAmount: calc.discountAmount,
          taxableAmount: calc.taxableAmount,
          cgstAmount: calc.cgstAmount,
          sgstAmount: calc.sgstAmount,
          igstAmount: calc.igstAmount,
          totalTaxAmount: calc.totalTaxAmount,
          totalAmount: calc.totalAmount,
          paymentStatus: 'PAID',
          billStatus: 'COMPLETED',
          paymentMethod: dto.paymentMethod,
          paymentReference: dto.paymentReference?.trim() || null,
          amountReceived,
          changeReturned,
          notes: dto.notes?.trim() || null,
        },
      });

      // 4. Create SpotBillItems with immutable historical snapshots
      for (const item of calc.items) {
        await tx.spotBillItem.create({
          data: {
            spotBillId: spotBill.id,
            productId: item.productId,
            variantId: item.variantId,
            productNameSnapshot: item.productName,
            productCodeSnapshot: item.productCode,
            brandSnapshot: item.brand,
            skuSnapshot: item.sku,
            variantLabelSnapshot: item.variantLabel,
            imageUrlSnapshot: item.imageUrl,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            returnedQuantity: 0,
            discountAmount: item.discountAmount,
            taxableAmount: item.taxableAmount,
            gstRate: item.gstRate,
            cgstRate: item.cgstRate,
            cgstAmount: item.cgstAmount,
            sgstRate: item.sgstRate,
            sgstAmount: item.sgstAmount,
            igstRate: item.igstRate,
            igstAmount: item.igstAmount,
            totalTaxAmount: item.totalTaxAmount,
            totalPrice: item.totalPrice,
          },
        });
      }

      // 5. Record SpotBillPayment
      await tx.spotBillPayment.create({
        data: {
          spotBillId: spotBill.id,
          paymentMethod: dto.paymentMethod,
          amount: calc.totalAmount,
          amountReceived,
          changeReturned,
          referenceNumber: dto.paymentReference?.trim() || null,
          status: 'COMPLETED',
        },
      });

      // 6. Log to immutable AuditLog
      try {
        await tx.auditLog.create({
          data: {
            staffId: staff.id,
            action: 'SPOT_BILL_CREATED',
            entityType: 'SpotBill',
            entityId: spotBill.id.toString(),
            newValueJson: JSON.stringify({
              billNumber: spotBill.billNumber,
              invoiceNumber: spotBill.invoiceNumber,
              totalAmount: spotBill.totalAmount,
              paymentMethod: spotBill.paymentMethod,
              itemsCount: calc.items.length,
            }),
          },
        });
      } catch (err: any) {
        this.logger.warn(`Could not write audit log: ${err.message}`);
      }

      // Return fully hydrated completed bill
      return tx.spotBill.findUnique({
        where: { id: spotBill.id },
        include: {
          items: true,
          payments: true,
          cashier: { select: { id: true, name: true, staffCode: true } },
          customer: { select: { id: true, userCode: true, name: true, email: true, phone: true } },
        },
      });
    });
  }

  // -------------------------------------------------------------
  // 5. BILLING HISTORY WITH SERVER-SIDE PAGINATION & SEARCH
  // -------------------------------------------------------------

  async findAll(query: SpotBillQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { billNumber: { contains: s } },
        { invoiceNumber: { contains: s } },
        { customerName: { contains: s } },
        { customerPhone: { contains: s } },
        { customerEmail: { contains: s } },
        { paymentReference: { contains: s } },
        { items: { some: { productNameSnapshot: { contains: s } } } },
        { items: { some: { skuSnapshot: { contains: s } } } },
      ];
    }

    if (query.paymentMethod && query.paymentMethod !== 'ALL') {
      where.paymentMethod = query.paymentMethod;
    }

    if (query.paymentStatus && query.paymentStatus !== 'ALL') {
      where.paymentStatus = query.paymentStatus;
    }

    if (query.billStatus && query.billStatus !== 'ALL') {
      where.billStatus = query.billStatus;
    }

    if (query.cashierId) {
      where.cashierId = Number(query.cashierId);
    }

    if (query.customerId) {
      where.customerId = Number(query.customerId);
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(`${query.startDate}T00:00:00.000Z`);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(`${query.endDate}T23:59:59.999Z`);
      }
    }

    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      where.totalAmount = {};
      if (query.minAmount !== undefined) where.totalAmount.gte = Number(query.minAmount);
      if (query.maxAmount !== undefined) where.totalAmount.lte = Number(query.maxAmount);
    }

    const [total, bills] = await Promise.all([
      (this.prisma.client as any).spotBill.count({ where }),
      (this.prisma.client as any).spotBill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          payments: true,
          returns: { include: { items: true } },
          cashier: { select: { id: true, name: true, staffCode: true } },
          customer: { select: { id: true, userCode: true, name: true, email: true, phone: true } },
        },
      }),
    ]);

    const formattedBills = bills.map((b: any) => ({
      ...b,
      subtotal: Number(b.subtotal || 0),
      discountAmount: Number(b.discountAmount || 0),
      taxableAmount: Number(b.taxableAmount || 0),
      cgstAmount: Number(b.cgstAmount || 0),
      sgstAmount: Number(b.sgstAmount || 0),
      igstAmount: Number(b.igstAmount || 0),
      totalTaxAmount: Number(b.totalTaxAmount || 0),
      totalAmount: Number(b.totalAmount || 0),
      amountReceived: Number(b.amountReceived || 0),
      changeReturned: Number(b.changeReturned || 0),
    }));

    return createPaginatedResponse(formattedBills, total, page, limit);
  }

  // -------------------------------------------------------------
  // 6. SINGLE BILL & INVOICE DETAILS
  // -------------------------------------------------------------

  async findOne(id: number) {
    const bill = await (this.prisma.client as any).spotBill.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        returns: {
          include: {
            items: true,
            staff: { select: { id: true, name: true, staffCode: true } },
          },
        },
        cashier: { select: { id: true, name: true, email: true, staffCode: true } },
        customer: { select: { id: true, userCode: true, name: true, email: true, phone: true } },
      },
    });

    if (!bill) {
      throw new NotFoundException(`Spot bill #${id} not found.`);
    }

    return {
      ...bill,
      subtotal: Number(bill.subtotal || 0),
      discountAmount: Number(bill.discountAmount || 0),
      taxableAmount: Number(bill.taxableAmount || 0),
      cgstAmount: Number(bill.cgstAmount || 0),
      sgstAmount: Number(bill.sgstAmount || 0),
      igstAmount: Number(bill.igstAmount || 0),
      totalTaxAmount: Number(bill.totalTaxAmount || 0),
      totalAmount: Number(bill.totalAmount || 0),
      amountReceived: Number(bill.amountReceived || 0),
      changeReturned: Number(bill.changeReturned || 0),
      items: (bill.items || []).map((i: any) => ({
        ...i,
        unitPrice: Number(i.unitPrice || 0),
        discountAmount: Number(i.discountAmount || 0),
        taxableAmount: Number(i.taxableAmount || 0),
        gstRate: Number(i.gstRate || 0),
        cgstRate: Number(i.cgstRate || 0),
        cgstAmount: Number(i.cgstAmount || 0),
        sgstRate: Number(i.sgstRate || 0),
        sgstAmount: Number(i.sgstAmount || 0),
        igstRate: Number(i.igstRate || 0),
        igstAmount: Number(i.igstAmount || 0),
        totalTaxAmount: Number(i.totalTaxAmount || 0),
        totalPrice: Number(i.totalPrice || 0),
      })),
    };
  }

  async getInvoice(id: number) {
    const bill = await this.findOne(id);

    return {
      invoiceNumber: bill.invoiceNumber,
      billNumber: bill.billNumber,
      date: bill.createdAt,
      customer: {
        name: bill.customerName,
        phone: bill.customerPhone,
        email: bill.customerEmail,
        gstin: bill.customerGstin,
        address: bill.customerAddress,
        state: bill.customerState,
        stateCode: bill.customerStateCode,
      },
      cashier: {
        id: bill.cashier?.id,
        name: bill.cashierName,
        staffCode: bill.cashier?.staffCode,
      },
      payment: {
        method: bill.paymentMethod,
        reference: bill.paymentReference,
        status: bill.paymentStatus,
        amountReceived: bill.amountReceived ? Number(bill.amountReceived) : Number(bill.totalAmount),
        changeReturned: bill.changeReturned ? Number(bill.changeReturned) : 0,
      },
      supplyType: bill.supplyType,
      items: bill.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productNameSnapshot,
        productCode: i.productCodeSnapshot,
        brand: i.brandSnapshot,
        sku: i.skuSnapshot,
        variantLabel: i.variantLabelSnapshot,
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
        returnedQuantity: i.returnedQuantity,
        discountAmount: Number(i.discountAmount),
        taxableAmount: Number(i.taxableAmount),
        gstRate: Number(i.gstRate),
        cgstRate: Number(i.cgstRate),
        cgstAmount: Number(i.cgstAmount),
        sgstRate: Number(i.sgstRate),
        sgstAmount: Number(i.sgstAmount),
        igstRate: Number(i.igstRate),
        igstAmount: Number(i.igstAmount),
        totalTaxAmount: Number(i.totalTaxAmount),
        totalPrice: Number(i.totalPrice),
      })),
      subtotal: Number(bill.subtotal),
      discountAmount: Number(bill.discountAmount),
      taxableAmount: Number(bill.taxableAmount),
      cgstAmount: Number(bill.cgstAmount),
      sgstAmount: Number(bill.sgstAmount),
      igstAmount: Number(bill.igstAmount),
      totalTaxAmount: Number(bill.totalTaxAmount),
      totalAmount: Number(bill.totalAmount),
      notes: bill.notes,
      returns: bill.returns,
    };
  }

  // -------------------------------------------------------------
  // 7. RETURNS & REFUNDS (STOCK RESTORATION)
  // -------------------------------------------------------------

  async returnBill(id: number, dto: ReturnSpotBillDto, staff: any) {
    if (!staff || !staff.id) {
      throw new BadRequestException('Staff authentication required for return operation.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item must be returned.');
    }

    const bill = await (this.prisma.client as any).spotBill.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!bill) {
      throw new NotFoundException(`Spot Bill #${id} not found.`);
    }

    if (bill.billStatus === 'CANCELLED') {
      throw new BadRequestException('Cannot process return on a cancelled bill.');
    }

    return (this.prisma.raw as any).$transaction(async (tx: any) => {
      let totalRefundAmount = 0;
      let totalTaxRefundAmount = 0;
      const returnItemRecords: any[] = [];

      for (const reqItem of dto.items) {
        const billItem = bill.items.find((i) => i.id === reqItem.spotBillItemId);
        if (!billItem) {
          throw new BadRequestException(`Bill item #${reqItem.spotBillItemId} does not belong to this bill.`);
        }

        const remainingSoldQty = billItem.quantity - billItem.returnedQuantity;
        if (reqItem.quantity <= 0 || reqItem.quantity > remainingSoldQty) {
          throw new BadRequestException(
            `Invalid return quantity (${reqItem.quantity}) for ${billItem.productNameSnapshot}. Max returnable: ${remainingSoldQty}`,
          );
        }

        // Calculate refund amount based on unit billed price after line discount
        const effectiveUnitTotal = Number(billItem.totalPrice) / billItem.quantity;
        const itemRefund = Math.round(effectiveUnitTotal * reqItem.quantity * 100) / 100;
        totalRefundAmount += itemRefund;

        // Restore Stock
        if (billItem.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: billItem.variantId },
            select: { id: true, stockQuantity: true },
          });

          if (variant) {
            await tx.productVariant.update({
              where: { id: billItem.variantId },
              data: { stockQuantity: { increment: reqItem.quantity } },
            });

            // Append to immutable inventory ledger
            await tx.inventoryTransaction.create({
              data: {
                productId: billItem.productId,
                variantId: billItem.variantId,
                staffId: staff.id,
                type: 'SPOT_BILL_RETURN',
                quantityChange: reqItem.quantity,
                previousQuantity: variant.stockQuantity,
                newQuantity: variant.stockQuantity + reqItem.quantity,
                reason: `Spot Bill Return: ${billItem.skuSnapshot} x${reqItem.quantity} (Bill: ${bill.billNumber})`,
              },
            });
          }
        }

        // Update item returned quantity
        await tx.spotBillItem.update({
          where: { id: billItem.id },
          data: { returnedQuantity: { increment: reqItem.quantity } },
        });

        returnItemRecords.push({
          spotBillItemId: billItem.id,
          productId: billItem.productId,
          variantId: billItem.variantId,
          quantity: reqItem.quantity,
          unitPrice: billItem.unitPrice,
          refundAmount: itemRefund,
          taxRefundAmount: 0,
        });
      }

      totalRefundAmount = Math.round(totalRefundAmount * 100) / 100;

      // Generate Return Number: SBR-YYYY-XXXXXX
      const returnCount = await tx.spotBillReturn.count();
      const returnNumber = `SBR-${new Date().getFullYear()}-${(returnCount + 1).toString().padStart(6, '0')}`;

      // Create SpotBillReturn Header
      const returnRecord = await tx.spotBillReturn.create({
        data: {
          returnNumber,
          spotBillId: bill.id,
          staffId: staff.id,
          staffName: staff.name || 'Staff',
          reason: dto.reason.trim(),
          refundAmount: totalRefundAmount,
          refundMethod: dto.refundMethod || 'CASH',
          refundReference: dto.refundReference || null,
          status: 'COMPLETED',
        },
      });

      // Create SpotBillReturnItems
      for (const rItem of returnItemRecords) {
        await tx.spotBillReturnItem.create({
          data: {
            returnId: returnRecord.id,
            spotBillItemId: rItem.spotBillItemId,
            productId: rItem.productId,
            variantId: rItem.variantId,
            quantity: rItem.quantity,
            unitPrice: rItem.unitPrice,
            refundAmount: rItem.refundAmount,
            taxRefundAmount: 0,
          },
        });
      }

      // Check if all items are completely returned
      const updatedItems = await tx.spotBillItem.findMany({
        where: { spotBillId: bill.id },
      });

      const allFullyReturned = updatedItems.every((i) => i.returnedQuantity >= i.quantity);

      await tx.spotBill.update({
        where: { id: bill.id },
        data: {
          billStatus: allFullyReturned ? 'FULLY_RETURNED' : 'PARTIALLY_RETURNED',
          paymentStatus: allFullyReturned ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        },
      });

      // Audit Log
      try {
        await tx.auditLog.create({
          data: {
            staffId: staff.id,
            action: 'SPOT_BILL_RETURNED',
            entityType: 'SpotBill',
            entityId: bill.id.toString(),
            newValueJson: JSON.stringify({
              returnNumber,
              refundAmount: totalRefundAmount,
              reason: dto.reason,
            }),
          },
        });
      } catch (err: any) {
        this.logger.warn(`Could not write audit log: ${err.message}`);
      }

      return tx.spotBill.findUnique({
        where: { id: bill.id },
        include: {
          items: true,
          returns: { include: { items: true } },
          payments: true,
        },
      });
    });
  }

  // -------------------------------------------------------------
  // 8. BILL CANCELLATION
  // -------------------------------------------------------------

  async cancelBill(id: number, dto: CancelSpotBillDto, staff: any) {
    if (!staff || !staff.id) {
      throw new BadRequestException('Staff authentication required for cancellation.');
    }

    const bill = await (this.prisma.client as any).spotBill.findUnique({
      where: { id },
      include: { items: true, returns: true },
    });

    if (!bill) {
      throw new NotFoundException(`Spot bill #${id} not found.`);
    }

    if (bill.billStatus === 'CANCELLED') {
      throw new BadRequestException('This bill is already cancelled.');
    }

    if (bill.returns && bill.returns.length > 0) {
      throw new BadRequestException('Cannot cancel a bill with active returns. Use return module instead.');
    }

    return (this.prisma.raw as any).$transaction(async (tx: any) => {
      // Revert all item quantities to inventory
      for (const item of bill.items) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { id: true, stockQuantity: true },
          });

          if (variant) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQuantity: { increment: item.quantity } },
            });

            await tx.inventoryTransaction.create({
              data: {
                productId: item.productId,
                variantId: item.variantId,
                staffId: staff.id,
                type: 'SPOT_BILL_CANCEL_REVERSAL',
                quantityChange: item.quantity,
                previousQuantity: variant.stockQuantity,
                newQuantity: variant.stockQuantity + item.quantity,
                reason: `Cancellation reversal for Spot Bill #${bill.billNumber}: ${dto.reason}`,
              },
            });
          }
        }
      }

      // Mark bill as cancelled
      const updated = await tx.spotBill.update({
        where: { id: bill.id },
        data: {
          billStatus: 'CANCELLED',
          paymentStatus: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: staff.id,
          cancelReason: dto.reason.trim(),
        },
        include: { items: true, payments: true },
      });

      // Audit Log
      try {
        await tx.auditLog.create({
          data: {
            staffId: staff.id,
            action: 'SPOT_BILL_CANCELLED',
            entityType: 'SpotBill',
            entityId: bill.id.toString(),
            newValueJson: JSON.stringify({
              billNumber: bill.billNumber,
              reason: dto.reason,
            }),
          },
        });
      } catch (err: any) {
        this.logger.warn(`Could not write audit log: ${err.message}`);
      }

      return updated;
    });
  }

  // -------------------------------------------------------------
  // 9. SPOT BILLING REPORTS & ANALYTICS
  // -------------------------------------------------------------

  async getReports(startDateStr?: string, endDateStr?: string) {
    const now = new Date();
    // Start of today in server local time
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const fromDate = startDateStr ? new Date(`${startDateStr}T00:00:00.000Z`) : startOfToday;
    const toDate = endDateStr ? new Date(`${endDateStr}T23:59:59.999Z`) : endOfToday;

    // 1. Fetch completed / active bills in range
    const [allBillsInRange, todayBills, allReturnsInRange] = await Promise.all([
      (this.prisma.client as any).spotBill.findMany({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          billStatus: { not: 'CANCELLED' },
        },
        include: {
          items: true,
          payments: true,
          cashier: { select: { id: true, name: true } },
        },
      }),
      (this.prisma.client as any).spotBill.findMany({
        where: {
          createdAt: { gte: startOfToday, lte: endOfToday },
          billStatus: { not: 'CANCELLED' },
        },
        include: {
          items: true,
          payments: true,
        },
      }),
      (this.prisma.client as any).spotBillReturn.findMany({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
        include: {
          items: true,
        },
      }),
    ]);

    // Today's summary calculations
    let todaySales = 0;
    let todayDiscount = 0;
    let todayTax = 0;
    let todayCash = 0;
    let todayUpi = 0;
    let todayCard = 0;

    for (const b of todayBills) {
      const amt = Number(b.totalAmount);
      todaySales += amt;
      todayDiscount += Number(b.discountAmount);
      todayTax += Number(b.totalTaxAmount);

      if (b.paymentMethod === 'CASH') todayCash += amt;
      else if (b.paymentMethod === 'UPI') todayUpi += amt;
      else if (b.paymentMethod === 'CARD') todayCard += amt;
    }

    const todayReturnsTotal = allReturnsInRange
      .filter((r) => r.createdAt >= startOfToday && r.createdAt <= endOfToday)
      .reduce((sum, r) => sum + Number(r.refundAmount), 0);

    const todaySummary = {
      totalBills: todayBills.length,
      grossSales: Math.round(todaySales * 100) / 100,
      totalDiscount: Math.round(todayDiscount * 100) / 100,
      totalTax: Math.round(todayTax * 100) / 100,
      returns: Math.round(todayReturnsTotal * 100) / 100,
      netSales: Math.round((todaySales - todayReturnsTotal) * 100) / 100,
      cashSales: Math.round(todayCash * 100) / 100,
      upiSales: Math.round(todayUpi * 100) / 100,
      cardSales: Math.round(todayCard * 100) / 100,
    };

    // Range summary calculations
    let rangeGrossSales = 0;
    let rangeDiscount = 0;
    let rangeTax = 0;
    const paymentMethodsMap: Record<string, { count: number; total: number }> = {
      CASH: { count: 0, total: 0 },
      UPI: { count: 0, total: 0 },
      CARD: { count: 0, total: 0 },
      OTHER: { count: 0, total: 0 },
    };

    const cashierMap: Record<string, { cashierId: number; name: string; bills: number; totalSales: number }> = {};
    const productSalesMap: Record<string, { productName: string; sku: string; quantity: number; sales: number }> = {};

    for (const b of allBillsInRange) {
      const total = Number(b.totalAmount);
      rangeGrossSales += total;
      rangeDiscount += Number(b.discountAmount);
      rangeTax += Number(b.totalTaxAmount);

      // Payment method
      const method = b.paymentMethod || 'OTHER';
      if (!paymentMethodsMap[method]) {
        paymentMethodsMap[method] = { count: 0, total: 0 };
      }
      paymentMethodsMap[method].count += 1;
      paymentMethodsMap[method].total = Math.round((paymentMethodsMap[method].total + total) * 100) / 100;

      // Cashier
      const cashierKey = String(b.cashierId);
      if (!cashierMap[cashierKey]) {
        cashierMap[cashierKey] = {
          cashierId: b.cashierId,
          name: b.cashierName || b.cashier?.name || 'Staff',
          bills: 0,
          totalSales: 0,
        };
      }
      cashierMap[cashierKey].bills += 1;
      cashierMap[cashierKey].totalSales = Math.round((cashierMap[cashierKey].totalSales + total) * 100) / 100;

      // Products
      for (const item of b.items) {
        const prodKey = `${item.productId}_${item.variantId || 0}`;
        if (!productSalesMap[prodKey]) {
          productSalesMap[prodKey] = {
            productName: item.productNameSnapshot,
            sku: item.skuSnapshot,
            quantity: 0,
            sales: 0,
          };
        }
        productSalesMap[prodKey].quantity += item.quantity - item.returnedQuantity;
        productSalesMap[prodKey].sales = Math.round((productSalesMap[prodKey].sales + Number(item.totalPrice)) * 100) / 100;
      }
    }

    const rangeReturnsTotal = allReturnsInRange.reduce((sum, r) => sum + Number(r.refundAmount), 0);

    const rangeSummary = {
      startDate: fromDate.toISOString().split('T')[0],
      endDate: toDate.toISOString().split('T')[0],
      totalBills: allBillsInRange.length,
      grossSales: Math.round(rangeGrossSales * 100) / 100,
      totalDiscount: Math.round(rangeDiscount * 100) / 100,
      totalTax: Math.round(rangeTax * 100) / 100,
      returns: Math.round(rangeReturnsTotal * 100) / 100,
      netSales: Math.round((rangeGrossSales - rangeReturnsTotal) * 100) / 100,
    };

    const paymentMethods = Object.entries(paymentMethodsMap).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
    }));

    const cashierReports = Object.values(cashierMap).sort((a, b) => b.totalSales - a.totalSales);
    const topProducts = Object.values(productSalesMap).sort((a, b) => b.sales - a.sales).slice(0, 20);

    return {
      todaySummary,
      rangeSummary,
      paymentMethods,
      cashierReports,
      topProducts,
    };
  }
}
