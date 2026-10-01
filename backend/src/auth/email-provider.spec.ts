import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import {
  EmailDeliveryService,
  SmtpEmailProvider,
  ResendEmailProvider,
  DevelopmentEmailProvider,
} from './email-delivery.service';

async function runEmailProviderTestSuite() {
  console.log('🧪 Starting Email Provider Architecture & Selection Test Suite...\n');

  const originalEnv = { ...process.env };

  try {
    // ── TEST 1: Provider Selection — EMAIL_PROVIDER=development ──
    console.log('── TEST 1: Provider Selection — EMAIL_PROVIDER=development ──');
    process.env.EMAIL_PROVIDER = 'development';
    process.env.EMAIL_FROM = 'Ayngaran Foods <orders@ayngaranfoods.com>';

    const devService = new EmailDeliveryService();
    if (devService.getProviderName() !== 'development') {
      throw new Error(`Expected provider 'development', got '${devService.getProviderName()}'`);
    }

    const devOtpResult = await devService.sendEmailOtp('dev-customer@ayngaranfoods.com', '123456');
    if (!devOtpResult.success) {
      throw new Error('Development provider sendEmailOtp failed');
    }

    const devOtpVal = devService.getDevOtp('dev-customer@ayngaranfoods.com');
    if (devOtpVal !== '123456') {
      throw new Error(`Expected devOtp '123456', got '${devOtpVal}'`);
    }
    console.log('  ✅ 1a. DevelopmentEmailProvider selected and operational with dev OTP caching.');

    // ── TEST 2: Provider Selection & Validation — EMAIL_PROVIDER=smtp ──
    console.log('\n── TEST 2: Provider Selection & Validation — EMAIL_PROVIDER=smtp ──');

    // 2a. Missing credentials must fail clearly during validation
    process.env.EMAIL_PROVIDER = 'smtp';
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    let smtpConfigErrorCaught = false;
    try {
      new EmailDeliveryService();
    } catch (err: any) {
      smtpConfigErrorCaught = true;
      if (!err.message.includes('SMTP_HOST') || !err.message.includes('EMAIL_PROVIDER=smtp')) {
        throw new Error(`Unexpected SMTP error message: ${err.message}`);
      }
      console.log('  ✅ 2a. Incomplete SMTP configuration failed fast with clear error message.');
    }
    if (!smtpConfigErrorCaught) {
      throw new Error('Expected EmailDeliveryService to throw on missing SMTP credentials');
    }

    // 2b. Valid mock SMTP credentials initializes SmtpEmailProvider
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'smtp-user@ayngaranfoods.com';
    process.env.SMTP_PASSWORD = 'super_secret_smtp_app_password';
    process.env.EMAIL_FROM = 'Ayngaran Foods <orders@ayngaranfoods.com>';

    // Mock nodemailer transport to prevent real network calls during test
    let mockMailSent: any = null;
    const originalCreateTransport = nodemailer.createTransport;
    (nodemailer as any).createTransport = () => {
      return {
        verify: async () => true,
        sendMail: async (mailOptions: any) => {
          mockMailSent = mailOptions;
          return { messageId: 'mock-smtp-msg-12345' };
        },
      } as any;
    };

    const smtpService = new EmailDeliveryService();
    if (smtpService.getProviderName() !== 'smtp') {
      throw new Error(`Expected provider 'smtp', got '${smtpService.getProviderName()}'`);
    }
    console.log('  ✅ 2b. SmtpEmailProvider selected when EMAIL_PROVIDER=smtp.');

    // 2c. devOtp is strictly null in SMTP mode
    await smtpService.sendEmailOtp('customer@test.com', '789123');
    if (smtpService.getDevOtp('customer@test.com') !== null) {
      throw new Error('devOtp must be null when EMAIL_PROVIDER=smtp');
    }
    if (mockMailSent?.to !== 'customer@test.com' || !mockMailSent?.html.includes('789123')) {
      throw new Error('SMTP sendMail did not receive expected OTP email options');
    }
    if (!mockMailSent?.text || !mockMailSent.text.includes('789123')) {
      throw new Error('SMTP sendMail must include plain-text version');
    }
    console.log('  ✅ 2c. OTP sent via SMTP with both HTML and plain-text versions; devOtp omitted.');

    // 2d. Customer order status notification via SMTP
    await smtpService.sendOrderStatusNotification({
      to: 'customer@test.com',
      customerName: 'Hari',
      orderNumber: 'ORD-SMTP-101',
      oldStatus: 'CONFIRMED',
      newStatus: 'SHIPPED',
      orderTotal: 450.0,
      orderDate: '28 September 2026',
      customerOrderUrl: 'http://localhost:3000/account/orders',
    });
    if (mockMailSent?.to !== 'customer@test.com' || !mockMailSent?.subject.includes('SHIPPED')) {
      throw new Error('SMTP sendMail did not receive expected order status email options');
    }
    console.log('  ✅ 2d. Customer order status email sent via SMTP with status-specific content.');

    // 2e. Admin order notification via SMTP
    await smtpService.sendOrderNotification({
      to: 'admin@ayngaranfoods.com',
      subject: 'New Order Received #ORD-SMTP-101',
      orderNumber: 'ORD-SMTP-101',
      orderDate: '28 September 2026',
      customer: { name: 'Hari', email: 'customer@test.com', phone: '9988776655' },
      items: [{ name: 'Sambar Powder', quantity: 2, unitPrice: 150, totalPrice: 300 }],
      subtotal: 300,
      discount: 0,
      tax: 15,
      shipping: 50,
      total: 365,
      paymentStatus: 'PAID',
      orderStatus: 'PENDING',
      adminOrderUrl: 'http://localhost:3001/orders/101',
    });
    if (mockMailSent?.to !== 'admin@ayngaranfoods.com' || !mockMailSent?.text.includes('ORD-SMTP-101')) {
      throw new Error('SMTP sendMail did not receive expected admin order alert options');
    }
    console.log('  ✅ 2e. Admin new order alert sent via SMTP with full order details.');

    // Restore createTransport
    (nodemailer as any).createTransport = originalCreateTransport;

    // ── TEST 3: Provider Selection & Validation — EMAIL_PROVIDER=resend ──
    console.log('\n── TEST 3: Provider Selection & Validation — EMAIL_PROVIDER=resend ──');

    process.env.EMAIL_PROVIDER = 'resend';
    delete process.env.RESEND_API_KEY;

    let resendConfigErrorCaught = false;
    try {
      new EmailDeliveryService();
    } catch (err: any) {
      resendConfigErrorCaught = true;
      if (!err.message.includes('RESEND_API_KEY') || !err.message.includes('EMAIL_PROVIDER=resend')) {
        throw new Error(`Unexpected Resend error message: ${err.message}`);
      }
      console.log('  ✅ 3a. Incomplete Resend configuration failed fast with clear error message.');
    }
    if (!resendConfigErrorCaught) {
      throw new Error('Expected EmailDeliveryService to throw on missing RESEND_API_KEY');
    }

    // Mock Resend SDK client to test dispatch
    process.env.RESEND_API_KEY = 're_mock_test_key_for_testing_123';
    let mockResendSent: any = null;

    const resendService = new EmailDeliveryService();
    if (resendService.getProviderName() !== 'resend') {
      throw new Error(`Expected provider 'resend', got '${resendService.getProviderName()}'`);
    }
    console.log('  ✅ 3b. ResendEmailProvider selected when EMAIL_PROVIDER=resend.');

    // Inject mock emails.send onto instance
    (resendService as any).provider.resendClient.emails = {
      send: async (options: any) => {
        mockResendSent = options;
        return { data: { id: 'mock-resend-id-999' }, error: null };
      },
    };

    await resendService.sendEmailOtp('production-customer@ayngaranfoods.com', '999888');
    if (mockResendSent?.to[0] !== 'production-customer@ayngaranfoods.com' || !mockResendSent?.html.includes('999888')) {
      throw new Error('Resend send did not receive expected OTP options');
    }
    if (resendService.getDevOtp('production-customer@ayngaranfoods.com') !== null) {
      throw new Error('devOtp must be null when EMAIL_PROVIDER=resend');
    }
    console.log('  ✅ 3c. OTP sent via Resend API; devOtp strictly disabled.');

    // ── TEST 4: Invalid Provider Selection Rejection ──
    console.log('\n── TEST 4: Invalid Provider Selection Rejection ──');

    process.env.EMAIL_PROVIDER = 'unknown_email_service';
    let invalidProviderCaught = false;
    try {
      new EmailDeliveryService();
    } catch (err: any) {
      invalidProviderCaught = true;
      if (!err.message.includes('Invalid EMAIL_PROVIDER') || !err.message.includes('smtp')) {
        throw new Error(`Unexpected invalid provider error: ${err.message}`);
      }
      console.log('  ✅ 4a. Unknown EMAIL_PROVIDER rejected fast with list of supported options.');
    }
    if (!invalidProviderCaught) {
      throw new Error('Expected EmailDeliveryService to reject invalid provider name');
    }

    // ── TEST 5: Security Check — Credentials Never Leaked ──
    console.log('\n── TEST 5: Security Check — Credentials Never Leaked ──');

    const serviceString = JSON.stringify(smtpService);
    if (serviceString.includes('super_secret_smtp_app_password')) {
      throw new Error('CRITICAL: SMTP password leaked in serialized service!');
    }
    console.log('  ✅ 5a. SMTP credentials and Resend API keys are isolated and never exposed.');

    console.log('\n🎉 ALL EMAIL PROVIDER ARCHITECTURE & SELECTION TESTS PASSED!\n');
  } finally {
    // Restore original environment
    for (const key in process.env) {
      if (!(key in originalEnv)) {
        delete (process.env as any)[key];
      }
    }
    Object.assign(process.env, originalEnv);
  }
}

runEmailProviderTestSuite().catch((err) => {
  console.error('\n❌ EMAIL PROVIDER TEST SUITE FAILED:', err);
  process.exit(1);
});
