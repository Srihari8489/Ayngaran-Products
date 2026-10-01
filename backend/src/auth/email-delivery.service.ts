import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { generateOtpEmailHtml } from './otp-email.template';
import {
  OrderStatusEmailParams,
  generateOrderStatusEmailHtml,
} from '../notifications/order-status-email.template';

export interface EmailDeliveryResult {
  success: boolean;
  message: string;
  providerId?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface OrderNotificationEmailParams {
  from?: string;
  to: string;
  subject: string;
  orderNumber: string;
  orderDate: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variantLabel?: string;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  orderStatus: string;
  adminOrderUrl?: string;
  html?: string;
}

export interface IEmailDeliveryProvider {
  sendEmail(options: SendEmailOptions): Promise<EmailDeliveryResult>;
  sendEmailOtp(email: string, otp: string): Promise<EmailDeliveryResult>;
  sendOrderNotification(params: OrderNotificationEmailParams): Promise<EmailDeliveryResult>;
  sendOrderStatusNotification(params: OrderStatusEmailParams): Promise<EmailDeliveryResult>;
}

/**
 * 1. Development Email Delivery Provider
 *
 * NOTE: For local mock testing when real email dispatch is intentionally disabled.
 * - Prints formatted email info to backend terminal
 * - Never fails orders or checkouts
 */
export class DevelopmentEmailProvider implements IEmailDeliveryProvider {
  private readonly logger = new Logger(DevelopmentEmailProvider.name);

  async sendEmail(options: SendEmailOptions): Promise<EmailDeliveryResult> {
    const from = options.from || process.env.EMAIL_FROM || 'Ayngaran Foods <orders@ayngaranfoods.com>';
    console.log('\n========================================');
    console.log('EMAIL NOTIFICATION - DEVELOPMENT (TERMINAL)');
    console.log('========================================');
    console.log(`From:    ${from}`);
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    if (options.text) {
      console.log(`Content:\n${options.text}`);
    }
    console.log('========================================\n');

    return {
      success: true,
      message: 'Email logged to development console',
    };
  }

  async sendEmailOtp(email: string, otp: string): Promise<EmailDeliveryResult> {
    const from = process.env.EMAIL_FROM || 'Ayngaran Foods <orders@ayngaranfoods.com>';
    console.log('\n========================================');
    console.log('EMAIL OTP - DEVELOPMENT ONLY');
    console.log(`From:    ${from}`);
    console.log(`To:      ${email}`);
    console.log(`OTP:     ${otp}`);
    console.log('Expires: 5 minutes');
    console.log('========================================\n');

    return {
      success: true,
      message: 'OTP sent successfully (development terminal output)',
    };
  }

  async sendOrderNotification(params: OrderNotificationEmailParams): Promise<EmailDeliveryResult> {
    const from = params.from || process.env.EMAIL_FROM || 'Ayngaran Foods <orders@ayngaranfoods.com>';
    console.log('\n========================================');
    console.log('ORDER EMAIL NOTIFICATION - DEVELOPMENT');
    console.log('========================================');
    console.log(`From:     ${from}`);
    console.log(`To:       ${params.to}`);
    console.log(`Subject:  ${params.subject}`);
    console.log(`Order:    ${params.orderNumber}`);
    console.log(`Customer: ${params.customer.name}`);
    console.log(`Total:    ₹${Number(params.total).toFixed(2)}`);
    console.log('========================================\n');

    return {
      success: true,
      message: 'Order notification printed in development console',
    };
  }

