import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { OtpDeliveryService } from './otp-delivery.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpDeliveryService: OtpDeliveryService,
  ) {}

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  private normalizePhone(input: string): string {
    const clean = input.trim();
    if (clean.includes('@')) return clean.toLowerCase();
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (!clean.startsWith('+') && digits.length > 10) return `+${digits}`;
    return clean.startsWith('+') ? clean : `+91${digits}`;
  }

  // -------------------------------------------------------------
  // CUSTOMER OTP WORKFLOW (DEMO MODE READY)
  // -------------------------------------------------------------

  async requestCustomerOtp(identifierOrPhone: string) {
    const cleanId = this.normalizePhone(identifierOrPhone);

    // 1. Rate Limiting / Cooldown Check: 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentRequest = await this.prisma.raw.otpRequest.findFirst({
      where: {
        identifier: cleanId,
        createdAt: { gte: oneMinuteAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentRequest) {
      const elapsedSeconds = Math.floor((Date.now() - recentRequest.createdAt.getTime()) / 1000);
      const remainingSeconds = 60 - elapsedSeconds;
      throw new BadRequestException(
        `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
      );
    }

    // 2. Generate 6-Digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    /*
      DEMO ONLY — plaintext OTP storage.
      MUST be replaced with hashing before production.
    */
    const isHashingDisabled = process.env.OTP_HASHING === 'false' || process.env.WHATSAPP_OTP_MODE === 'DEMO';
    const otpHashToStore = isHashingDisabled ? otp : this.hashOtp(otp);

    // 3. Save to immutable otp_requests ledger
    await this.prisma.raw.otpRequest.create({
      data: {
        identifier: cleanId,
        otpHash: otpHashToStore,
        expiresAt,
        attempts: 0,
        isVerified: false,
      },
    });

    // 4. Log to immutable notification_logs ledger
    await this.prisma.raw.notificationLog.create({
      data: {
        recipient: cleanId,
        channel: 'WHATSAPP',
        subject: 'Ayngaran Foods OTP Verification',
        content: `Your Ayngaran Foods OTP is ${otp}. Valid for 5 minutes.`,
        status: 'SENT',
      },
    });

    this.logger.log(`[DEMO OTP] Code generated for ${cleanId}: ${otp}`);

    // 5. Send OTP via OtpDeliveryService
    const result = await this.otpDeliveryService.sendOtp(cleanId, otp);

    return {
      success: true,
      message: result.message,
      demoWhatsAppUrl: result.demoWhatsAppUrl,
      identifier: cleanId,
      expiresInSeconds: 300,
    };
  }

  async verifyCustomerOtp(identifierOrPhone: string, otp: string, name?: string) {
    const cleanId = this.normalizePhone(identifierOrPhone);

    // 1. Find the latest active OTP request
    const otpRecord = await this.prisma.raw.otpRequest.findFirst({
      where: {
        identifier: cleanId,
        isVerified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('OTP has expired or was not requested. Please request a new OTP.');
    }

    // 2. Check maximum attempt limits (Max 3 attempts per OTP)
    if (otpRecord.attempts >= 3) {
      throw new BadRequestException('Maximum verification attempts exceeded. Please request a new OTP.');
    }

    // 3. Verify OTP (Plaintext in DEMO mode, hashed in production)
    const isHashingDisabled = process.env.OTP_HASHING === 'false' || process.env.WHATSAPP_OTP_MODE === 'DEMO';
    const inputToCompare = isHashingDisabled ? otp.trim() : this.hashOtp(otp.trim());

    if (inputToCompare !== otpRecord.otpHash) {
      await this.prisma.raw.otpRequest.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      const remainingAttempts = 2 - otpRecord.attempts;
      if (remainingAttempts <= 0) {
        throw new BadRequestException('Maximum verification attempts exceeded. Please request a new OTP.');
      }
      throw new BadRequestException(`Invalid OTP. ${remainingAttempts} attempts remaining.`);
    }

    // 4. Mark OTP as verified so it cannot be reused
    await this.prisma.raw.otpRequest.update({
      where: { id: otpRecord.id },
      data: { isVerified: true },
    });

    // 5. Find or create user
    const isEmail = cleanId.includes('@');
    let user = await this.prisma.client.user.findFirst({
      where: isEmail ? { email: cleanId } : { phone: cleanId },
      include: { addresses: true, cart: { include: { items: true } } },
    });

    const trimmedName = name?.trim();

    if (!user) {
      const userCode = `USR-${Date.now().toString(36).toUpperCase()}`;
      const finalName = trimmedName || (isEmail ? cleanId.split('@')[0] : 'Customer');
      user = await this.prisma.client.user.create({
        data: {
          userCode,
          name: finalName,
          email: isEmail ? cleanId : null,
          phone: !isEmail ? cleanId : null,
          isActive: true,
          cart: {
            create: {},
          },
        },
        include: { addresses: true, cart: { include: { items: true } } },
      });
    } else {
      // If user exists, update their name if they supplied a name or if they have an autogenerated "Customer XXXX" name
      const isAutoGenerated = !user.name || user.name.startsWith('Customer ') || user.name === 'Customer';
      if (trimmedName && (isAutoGenerated || trimmedName !== user.name)) {
        user = await this.prisma.client.user.update({
          where: { id: user.id },
          data: { name: trimmedName },
          include: { addresses: true, cart: { include: { items: true } } },
        });
      }
    }

    // 6. Generate Tokens
    const payload = { sub: user.id, type: 'customer', userCode: user.userCode };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'ayngaran_secret_jwt_key_2026_super_secure_access_token',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'ayngaran_secret_jwt_refresh_key_2026_rotation',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return {
      message: 'Logged in successfully',
      user: {
        id: user.id,
        userCode: user.userCode,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses,
      },
      accessToken,
      refreshToken,
    };
  }

  // -------------------------------------------------------------
  // STAFF CREDENTIALS WORKFLOW
  // -------------------------------------------------------------

  async loginStaff(email: string, password: string, ipAddress?: string) {
    const cleanEmail = email.trim().toLowerCase();

    const staff = await this.prisma.client.staff.findUnique({
      where: { email: cleanEmail },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, staff.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const permissions = staff.role.permissions.map((rp) => rp.permission.code);

    const payload = {
      sub: staff.id,
      type: 'staff',
      staffCode: staff.staffCode,
      role: staff.role.name,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'ayngaran_secret_jwt_key_2026_super_secure_access_token',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'ayngaran_secret_jwt_refresh_key_2026_rotation',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    // Write audit trail for staff login
    await this.prisma.raw.auditLog.create({
      data: {
        staffId: staff.id,
        action: 'STAFF_LOGIN',
        entityType: 'Staff',
        entityId: String(staff.id),
        newValueJson: JSON.stringify({ email: staff.email, role: staff.role.name }),
        ipAddress: ipAddress || '127.0.0.1',
      },
    });

    return {
      message: 'Staff login successful',
      staff: {
        id: staff.id,
        staffCode: staff.staffCode,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role.name,
        permissions,
      },
      accessToken,
      refreshToken,
    };
  }

  // -------------------------------------------------------------
  // TOKEN REFRESH
  // -------------------------------------------------------------

  async refreshCustomerToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'ayngaran_secret_jwt_refresh_key_2026_rotation',
      });

      if (payload.type !== 'customer') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.client.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      const newAccessToken = this.jwtService.sign(
        { sub: user.id, type: 'customer', userCode: user.userCode },
        {
          secret: process.env.JWT_SECRET || 'ayngaran_secret_jwt_key_2026_super_secure_access_token',
          expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        },
      );

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async refreshStaffToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'ayngaran_secret_jwt_refresh_key_2026_rotation',
      });

      if (payload.type !== 'staff') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const staff = await this.prisma.client.staff.findUnique({
        where: { id: payload.sub },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!staff || !staff.isActive) {
        throw new UnauthorizedException('Staff account is inactive');
      }

      const permissions = staff.role.permissions.map((rp) => rp.permission.code);
      const newAccessToken = this.jwtService.sign(
        {
          sub: staff.id,
          type: 'staff',
          staffCode: staff.staffCode,
          role: staff.role.name,
          permissions,
        },
        {
          secret: process.env.JWT_SECRET || 'ayngaran_secret_jwt_key_2026_super_secure_access_token',
          expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        },
      );

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // -------------------------------------------------------------
  // CUSTOMER PROFILE MANAGEMENT
  // -------------------------------------------------------------

  async updateCustomerProfile(userId: number, data: { name?: string; email?: string }) {
    const update: any = {};
    if (data.name !== undefined) update.name = data.name.trim() || null;
    if (data.email !== undefined && data.email.trim()) {
      const cleanEmail = data.email.trim().toLowerCase();
      const existing = await this.prisma.client.user.findFirst({
        where: { email: cleanEmail, NOT: { id: userId } },
      });
      if (existing) {
        throw new BadRequestException('This email address is already in use by another user account.');
      }
      update.email = cleanEmail;
    } else if (data.email !== undefined) {
      update.email = null;
    }

    try {
      const updated = await this.prisma.client.user.update({
        where: { id: userId },
        data: update,
        select: { id: true, userCode: true, name: true, email: true, phone: true },
      });

      return updated;
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new BadRequestException('This email address is already in use by another user account.');
      }
      throw err;
    }
  }

  // -------------------------------------------------------------
  // CUSTOMER ADDRESS MANAGEMENT
  // -------------------------------------------------------------

  async getCustomerAddresses(userId: number) {
    return this.prisma.client.userAddress.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async addCustomerAddress(userId: number, data: any) {
    // If this is the first address or marked as default, ensure exclusive default
    const existingCount = await this.prisma.client.userAddress.count({
      where: { userId, deletedAt: null },
    });

    const isFirst = existingCount === 0;
    const shouldBeDefault = isFirst || !!data.isDefault;

    if (shouldBeDefault) {
      // Clear existing defaults
      await this.prisma.client.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.client.userAddress.create({
      data: {
        userId,
        recipientName: data.recipientName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country || 'India',
        isDefault: shouldBeDefault,
      },
    });
  }

  async updateCustomerAddress(userId: number, addressId: number, data: any) {
    // Verify ownership
    const address = await this.prisma.client.userAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });
    if (!address) throw new BadRequestException('Address not found');

    if (data.isDefault) {
      await this.prisma.client.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.client.userAddress.update({
      where: { id: addressId },
      data: {
        recipientName: data.recipientName ?? address.recipientName,
        phone: data.phone ?? address.phone,
        addressLine1: data.addressLine1 ?? address.addressLine1,
        addressLine2: data.addressLine2 !== undefined ? data.addressLine2 : address.addressLine2,
        city: data.city ?? address.city,
        state: data.state ?? address.state,
        pincode: data.pincode ?? address.pincode,
        country: data.country ?? address.country,
        isDefault: data.isDefault !== undefined ? data.isDefault : address.isDefault,
      },
    });
  }

  async setDefaultAddress(userId: number, addressId: number) {
    // Verify ownership
    const address = await this.prisma.client.userAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });
    if (!address) throw new BadRequestException('Address not found');

    // Clear all defaults, set this one
    await this.prisma.client.userAddress.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    return this.prisma.client.userAddress.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
  }

  async deleteCustomerAddress(userId: number, addressId: number) {
    const address = await this.prisma.client.userAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });
    if (!address) throw new BadRequestException('Address not found');

    return this.prisma.client.userAddress.update({
      where: { id: addressId },
      data: { deletedAt: new Date() },
    });
  }
}
