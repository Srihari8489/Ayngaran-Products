import { io } from 'socket.io-client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { EmailDeliveryService } from '../auth/email-delivery.service';
import { OrdersService } from '../orders/orders.service';
import { generateOtpEmailHtml } from '../auth/otp-email.template';
import { generateOrderStatusEmailHtml } from './order-status-email.template';

async function runVerificationSuite() {
  console.log('🧪 Starting Real-Time Customer Order Status & Email Verification Suite...\n');

  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const jwtSecret =
    process.env.JWT_SECRET || 'ayngaran_secret_jwt_key_2026_super_secure_access_token';
  const jwtService = new JwtService({ secret: jwtSecret });
  const emailDelivery = new EmailDeliveryService();
  const gateway = new NotificationsGateway(jwtService, prisma);
  const notificationsService = new NotificationsService(prisma, gateway, emailDelivery);
  const ordersService = new OrdersService(prisma, notificationsService);

  // 1. Setup Test Customer and Staff
  const testCustomer = await prisma.client.user.upsert({
    where: { phone: '9988776655' },
    update: { email: 'customer-test@ayngaranfoods.com', name: 'Ravi Kumar' },
    create: {
      userCode: 'USR-CUST-STATUS',
      name: 'Ravi Kumar',
      email: 'customer-test@ayngaranfoods.com',
      phone: '9988776655',
    },
  });

  const customerToken = jwtService.sign(
    { sub: testCustomer.id, type: 'customer', userCode: testCustomer.userCode },
    { secret: jwtSecret, expiresIn: '1h' },
  );

  const testStaff = await prisma.client.staff.findFirst({
    where: { isActive: true },
    include: { role: true },
  });

  if (!testStaff) {
    throw new Error('No active staff user found for test execution');
  }

  // ── TEST 1: Customer WebSocket Authentication & Private Room ──
  console.log('── TEST 1: Customer WebSocket Authentication & Private Room ──');

  const customerSocket = io('http://localhost:4000', {
    auth: { token: customerToken },
    transports: ['websocket'],
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Customer socket connection timed out')), 5000);

    customerSocket.on('connect', () => {
      console.log('  ✅ 1a. Customer socket successfully connected to /ws/notifications');
    });

    customerSocket.on('authenticated', (data) => {
      console.log(`  ✅ 1b. Customer socket joined private room: ${data.room} (User ID: ${data.userId})`);
      if (data.userType !== 'customer' || data.room !== `customer:${testCustomer.id}`) {
        reject(new Error(`Expected room customer:${testCustomer.id}, got ${data.room}`));
      }
      clearTimeout(timeout);
      resolve();
    });

    customerSocket.on('connect_error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  // ── TEST 2: Order Status Update — Real-Time WebSocket Event Received by Customer ──
  console.log('\n── TEST 2: Order Status Update — Real-Time WebSocket Event Received by Customer ──');

  // Create an order for testCustomer
  const testOrder = await prisma.client.order.create({
    data: {
      orderNumber: `ORD-STAT-${Date.now().toString().slice(-6)}`,
      userId: testCustomer.id,
      subtotal: 500.0,
      taxAmount: 25.0,
      shippingFee: 50.0,
      totalAmount: 575.0,
      orderStatus: 'PENDING',
      paymentStatus: 'PAID',
      shippingAddressJson: JSON.stringify({
        recipientName: 'Ravi Kumar',
        phone: '9988776655',
        email: 'customer-test@ayngaranfoods.com',
        city: 'Madurai',
        state: 'Tamil Nadu',
      }),
    },
  });

  const staffToken = jwtService.sign(
    { sub: testStaff.id, email: testStaff.email, type: 'staff' },
    { secret: jwtSecret, expiresIn: '1h' },
  );

  const patchAdminStatus = async (status: string, notes?: string) => {
    const res = await fetch(`http://localhost:4000/api/v1/orders/admin/${testOrder.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Admin Status PATCH failed: HTTP ${res.status} - ${errText}`);
    }
    return res.json();
  };

  // Setup listener on customer socket for 'order.status.updated'
  const statusEventPromise = new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Customer did not receive status update event in time')), 8000);

    customerSocket.on('order.status.updated', (event) => {
      clearTimeout(timer);
      resolve(event);
    });
  });

  // Admin updates order status via REST API: PENDING -> CONFIRMED
  console.log(`  Admin updating Order #${testOrder.orderNumber} via REST API (PENDING -> CONFIRMED)...`);
  await patchAdminStatus('CONFIRMED', 'Verified and approved by kitchen staff');

  const receivedEvent = await statusEventPromise;
  console.log('  ✅ 2a. Real-time event received by customer socket:', receivedEvent);

  if (
    receivedEvent.orderId !== testOrder.id ||
    receivedEvent.oldStatus !== 'PENDING' ||
    receivedEvent.newStatus !== 'CONFIRMED'
  ) {
    throw new Error(`Invalid event payload received: ${JSON.stringify(receivedEvent)}`);
  }

  // ── TEST 3: Duplicate Status Change Prevention ──
  console.log('\n── TEST 3: Duplicate Status Change Prevention ──');

  let duplicateEmitted = false;
  customerSocket.on('order.status.updated', () => {
    duplicateEmitted = true;
  });

  // Admin attempts CONFIRMED -> CONFIRMED
  await patchAdminStatus('CONFIRMED');

  await new Promise((r) => setTimeout(r, 1000));
  console.log('  ✅ 3a. Re-submitting identical status (CONFIRMED -> CONFIRMED) correctly skipped notification.');
  if (duplicateEmitted) {
    throw new Error('Duplicate notification was emitted for identical status!');
  }

  // ── TEST 4: Customer Status Email Notification & NotificationLog ──
  console.log('\n── TEST 4: Customer Status Email Notification & NotificationLog ──');

  // Admin updates CONFIRMED -> SHIPPED
  await patchAdminStatus('SHIPPED', 'Handed over to Professional Couriers');

  // Poll for NotificationLog records specifically for SHIPPED status update (since email is async)
  let statusWsLog: any = null;
  let statusEmailLog: any = null;
  for (let i = 0; i < 20; i++) {
    statusWsLog = await prisma.raw.notificationLog.findFirst({
      where: {
        reference: testOrder.orderNumber,
        type: 'ORDER_STATUS_UPDATED',
        channel: 'WEBSOCKET',
        content: { contains: 'SHIPPED' },
      },
      orderBy: { createdAt: 'desc' },
    });

    statusEmailLog = await prisma.raw.notificationLog.findFirst({
      where: {
        reference: testOrder.orderNumber,
        type: 'ORDER_STATUS_UPDATED',
        channel: 'EMAIL',
        content: { contains: 'SHIPPED' },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (statusWsLog && statusEmailLog && statusEmailLog.status === 'SENT') {
      break;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('  ✅ 4a. NotificationLog for WEBSOCKET status update:', statusWsLog?.status);
  console.log('  ✅ 4b. NotificationLog for EMAIL status update to', statusEmailLog?.recipient, 'status:', statusEmailLog?.status);

  if (!statusWsLog || !statusEmailLog || statusEmailLog.status !== 'SENT') {
    throw new Error(`Expected NotificationLog for ORDER_STATUS_UPDATED with status SENT, got ws=${statusWsLog?.status}, email=${statusEmailLog?.status}`);
  }

  // ── TEST 4c: Intermediate status does NOT send customer email ──
  console.log('\n── TEST 4c: Intermediate / Non-Customer status skips customer email ──');
  // Allow any trailing async operations to settle
  await new Promise((r) => setTimeout(r, 2000));

  const emailsBefore = await prisma.raw.notificationLog.count({
    where: {
      reference: testOrder.orderNumber,
      type: 'ORDER_STATUS_UPDATED',
      channel: 'EMAIL',
    },
  });

  // Admin updates to PROCESSING (should NOT trigger customer email)
  await patchAdminStatus('PROCESSING', 'Order being processed internally');
  await new Promise((r) => setTimeout(r, 2500));

  const emailsAfter = await prisma.raw.notificationLog.count({
    where: {
      reference: testOrder.orderNumber,
      type: 'ORDER_STATUS_UPDATED',
      channel: 'EMAIL',
    },
  });

  const processingEmailLog = await prisma.raw.notificationLog.findFirst({
    where: {
      reference: testOrder.orderNumber,
      type: 'ORDER_STATUS_UPDATED',
      channel: 'EMAIL',
      content: { contains: 'PROCESSING' },
    },
  });

  if (emailsAfter !== emailsBefore || processingEmailLog) {
    throw new Error('Customer email was dispatched for non-eligible status (PROCESSING)');
  }
  console.log('  ✅ 4c. Non-eligible status (PROCESSING) correctly skipped customer email.');

  // ── TEST 5: Status Email HTML Template Generation ──
  console.log('\n── TEST 5: Status Email HTML Template Generation ──');

  const testStatusHtml = generateOrderStatusEmailHtml({
    to: 'customer@ayngaranfoods.com',
    customerName: 'Ravi Kumar',
    orderNumber: 'ORD-STAT-123456',
    oldStatus: 'CONFIRMED',
    newStatus: 'SHIPPED',
    orderTotal: 575.0,
    orderDate: '28 September 2026',
    customerOrderUrl: 'http://localhost:3000/account/orders',
    courierName: 'Professional Couriers',
    trackingNumber: 'TPC77889900',
    trackingUrl: 'https://www.tpcindia.com',
  });

  if (!testStatusHtml.includes('Shipped') || !testStatusHtml.includes('ORD-STAT-123456')) {
    throw new Error('Order status HTML template generation missing status details');
  }
  if (!testStatusHtml.includes('Professional Couriers')) {
    throw new Error('Order status HTML template missing Courier / Delivery Partner name');
  }
  if (!testStatusHtml.includes('TPC77889900')) {
    throw new Error('Order status HTML template missing AWB / Tracking number');
  }
  if (!testStatusHtml.includes('Delivery Partner & Tracking Details')) {
    throw new Error('Order status HTML template missing Delivery Partner & Tracking Details card');
  }
  console.log('  ✅ 5a. Order status HTML template rendered with Ayngaran branding, Courier Partner, and AWB Tracking Number.');

  // ── TEST 6: OTP Email HTML Template Generation ──
  console.log('\n── TEST 6: OTP Email HTML Template Generation ──');

  const testOtpHtml = generateOtpEmailHtml({ otp: '789123', expiresInMinutes: 5 });
  if (!testOtpHtml.includes('789123') || !testOtpHtml.includes('5 minutes')) {
    throw new Error('OTP HTML template generation missing OTP or expiry');
  }
  console.log('  ✅ 6a. OTP HTML template rendered with secure 6-digit code and expiry warning.');

  customerSocket.disconnect();
  await prisma.raw.$disconnect();

  console.log('\n🎉 ALL 6 CUSTOMER REAL-TIME & EMAIL NOTIFICATION TESTS PASSED!\n');
}

runVerificationSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
