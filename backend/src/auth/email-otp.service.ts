import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailDeliveryService } from './email-delivery.service';
import { OtpUtil } from '../common/utils/otp.util';

@Injectable()
export class EmailOtpService {
  private readonly logger = new Logger(EmailOtpService.name);
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly RESEND_COOLDOWN_SECONDS = 60;
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDeliveryService: EmailDeliveryService,
  ) {}

  /**
   * Normalizes an email address: trims whitespace and converts to lowercase.
   */
  normalizeEmail(email: string): string {
    return OtpUtil.normalizeEmail(email);
  }

  /**
   * Hashes an OTP string using SHA-256.
   */
  hashOtp(otp: string): string {
    return OtpUtil.hashOtp(otp);
  }

  /**
   * Generates a cryptographically secure, non-predictable 6-digit OTP.
   */
  private generateSecureOtp(): string {
    return OtpUtil.generateSecureOtp(6);
  }

  /**
   * Validates standard email address format.
   */
  private isValidEmail(email: string): boolean {
    return OtpUtil.isValidEmail(email);
  }

  /**
   * Requests a new email OTP:
   * 1. Validates and normalizes email
   * 2. Checks 60-second cooldown rate limit
   * 3. Generates cryptographically secure 6-digit OTP
   * 4. Hashes OTP before saving to database (never stores plaintext OTP)
   * 5. Persists to immutable OtpRequest ledger
   * 6. Dispatches to EmailDeliveryService (prints to terminal in dev mode)
   * 7. Returns response WITHOUT exposing OTP
   */
  async requestEmailOtp(rawEmail: string): Promise<{ success: boolean; message: string; expiresInSeconds: number }> {
    const email = this.normalizeEmail(rawEmail);

    if (!email || !this.isValidEmail(email)) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    // 1. Rate Limiting / 60-Second Cooldown Check
    const cooldownThreshold = new Date(Date.now() - this.RESEND_COOLDOWN_SECONDS * 1000);
    const recentRequest = await this.prisma.raw.otpRequest.findFirst({
      where: {
        identifier: email,
        createdAt: { gte: cooldownThreshold },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentRequest) {
      const elapsedSeconds = Math.floor((Date.now() - recentRequest.createdAt.getTime()) / 1000);
      const remainingSeconds = this.RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      throw new BadRequestException(`Please wait ${remainingSeconds} seconds before requesting a new OTP.`);
    }

    // 2. Generate cryptographically secure 6-digit OTP
    const otp = this.generateSecureOtp();
    const hashedOtp = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // 3. Store hashed OTP in database
    await this.prisma.raw.otpRequest.create({
      data: {
        identifier: email,
        otpHash: hashedOtp,
        expiresAt,
        attempts: 0,
        isVerified: false,
      },
    });

    // 4. Log to immutable notification_logs ledger
    try {
      await this.prisma.raw.notificationLog.create({
        data: {
          recipient: email,
          channel: 'EMAIL',
          subject: 'Ayngaran Foods Email Verification Code',
          content: `Your Ayngaran Foods verification code is ${otp}. It expires in 5 minutes.`,
          status: 'SENT',
        },
      });
    } catch (err: any) {
      this.logger.warn(`Could not write to notification_logs: ${err.message}`);
    }

    // 5. Send OTP via delivery provider (Resend in production / real test, Development provider in dev mode)
    await this.emailDeliveryService.sendEmailOtp(email, otp);

    const isDev =
      process.env.NODE_ENV !== 'production' &&
      (process.env.EMAIL_PROVIDER || 'development').toLowerCase() === 'development';

    // 6. Return response
    return {
      success: true,
      message: 'OTP sent successfully',
      expiresInSeconds: this.OTP_EXPIRY_MINUTES * 60,
      ...(isDev ? { devOtp: otp } : {}),
    };
  }

  /**
   * Retrieves active development OTP for preview/testing in development mode only.
   */
  async getDevOtp(rawEmail: string): Promise<string | null> {
    const isDev =
      process.env.NODE_ENV !== 'production' &&
      (process.env.EMAIL_PROVIDER || 'development').toLowerCase() === 'development';
    if (!isDev) return null;

    const email = this.normalizeEmail(rawEmail);
    if (!email) return null;

    // First check in-memory cache
    const fromDelivery = this.emailDeliveryService.getDevOtp(email);
    if (fromDelivery) return fromDelivery;

    // Fallback: check notification_logs ledger for recent OTP within 5 minutes
    try {
      const fiveMinutesAgo = new Date(Date.now() - this.OTP_EXPIRY_MINUTES * 60 * 1000);
      const log = await this.prisma.raw.notificationLog.findFirst({
        where: {
          recipient: email,
          channel: 'EMAIL',
          createdAt: { gte: fiveMinutesAgo },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (log?.content) {
        const match = log.content.match(/\b\d{6}\b/);
        if (match) return match[0];
      }
    } catch {
      // ignore
    }

    return null;
  }

  /**
   * Verifies the email OTP:
   * 1. Normalizes email
   * 2. Finds latest active, non-expired OTP record
   * 3. Validates attempt limits
   * 4. Hashes input OTP and compares with stored hash
   * 5. Increments attempts on invalid attempt
   * 6. Marks OTP as verified on success
   * 7. Returns normalized email
   */
  async verifyEmailOtp(rawEmail: string, rawOtp: string): Promise<string> {
    const email = this.normalizeEmail(rawEmail);
    const otp = rawOtp ? rawOtp.trim() : '';

    if (!email || !this.isValidEmail(email)) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    if (!otp || otp.length !== 6) {
      throw new BadRequestException('Please provide a valid 6-digit verification code.');
    }

    // 1. Find the latest active OTP request for this email
    const otpRecord = await this.prisma.raw.otpRequest.findFirst({
      where: {
        identifier: email,
        isVerified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      // Check if there was an expired one to provide clearer error feedback
      const expiredRecord = await this.prisma.raw.otpRequest.findFirst({
        where: { identifier: email, isVerified: false },
        orderBy: { createdAt: 'desc' },
      });

      if (expiredRecord) {
        throw new BadRequestException('OTP has expired. Please request a new OTP.');
      }
      throw new BadRequestException('No active OTP request found. Please request an OTP first.');
    }

    // 2. Check maximum verification attempts
    if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
      throw new BadRequestException('Maximum verification attempts exceeded. Please request a new OTP.');
    }

    // 3. Compare submitted OTP against stored hashed OTP
    const submittedHash = this.hashOtp(otp);
    const isMatched = submittedHash === otpRecord.otpHash;

    if (!isMatched) {
      const nextAttempts = otpRecord.attempts + 1;
      await this.prisma.raw.otpRequest.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = this.MAX_ATTEMPTS - nextAttempts;
      if (remainingAttempts <= 0) {
        throw new BadRequestException('Maximum verification attempts exceeded. Please request a new OTP.');
      }
      throw new BadRequestException(`Invalid OTP. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`);
    }

    // 4. Mark OTP as verified so it cannot be used again
    await this.prisma.raw.otpRequest.update({
      where: { id: otpRecord.id },
      data: { isVerified: true },
    });

    return email;
  }
}