  async sendOrderStatusNotification(params: OrderStatusEmailParams): Promise<EmailDeliveryResult> {
    const from = params.from || process.env.EMAIL_FROM || 'Ayngaran Foods <orders@ayngaranfoods.com>';
    console.log('\n========================================');
    console.log('CUSTOMER ORDER STATUS EMAIL - DEVELOPMENT');
    console.log('========================================');
    console.log(`From:       ${from}`);
    console.log(`To:         ${params.to}`);
    console.log(`Subject:    Your Ayngaran Foods Order ${params.orderNumber} is now ${params.newStatus}`);
    console.log(`Order:      ${params.orderNumber}`);
    console.log(`Transition: ${params.oldStatus} -> ${params.newStatus}`);
    console.log(`Customer:   ${params.customerName}`);
    console.log(`Total:      ₹${Number(params.orderTotal).toFixed(2)}`);
    console.log('========================================\n');

    return {
      success: true,
      message: 'Order status notification printed in development console',
    };
  }
}

/**
 * 2. SMTP Email Delivery Provider (Local Development & Testing)
 *
 * Uses nodemailer to send real emails through configurable SMTP credentials.
 * Dispatches Customer OTP, Admin New Order alerts, and Customer Status updates.
 */
export class SmtpEmailProvider implements IEmailDeliveryProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    this.from = process.env.EMAIL_FROM || 'Ayngaran Foods <orders@ayngaranfoods.com>';

    if (!host || !user || !pass) {
      const missing = [
        !host && 'SMTP_HOST',
        !user && 'SMTP_USER',
        !pass && 'SMTP_PASSWORD',
      ].filter(Boolean);
      throw new Error(
        `[SmtpEmailProvider] Incomplete SMTP configuration. Missing required variables: ${missing.join(', ')}`,
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    // Safe startup verification check without sending email
    this.verifyTransporter(host, port);
  }

  private async verifyTransporter(host: string, port: number) {
    try {
      await this.transporter.verify();
      this.logger.log(`[SMTP] Successfully connected and verified with host: ${host}:${port}`);
    } catch (err: any) {
      this.logger.error(
        `[SMTP] SMTP email provider configuration verification warning: ${err.message || 'Unable to connect to SMTP host'}. (Check SMTP_HOST, credentials, and network connectivity)`,
      );
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailDeliveryResult> {
    const from = options.from || this.from;
    try {
      this.logger.log(`[SMTP] Dispatching email to ${options.to} (Subject: "${options.subject}")`);
      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`[SMTP] Email sent successfully to ${options.to}. Message ID: ${info.messageId}`);
      return {
        success: true,
        message: 'Email delivered via SMTP',
        providerId: info.messageId,
      };
    } catch (err: any) {
      this.logger.error(`[SMTP Error] Delivery failed to ${options.to}: ${err.message}`);
      throw err;
    }
  }

  async sendEmailOtp(email: string, otp: string): Promise<EmailDeliveryResult> {
    const subject = 'Your Ayngaran Foods Login OTP';
    const html = generateOtpEmailHtml({ otp, expiresInMinutes: 5 });
    const text = `AYNGARAN FOODS\n\nYour Login OTP\n\nHello,\n\nUse the following OTP to continue signing in:\n\n${otp}\n\nThis OTP expires in 5 minutes.\nIf you did not request this code, you can ignore this email.\n\nAyngaran Foods`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
      from: this.from,
    });
  }

  async sendOrderNotification(params: OrderNotificationEmailParams): Promise<EmailDeliveryResult> {
    const from = params.from || this.from;
    const text = `AYNGARAN FOODS - NEW ORDER ALERT\n\nOrder #${params.orderNumber} placed on ${params.orderDate}\nCustomer: ${params.customer.name} (${params.customer.email}, ${params.customer.phone})\nTotal: ₹${Number(params.total).toFixed(2)}\nPayment Status: ${params.paymentStatus}\nOrder Status: ${params.orderStatus}\n\nView details: ${params.adminOrderUrl || 'Admin Portal'}`;

    return this.sendEmail({
      to: params.to,
      subject: params.subject,
      html: params.html || `<p>New order #${params.orderNumber} received for ₹${params.total}.</p>`,
      text,
      from,
    });
  }

  async sendOrderStatusNotification(params: OrderStatusEmailParams): Promise<EmailDeliveryResult> {
    const from = params.from || this.from;
    const subject = `Your Ayngaran Foods Order ${params.orderNumber} is now ${params.newStatus}`;
    const html = generateOrderStatusEmailHtml(params);
    const text = `AYNGARAN FOODS\n\nOrder Status Update\n\nHello ${params.customerName},\n\nYour order ${params.orderNumber} has been updated.\n\nPrevious Status: ${params.oldStatus}\nCurrent Status: ${params.newStatus}\nOrder Total: ₹${Number(params.orderTotal).toFixed(2)}\nOrder Date: ${params.orderDate}\n\nYou can view your order here: ${params.customerOrderUrl || 'Customer Portal'}\n\nAyngaran Foods`;

    return this.sendEmail({
      to: params.to,
      subject,
      html,
      text,
      from,
    });
  }
}

