import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { CheckoutService } from './checkout.service';
import { PaymentsService } from '../payments/payments.service';
import { ReviewsService } from '../reviews/reviews.service';
import { ReportsService } from '../reports/reports.service';

async function testCommerceEngine() {
  console.log('🧪 Testing Slice 6, 7, 8, 9, 10: Commerce Engine, Dual Checkout, Payment Verification & Verified Reviews...');

  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const cartService = new CartService(prisma);
  const checkoutService = new CheckoutService(prisma);
  const paymentsService = new PaymentsService(prisma);
  const reviewsService = new ReviewsService(prisma);
  const reportsService = new ReportsService(prisma);

  try {
    // 1. Get sample customer & products
    const customer = await prisma.client.user.findFirst({ where: { email: 'customer@ayngaran.com' } });
    if (!customer) throw new Error('Sample customer not found');

    const samProduct = await prisma.client.product.findUnique({
      where: { productCode: 'PRD-SAM-S26-001' },
      include: { variants: true },
    });
    if (!samProduct || samProduct.variants.length === 0) throw new Error('Samsung product not found');

    const samVariant = samProduct.variants[0];
    const initialSamStock = samVariant.stockQuantity;
    console.log(`  Initial Samsung variant stock (${samVariant.sku}): ${initialSamStock}`);

    // 2. Add to Cart (Shows availability, does not lock stock)
    await cartService.clearCart(customer.id);
    const cart = await cartService.addItem(customer.id, {
      productId: samProduct.id,
      variantId: samVariant.id,
      quantity: 1,
    });
    console.log('  ✅ 1. Cart populated. Subtotal:', cart.subtotal, 'Items:', cart.totalItems);
    console.log('        Non-locking availability checked. Item available:', cart.items[0].isAvailable);

    // 3. Online Checkout Flow: Create Pending Order (Stock NOT deducted yet)
    const onlineCheckoutRes = await checkoutService.processCheckout(customer.id, {
      paymentMethod: 'MOCK',
    });
    console.log('  ✅ 2. Online checkout created PENDING order:', onlineCheckoutRes.orderNumber);
    if (onlineCheckoutRes.orderStatus !== 'PENDING' || !onlineCheckoutRes.paymentRequired) {
      throw new Error('FAIL: Online checkout should produce PENDING order requiring payment!');
    }

    // Verify stock has NOT changed yet
    const variantBeforePay = await prisma.client.productVariant.findUnique({ where: { id: samVariant.id } });
    if (variantBeforePay?.stockQuantity !== initialSamStock) {
      throw new Error('FAIL: Stock was prematurely deducted before payment verification!');
    }
    console.log('  ✅ 3. Verified stock was NOT deducted prior to payment confirmation.');

    // 4. Server-Side Authoritative Payment Verification
    const verifyRes = await paymentsService.verifyAndFinalizePayment(
      {
        orderId: onlineCheckoutRes.orderId,
        gatewayCode: 'MOCK',
        transactionId: 'mock_tx_987654321',
      },
      customer.id,
    );
    console.log('  ✅ 4. Authoritative server-side payment verification completed:');
    console.log(`        Order: ${verifyRes.orderNumber}, Status: ${verifyRes.orderStatus}, Payment: ${verifyRes.paymentStatus}`);

    // Verify stock IS now deducted in MySQL
    const variantAfterPay = await prisma.client.productVariant.findUnique({ where: { id: samVariant.id } });
    if (variantAfterPay?.stockQuantity !== initialSamStock - 1) {
      throw new Error(`FAIL: Stock was not deducted after payment! Expected ${initialSamStock - 1}, got ${variantAfterPay?.stockQuantity}`);
    }
    console.log(`  ✅ 5. Transactional stock deduction verified: ${initialSamStock} -> ${variantAfterPay.stockQuantity}`);

    // 5. Test Verified Buyer Review Rule
    // Customer who purchased Samsung S26 Ultra can leave review:
    const review = await reviewsService.create(customer.id, {
      productId: samProduct.id,
      orderId: onlineCheckoutRes.orderId,
      rating: 5,
      title: 'Exceptional flagship performance!',
      comment: 'The Galaxy S26 Ultra display and battery life are phenomenal. Extremely satisfied with purchase.',
    });
    console.log('  ✅ 6. Verified buyer review submitted successfully. Rating:', review.rating);

    // Non-buyer cannot review:
    try {
      await reviewsService.create(customer.id, {
        productId: 9999, // Unpurchased product
        orderId: onlineCheckoutRes.orderId,
        rating: 1,
        title: 'Fake review',
        comment: 'Never bought this product',
      });
      throw new Error('FAIL: Non-buyer was able to submit a review!');
    } catch (e: any) {
      if (e.message.includes('Only customers who have purchased')) {
        console.log('  ✅ 7. Verified buyer security check prevented unauthorized review');
      } else {
        throw e;
      }
    }

    // 6. Test Location-based Order Reporting
    const locationReport = await reportsService.getLocationOrdersReport({});
    console.log('  ✅ 8. Location-based sales report aggregated:');
    for (const loc of locationReport) {
      console.log(`        ${loc.city}, ${loc.state} -> Orders: ${loc.orderCount}, Revenue: ₹${loc.revenue}`);
    }

    // 7. Test Admin Dashboard Summary
    const summary = await reportsService.getDashboardSummary();
    console.log('  ✅ 9. Admin Dashboard Metrics:');
    console.log('        Total Revenue: ₹', summary.metrics.totalRevenue);
    console.log('        Total Orders:', summary.metrics.totalOrders);
    console.log('        Low Stock Alert Count:', summary.metrics.lowStockCount);

    console.log('🎉 COMMERCE ENGINE, PAYMENTS, CHECKOUT & REPORTING ALL PASSED!');
  } finally {
    await prisma.onModuleDestroy();
  }
}

testCommerceEngine().catch((err) => {
  console.error('❌ Commerce test failed:', err);
  process.exit(1);
});
