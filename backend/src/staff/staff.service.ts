import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const staffList = await this.prisma.client.staff.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return staffList.map((s) => ({
      id: s.id,
      staffCode: s.staffCode,
      name: s.name,
      email: s.email,
      phone: s.phone,
      isActive: s.isActive,
      role: s.role.name,
      roleId: s.role.id,
      permissions: s.role.permissions.map((p) => p.permission.code),
      createdAt: s.createdAt,
    }));
  }

  async findOne(id: number) {
    const s = await this.prisma.client.staff.findUnique({
      where: { id },
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

    if (!s) throw new NotFoundException(`Staff with ID ${id} not found`);

    return {
      id: s.id,
      staffCode: s.staffCode,
      name: s.name,
      email: s.email,
      phone: s.phone,
      isActive: s.isActive,
      role: s.role.name,
      roleId: s.role.id,
      permissions: s.role.permissions.map((p) => p.permission.code),
      createdAt: s.createdAt,
    };
  }

  async create(dto: CreateStaffDto, currentStaffId?: number) {
    const existing = await this.prisma.raw.staff.findFirst({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (existing) {
      throw new BadRequestException(`A staff member with email ${dto.email} already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);
    const staffCode = `STF-${Date.now().toString(36).toUpperCase()}`;

    const newStaff = await this.prisma.client.staff.create({
      data: {
        staffCode,
        name: dto.name,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone || null,
        passwordHash,
        roleId: dto.roleId,
        isActive: true,
      },
      include: { role: true },
    });

    // Write audit log
    await this.prisma.raw.auditLog.create({
      data: {
        staffId: currentStaffId || null,
        action: 'CREATE_STAFF',
        entityType: 'Staff',
        entityId: String(newStaff.id),
        newValueJson: JSON.stringify({
          staffCode: newStaff.staffCode,
          name: newStaff.name,
          email: newStaff.email,
          role: newStaff.role.name,
        }),
      },
    });

    return {
      id: newStaff.id,
      staffCode: newStaff.staffCode,
      name: newStaff.name,
      email: newStaff.email,
      phone: newStaff.phone,
      role: newStaff.role.name,
      isActive: newStaff.isActive,
      createdAt: newStaff.createdAt,
    };
  }

  async update(id: number, dto: UpdateStaffDto, currentStaffId?: number) {
    const existing = await this.prisma.client.staff.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existing) throw new NotFoundException(`Staff with ID ${id} not found`);

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.email) updateData.email = dto.email.trim().toLowerCase();
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.roleId) updateData.roleId = dto.roleId;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(dto.password, salt);
    }

    const updated = await this.prisma.client.staff.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    // Write audit log
    await this.prisma.raw.auditLog.create({
      data: {
        staffId: currentStaffId || null,
        action: 'UPDATE_STAFF',
        entityType: 'Staff',
        entityId: String(id),
        oldValueJson: JSON.stringify({ name: existing.name, role: existing.role.name, isActive: existing.isActive }),
        newValueJson: JSON.stringify({ name: updated.name, role: updated.role.name, isActive: updated.isActive }),
      },
    });

    return {
      id: updated.id,
      staffCode: updated.staffCode,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role.name,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }

  async softDelete(id: number, currentStaffId: number) {
    if (id === currentStaffId) {
      throw new ForbiddenException('You cannot delete your own staff account.');
    }

    const existing = await this.prisma.client.staff.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!existing) throw new NotFoundException(`Staff with ID ${id} not found`);

    if (existing.role.name === 'SUPER_ADMIN') {
      const superAdminCount = await this.prisma.client.staff.count({
        where: { role: { name: 'SUPER_ADMIN' } },
      });
      if (superAdminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last remaining Super Admin account.');
      }
    }

    return this.prisma.softDelete('Staff', id, currentStaffId);
  }

  async restore(id: number, currentStaffId: number) {
    return this.prisma.restore('Staff', id, currentStaffId);
  }

  async findAllRoles() {
    return this.prisma.client.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findAllPermissions() {
    return this.prisma.client.permission.findMany({
      orderBy: { module: 'asc' },
    });
  }
}