/**
 * 3. Resend Transactional Email Delivery Provider (Production)
 *
 * Uses the official 'resend' SDK for production email delivery.
 * Dispatches Customer OTP, Admin New Order alerts, and Customer Status updates.
 */
export class ResendEmailProvider implements IEmailDeliveryProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private resendClient: Resend;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.from = process.env.EMAIL_FROM || 'Ayngaran Foods <orders@ayngaranfoods.com>';

    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error(
        '[ResendEmailProvider] Missing required configuration: RESEND_API_KEY is not defined in environment variables.',
      );
    }

    try {
      this.resendClient = new Resend(apiKey.trim());
      this.logger.log('Resend client successfully initialized with provided API key');
    } catch (err: any) {
      this.logger.error(`Failed to initialize Resend client: ${err.message}`);
      throw err;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailDeliveryResult> {
    const from = options.from || this.from;
    try {
      this.logger.log(`[Resend] Dispatching email to ${options.to} (Subject: "${options.subject}")`);
      const response = await this.resendClient.emails.send({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (response.error) {
        this.logger.error(`[Resend Error] ${response.error.message}`);
        throw new Error(response.error.message);
      }

      this.logger.log(`[Resend Sent] Message ID: ${response.data?.id}`);
      return {
        success: true,
        message: 'Email delivered via Resend',
        providerId: response.data?.id,
      };
    } catch (err: any) {
      this.logger.error(`[Resend Dispatch Failed] ${err.message}`);
      throw err;
    }
  }

  async sendEmailOtp(email: string, otp: string): Promise<EmailDeliveryResult> {
    const subject = 'Your Ayngaran Foods Login OTP';
    const html = generateOtpEmailHtml({ otp, expiresInMinutes: 5 });
    const text = `AYNGARAN FOODS\n\nYour Login OTP\n\nHello,\n\nUse the following OTP to continue signing in:\n\n${otp}\n\nThis OTP expires in 5 minutes.\nIf you did not request this code, you can ignore this email.\n\nAyngaran Foods`;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
      from: this.from,
    });
  }

  async sendOrderNotification(params: OrderNotificationEmailParams): Promise<EmailDeliveryResult> {
    const from = params.from || this.from;
    const text = `AYNGARAN FOODS - NEW ORDER ALERT\n\nOrder #${params.orderNumber} placed on ${params.orderDate}\nCustomer: ${params.customer.name} (${params.customer.email}, ${params.customer.phone})\nTotal: ₹${Number(params.total).toFixed(2)}\nPayment Status: ${params.paymentStatus}\nOrder Status: ${params.orderStatus}\n\nView details: ${params.adminOrderUrl || 'Admin Portal'}`;

    return this.sendEmail({
      to: params.to,
      subject: params.subject,
      html: params.html || `<p>New order #${params.orderNumber} received for ₹${params.total}.</p>`,
      text,
      from,
    });
  }

  async sendOrderStatusNotification(params: OrderStatusEmailParams): Promise<EmailDeliveryResult> {
    const from = params.from || this.from;
    const subject = `Your Ayngaran Foods Order ${params.orderNumber} is now ${params.newStatus}`;
    const html = generateOrderStatusEmailHtml(params);
    const text = `AYNGARAN FOODS\n\nOrder Status Update\n\nHello ${params.customerName},\n\nYour order ${params.orderNumber} has been updated.\n\nPrevious Status: ${params.oldStatus}\nCurrent Status: ${params.newStatus}\nOrder Total: ₹${Number(params.orderTotal).toFixed(2)}\nOrder Date: ${params.orderDate}\n\nYou can view your order here: ${params.customerOrderUrl || 'Customer Portal'}\n\nAyngaran Foods`;

    return this.sendEmail({
      to: params.to,
      subject,
      html,
      text,
      from,
    });
  }
}

