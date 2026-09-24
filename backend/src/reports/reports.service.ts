import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // ADMIN DASHBOARD OVERVIEW METRICS
  // -------------------------------------------------------------

  async getDashboardSummary() {
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalCategories,
      totalBrands,
      pendingOrdersCount,
      confirmedOrdersCount,
      deliveredOrdersCount,
      recentOrders,
      allVariants,
    ] = await Promise.all([
      this.prisma.client.user.count(),
      this.prisma.client.order.count(),
      this.prisma.client.product.count(),
      this.prisma.client.category.count(),
      this.prisma.client.brand.count(),
      this.prisma.client.order.count({ where: { orderStatus: 'PENDING' } }),
      this.prisma.client.order.count({ where: { orderStatus: 'CONFIRMED' } }),
      this.prisma.client.order.count({ where: { orderStatus: 'DELIVERED' } }),
      this.prisma.client.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
      }),
      this.prisma.client.productVariant.findMany({
        include: { product: { select: { minStockAlert: true, name: true } } },
      }),
    ]);

    // Calculate revenue from paid/confirmed/delivered orders
    const paidOrders = await this.prisma.client.order.findMany({
      where: { paymentStatus: { in: ['PAID', 'PENDING_COD'] }, orderStatus: { not: 'CANCELLED' } },
      select: { totalAmount: true },
    });

    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const lowStockCount = allVariants.filter((v) => v.stockQuantity <= v.product.minStockAlert).length;

    return {
      metrics: {
        totalRevenue,
        totalOrders,
        totalUsers,
        totalProducts,
        totalCategories,
        totalBrands,
        lowStockCount,
        orderPipeline: {
          pending: pendingOrdersCount,
          confirmed: confirmedOrdersCount,
          delivered: deliveredOrdersCount,
        },
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.user.name,
        customerEmail: o.user.email,
        totalAmount: Number(o.totalAmount),
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
        itemCount: o.items.length,
        createdAt: o.createdAt,
      })),
    };
  }

  // -------------------------------------------------------------
  // LOCATION-BASED ORDER REPORTING
  // -------------------------------------------------------------

  async getLocationOrdersReport(query: {
    state?: string;
    city?: string;
    categoryId?: number;
    brandId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const orders = await this.prisma.client.order.findMany({
      where: {
        orderStatus: { not: 'CANCELLED' },
        createdAt: {
          gte: query.startDate ? new Date(query.startDate) : undefined,
          lte: query.endDate ? new Date(query.endDate) : undefined,
        },
      },
      include: {
        items: {
          include: {
            product: { select: { categoryId: true, brandId: true } },
          },
        },
      },
    });

    // Group by State & City from shipping address JSON
    const locationMap = new Map<string, { state: string; city: string; orderCount: number; revenue: number }>();

    for (const o of orders) {
      let address: any = {};
      try {
        address = JSON.parse(o.shippingAddressJson || '{}');
      } catch {}

      const state = address.state || 'Unknown State';
      const city = address.city || 'Unknown City';

      if (query.state && !state.toLowerCase().includes(query.state.toLowerCase())) continue;
      if (query.city && !city.toLowerCase().includes(query.city.toLowerCase())) continue;

      // Filter by category or brand if specified
      if (query.categoryId) {
        const matchesCategory = o.items.some((i) => i.product.categoryId === Number(query.categoryId));
        if (!matchesCategory) continue;
      }

      if (query.brandId) {
        const matchesBrand = o.items.some((i) => i.product.brandId === Number(query.brandId));
        if (!matchesBrand) continue;
      }

      const key = `${state}:::${city}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, { state, city, orderCount: 0, revenue: 0 });
      }

      const group = locationMap.get(key)!;
      group.orderCount++;
      group.revenue += Number(o.totalAmount);
    }

    return Array.from(locationMap.values()).sort((a, b) => b.revenue - a.revenue);
  }

  // -------------------------------------------------------------
  // CATEGORY & BRAND SALES REPORTS
  // -------------------------------------------------------------

  async getCategorySalesReport() {
    const orderItems = await this.prisma.client.orderItem.findMany({
      where: {
        order: { orderStatus: { not: 'CANCELLED' } },
      },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    const categoryMap = new Map<string, { categoryId: number; name: string; itemsSold: number; unitsSold: number; totalRevenue: number; revenue: number }>();

    for (const item of orderItems) {
      const cat = item.product.category;
      if (!categoryMap.has(cat.categoryCode)) {
        categoryMap.set(cat.categoryCode, {
          categoryId: cat.id,
          name: cat.name,
          itemsSold: 0,
          unitsSold: 0,
          totalRevenue: 0,
          revenue: 0,
        });
      }

      const entry = categoryMap.get(cat.categoryCode)!;
      entry.itemsSold += item.quantity;
      entry.unitsSold += item.quantity;
      entry.totalRevenue += Number(item.totalPrice);
      entry.revenue += Number(item.totalPrice);
    }

    return Array.from(categoryMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  async getBrandSalesReport() {
    const orderItems = await this.prisma.client.orderItem.findMany({
      where: {
        order: { orderStatus: { not: 'CANCELLED' } },
      },
      include: {
        product: {
          include: { brand: true },
        },
      },
    });

    const brandMap = new Map<string, { brandId: number; name: string; itemsSold: number; unitsSold: number; totalRevenue: number; revenue: number }>();

    for (const item of orderItems) {
      const brand = item.product.brand;
      if (!brandMap.has(brand.brandCode)) {
        brandMap.set(brand.brandCode, {
          brandId: brand.id,
          name: brand.name,
          itemsSold: 0,
          unitsSold: 0,
          totalRevenue: 0,
          revenue: 0,
        });
      }

      const entry = brandMap.get(brand.brandCode)!;
      entry.itemsSold += item.quantity;
      entry.unitsSold += item.quantity;
      entry.totalRevenue += Number(item.totalPrice);
      entry.revenue += Number(item.totalPrice);
    }

    return Array.from(brandMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  // Helper to convert report data arrays to CSV string
  exportCsv(data: any[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header];
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}
