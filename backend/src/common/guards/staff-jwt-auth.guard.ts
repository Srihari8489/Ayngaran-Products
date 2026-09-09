import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StaffJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Staff authentication token is required');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'ayngaran_secret_jwt_key_2026_super_secure_access_token',
      });

      if (payload.type !== 'staff') {
        throw new UnauthorizedException('Invalid staff token');
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
        throw new UnauthorizedException('Staff account is inactive or deleted');
      }

      request.staff = {
        id: staff.id,
        staffCode: staff.staffCode,
        name: staff.name,
        email: staff.email,
        role: staff.role.name,
        permissions: staff.role.permissions.map((p) => p.permission.code),
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired staff token');
    }
  }
}