/**
 * Unified EmailDeliveryService
 *
 * Provider Factory:
 * - EMAIL_PROVIDER=smtp        => SmtpEmailProvider (Development / Testing)
 * - EMAIL_PROVIDER=resend      => ResendEmailProvider (Production)
 * - EMAIL_PROVIDER=development => DevelopmentEmailProvider (Terminal Mock)
 */
@Injectable()
export class EmailDeliveryService {
  private readonly logger = new Logger(EmailDeliveryService.name);
  private provider: IEmailDeliveryProvider;
  private readonly devOtpCache = new Map<string, { otp: string; expiresAt: number }>();
  private readonly activeProviderName: 'smtp' | 'resend' | 'development';

  constructor() {
    const rawProvider = process.env.EMAIL_PROVIDER;
    const providerName = (rawProvider || 'development').toLowerCase().trim();

    switch (providerName) {
      case 'smtp': {
        this.validateSmtpConfig();
        this.provider = new SmtpEmailProvider();
        this.activeProviderName = 'smtp';
        this.logger.log('EmailDeliveryService initialized with SmtpEmailProvider (SMTP Development)');
        break;
      }
      case 'resend': {
        this.validateResendConfig();
        this.provider = new ResendEmailProvider();
        this.activeProviderName = 'resend';
        this.logger.log('EmailDeliveryService initialized with ResendEmailProvider (Resend Production)');
        break;
      }
      case 'development': {
        this.provider = new DevelopmentEmailProvider();
        this.activeProviderName = 'development';
        this.logger.log('EmailDeliveryService initialized with DevelopmentEmailProvider (Terminal Output)');
        break;
      }
      default: {
        throw new Error(
          `[EmailDeliveryService] Invalid EMAIL_PROVIDER "${rawProvider}". Supported values are: "smtp", "resend", "development".`,
        );
      }
    }
  }

  private validateSmtpConfig() {
    const missing: string[] = [];
    if (!process.env.SMTP_HOST) missing.push('SMTP_HOST');
    if (!process.env.SMTP_PORT) missing.push('SMTP_PORT');
    if (!process.env.SMTP_USER) missing.push('SMTP_USER');
    if (!process.env.SMTP_PASSWORD) missing.push('SMTP_PASSWORD');
    if (!process.env.EMAIL_FROM) missing.push('EMAIL_FROM');

    if (missing.length > 0) {
      throw new Error(
        `[EmailDeliveryService] Invalid configuration for EMAIL_PROVIDER=smtp. Missing required environment variables: ${missing.join(', ')}`,
      );
    }
  }

  private validateResendConfig() {
    const missing: string[] = [];
    if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY');
    if (!process.env.EMAIL_FROM) missing.push('EMAIL_FROM');

    if (missing.length > 0) {
      throw new Error(
        `[EmailDeliveryService] Invalid configuration for EMAIL_PROVIDER=resend. Missing required environment variables: ${missing.join(', ')}`,
      );
    }
  }

  getProviderName(): 'smtp' | 'resend' | 'development' {
    return this.activeProviderName;
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailDeliveryResult> {
    return this.provider.sendEmail(options);
  }

  async sendEmailOtp(email: string, otp: string): Promise<EmailDeliveryResult> {
    const cleanEmail = email.toLowerCase().trim();
    // Cache OTP in memory strictly in development mock mode
    if (this.activeProviderName === 'development') {
      this.devOtpCache.set(cleanEmail, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
    }
    return this.provider.sendEmailOtp(email, otp);
  }

  async sendOrderNotification(params: OrderNotificationEmailParams): Promise<EmailDeliveryResult> {
    return this.provider.sendOrderNotification(params);
  }

  async sendOrderStatusNotification(params: OrderStatusEmailParams): Promise<EmailDeliveryResult> {
    return this.provider.sendOrderStatusNotification(params);
  }

  getDevOtp(email: string): string | null {
    if (this.activeProviderName !== 'development') return null;

    const cleanEmail = email.toLowerCase().trim();
    const entry = this.devOtpCache.get(cleanEmail);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.devOtpCache.delete(cleanEmail);
      return null;
    }
    this.devOtpCache.delete(cleanEmail);
    return entry.otp;
  }
}
