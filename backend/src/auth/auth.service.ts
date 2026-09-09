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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  // -------------------------------------------------------------
  // CUSTOMER OTP WORKFLOW
  // -------------------------------------------------------------

  async requestCustomerOtp(identifier: string) {
    const cleanId = identifier.trim().toLowerCase();

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
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 3. Save to immutable otp_requests ledger
    await this.prisma.raw.otpRequest.create({
      data: {
        identifier: cleanId,
        otpHash,
        expiresAt,
        attempts: 0,
        isVerified: false,
      },
    });

    // 4. Log to immutable notification_logs ledger
    await this.prisma.raw.notificationLog.create({
      data: {
        recipient: cleanId,
        channel: cleanId.includes('@') ? 'EMAIL' : 'SMS',
        subject: 'Ayngaran Store Login Verification Code',
        content: `Your Ayngaran Store verification code is: ${otp}. Valid for 5 minutes.`,
        status: 'SENT',
      },
    });

    this.logger.log(`[DEV OTP] Verification code for ${cleanId}: ${otp}`);

    return {
      message: 'OTP sent successfully to your mobile/email.',
      identifier: cleanId,
      expiresInSeconds: 300,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    };
  }

  async verifyCustomerOtp(identifier: string, otp: string) {
    const cleanId = identifier.trim().toLowerCase();

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

    // 3. Verify OTP Hash
    const hashedInput = this.hashOtp(otp.trim());
    if (hashedInput !== otpRecord.otpHash) {
      await this.prisma.raw.otpRequest.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      const remainingAttempts = 2 - otpRecord.attempts;
      throw new BadRequestException(`Invalid OTP. ${remainingAttempts} attempts remaining.`);
    }

    // 4. Mark OTP as verified
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

    if (!user) {
      const userCode = `USR-${Date.now().toString(36).toUpperCase()}`;
      user = await this.prisma.client.user.create({
        data: {
          userCode,
          name: isEmail ? cleanId.split('@')[0] : `Customer ${cleanId.slice(-4)}`,
          email: isEmail ? cleanId : null,
          phone: !isEmail ? cleanId : null,
          isActive: true,
          cart: {
            create: {},
          },
        },
        include: { addresses: true, cart: { include: { items: true } } },
      });
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
}
