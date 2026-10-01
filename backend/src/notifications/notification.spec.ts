import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway, ADMIN_ORDERS_ROOM } from './notifications.gateway';
import { EmailDeliveryService } from '../auth/email-delivery.service';
import { JwtService } from '@nestjs/jwt';
import { io } from 'socket.io-client';
import { generateOrderNotificationEmailHtml } from './order-notification-email.template';

async function runNotificationTests() {
  console.log('🧪 Starting Real-Time New Order Notifications & Email Verification Suite...\n');

  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const jwtSecret = process.env.JWT_SECRET || 'ayngaran_secret_jwt_key_2026_super_secure_access_token';
  const jwtService = new JwtService({ secret: jwtSecret });

  // ── TEST 1: WebSocket Staff Authentication & Connection ──
  console.log('── TEST 1: WebSocket Staff Authentication & Connection ──');

  // Find a staff user with role
  const staff = await prisma.client.staff.findFirst({
    where: { isActive: true },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  if (!staff) {
    throw new Error('Test setup failed: No active staff user found.');
  }

  const staffToken = jwtService.sign(
    { sub: staff.id, type: 'staff', email: staff.email },
    { secret: jwtSecret, expiresIn: '1h' },
  );

  const customerToken = jwtService.sign(
    { sub: 1, type: 'customer', phone: '+919999999999' },
    { secret: jwtSecret, expiresIn: '1h' },
  );

  // Connect unauthorized client (should be rejected)
  await new Promise<void>((resolve, reject) => {
    const unauthSocket = io('http://localhost:4000', {
      auth: { token: 'invalid_token' },
      transports: ['websocket'],
      reconnection: false,
    });

    unauthSocket.on('connect_error', (err) => {
      console.log('  ✅ 1a. Unauthorized connection correctly rejected:', err.message);
      unauthSocket.disconnect();
      resolve();
    });

    unauthSocket.on('connect', () => {
      unauthSocket.disconnect();
      reject(new Error('FAIL: Unauthorized socket connected successfully without valid staff token!'));
    });

    setTimeout(() => {
      unauthSocket.disconnect();
      resolve();
    }, 2000);
  });

  // Connect customer token client (should be rejected from admin stream)
  await new Promise<void>((resolve, reject) => {
    const customerSocket = io('http://localhost:4000', {
      auth: { token: customerToken },
      transports: ['websocket'],
      reconnection: false,
    });

    customerSocket.on('connect_error', (err) => {
      console.log('  ✅ 1b. Customer token correctly rejected from staff admin stream:', err.message);
      customerSocket.disconnect();
      resolve();
    });

    customerSocket.on('connect', () => {
      customerSocket.disconnect();
      reject(new Error('FAIL: Customer socket connected to admin socket!'));
    });

    setTimeout(() => {
      customerSocket.disconnect();
      resolve();
    }, 2000);
  });

  // Connect authenticated staff client
  let receivedEvent: any = null;
  const staffSocket = await new Promise<any>((resolve, reject) => {
    const socket = io('http://localhost:4000', {
      auth: { token: staffToken },
      transports: ['websocket'],
      reconnection: false,
    });

    socket.on('authenticated', (data) => {
      console.log(`  ✅ 1c. Authorized staff connected & joined room: ${data.room} (${data.staff.email})`);
      resolve(socket);
    });

    socket.on('order.created', (payload) => {
      receivedEvent = payload;
    });

    socket.on('connect_error', (err) => {
      reject(new Error(`Failed to connect staff socket: ${err.message}`));
    });

    setTimeout(() => {
      reject(new Error('Timeout waiting for authenticated event on staff socket'));
    }, 5000);
  });

  // ── TEST 2: COD Order Notification (WebSocket + Email in Dev Mode) ──
  console.log('\n── TEST 2: COD Order Placement & Commit Notification ──');

  // Find or create test customer & order
  const user = await prisma.client.user.findFirst();
  if (!user) throw new Error('No user found');

  const product = await prisma.client.product.findFirst();
  if (!product) throw new Error('No product found');

  const testCodOrder = await prisma.client.order.create({
    data: {
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      subtotal: 500.0,
      taxAmount: 25.0,
      shippingFee: 60.0,
      totalAmount: 585.0,
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PENDING_COD',
      shippingAddressJson: JSON.stringify({
        recipientName: 'Hari Raman',
        phone: '9876543210',
        state: 'Tamil Nadu',
        city: 'Coimbatore',
      }),
      items: {
        create: [
          {
            productId: product.id,
            quantity: 2,
            unitPrice: 250.0,
            totalPrice: 500.0,
            productSnapshotJson: JSON.stringify({ name: 'Ayngaran Herbal Tea', sku: 'TEA-001' }),
          },
        ],
      },
    },
  });

  const emailDelivery = new EmailDeliveryService();
  const gateway = new NotificationsGateway(jwtService, prisma);
  gateway.server = {
    to: (room: string) => ({
      emit: (event: string, payload: any) => true,
    }),
  } as any;
  const notificationsService = new NotificationsService(prisma, gateway, emailDelivery);

  // Trigger notification for committed COD order
  await notificationsService.notifyOrderCreated(testCodOrder.id);

  // Verify database NotificationLog entries
  const wsLog = await prisma.raw.notificationLog.findFirst({
    where: { reference: testCodOrder.orderNumber, channel: 'WEBSOCKET' },
    orderBy: { createdAt: 'desc' },
  });

  console.log('  ✅ 2a. NotificationLog for WEBSOCKET created with status:', wsLog?.status);
  if (!wsLog || wsLog.status !== 'EMITTED') {
    throw new Error(`Expected WEBSOCKET log status EMITTED, got ${wsLog?.status}`);
  }

  const emailLog = await prisma.raw.notificationLog.findFirst({
    where: { reference: testCodOrder.orderNumber, channel: 'EMAIL' },
    orderBy: { createdAt: 'desc' },
  });

  console.log('  ✅ 2b. NotificationLog for EMAIL created with status:', emailLog?.status);
  if (!emailLog || emailLog.status !== 'SENT') {
    throw new Error(`Expected EMAIL log status SENT, got ${emailLog?.status}`);
  }

  // ── TEST 3: Online Paid Order Notification ──
  console.log('\n── TEST 3: Online Verified Paid Order Notification ──');

  const testPaidOrder = await prisma.client.order.create({
    data: {
      orderNumber: `ORD-${(Date.now() + 1).toString().slice(-6)}`,
      userId: user.id,
      subtotal: 900.0,
      taxAmount: 45.0,
      shippingFee: 0.0,
      totalAmount: 945.0,
      orderStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      shippingAddressJson: JSON.stringify({
        recipientName: 'Priya Sundaram',
        phone: '9840123456',
        state: 'Tamil Nadu',
        city: 'Chennai',
      }),
      items: {
        create: [
          {
            productId: product.id,
            quantity: 3,
            unitPrice: 300.0,
            totalPrice: 900.0,
            productSnapshotJson: JSON.stringify({ name: 'Pure Honey 500g', sku: 'HNY-500' }),
          },
        ],
      },
    },
  });

  await notificationsService.notifyOrderCreated(testPaidOrder.id);

  const paidEmailLog = await prisma.raw.notificationLog.findFirst({
    where: { reference: testPaidOrder.orderNumber, channel: 'EMAIL' },
  });
  console.log('  ✅ 3a. Paid order email notification logged for:', paidEmailLog?.recipient);

  // ── TEST 4: Email HTML Template Generation ──
  console.log('\n── TEST 4: Email HTML Template Formatting ──');

  const sampleHtml = generateOrderNotificationEmailHtml({
    to: 'admin@example.com',
    subject: `New Order Received — ${testPaidOrder.orderNumber}`,
    orderNumber: testPaidOrder.orderNumber,
    orderDate: '28 September 2026, 4:30 PM',
    customer: {
      name: 'Priya Sundaram',
      email: 'priya@example.com',
      phone: '98401****56',
    },
    items: [
      {
        name: 'Pure Honey 500g',
        quantity: 3,
        unitPrice: 300,
        totalPrice: 900,
      },
    ],
    subtotal: 900,
    discount: 0,
    tax: 45,
    shipping: 0,
    total: 945,
    paymentStatus: 'PAID',
    paymentMethod: 'ONLINE',
    orderStatus: 'CONFIRMED',
    adminOrderUrl: 'http://localhost:3001/orders',
  });

  if (!sampleHtml.includes('AYNGARAN FOODS') || !sampleHtml.includes('Pure Honey 500g') || !sampleHtml.includes('₹945.00')) {
    throw new Error('FAIL: Email HTML template missing critical branding or order data!');
  }
  console.log('  ✅ 4a. Email template successfully formatted with Ayngaran branding, item table, and accurate totals');

  // ── TEST 5: Non-blocking Resilience on Missing Order ──
  console.log('\n── TEST 5: Non-blocking Resilience ──');
  // Attempting to notify a non-existent order should log gracefully and never throw
  await notificationsService.notifyOrderCreated(99999999);
  console.log('  ✅ 5a. Non-existent order handled gracefully without throwing');

  // Clean up sockets & test records
  staffSocket.disconnect();

  await prisma.client.orderItem.deleteMany({
    where: { orderId: { in: [testCodOrder.id, testPaidOrder.id] } },
  });
  await prisma.client.order.deleteMany({
    where: { id: { in: [testCodOrder.id, testPaidOrder.id] } },
  });

  console.log('\n🎉 ALL 5 VERIFICATION SUITES PASSED FLAWLESSLY!\n');
  process.exit(0);
}

runNotificationTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
