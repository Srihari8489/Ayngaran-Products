import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const SOFT_DELETE_MODELS = [
  'Role',
  'Permission',
  'RolePermission',
  'Staff',
  'User',
  'UserAddress',
  'Category',
  'Attribute',
  'AttributeValue',
  'CategoryAttribute',
  'Brand',
  'Product',
  'ProductImage',
  'ProductAttributeValue',
  'ProductVariant',
  'Order',
  'OrderItem',
  'PaymentGateway',
  'DeliveryPartner',
  'OrderDeliveryAssignment',
  'Review',
];

export function createExtendedPrismaClient() {
  const prisma = new PrismaClient();

  return prisma.$extends({
    name: 'softDeleteExtension',
    query: {
      $allModels: {
        async findUnique({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            // Convert to findFirst to enforce deletedAt IS NULL
            const { where, ...rest } = args as any;
            return (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)].findFirst({
              ...rest,
              where: {
                ...where,
                deletedAt: null,
              },
            });
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async groupBy({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async delete({ model, args }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            const clientModel = (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
            return clientModel.update({
              where: args.where,
              data: {
                deletedAt: new Date(),
              },
            });
          }
          throw new Error(`Hard deletion is blocked for model ${model}.`);
        },
        async deleteMany({ model, args }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            const clientModel = (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
            return clientModel.updateMany({
              where: args.where,
              data: {
                deletedAt: new Date(),
              },
            });
          }
          throw new Error(`Hard deletion is blocked for model ${model}.`);
        },
        async update({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            // Prevent modifying soft-deleted entities unless explicitly restoring
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public raw: PrismaClient;
  public client: ExtendedPrismaClient;

  constructor() {
    this.raw = new PrismaClient();
    this.client = createExtendedPrismaClient();
  }

  async onModuleInit() {
    await this.raw.$connect();
  }

  async onModuleDestroy() {
    await this.raw.$disconnect();
    await (this.client as any).$disconnect?.();
  }

  // Admin bypass methods for inspecting soft-deleted records or history
  async findWithDeleted(modelName: string, queryArgs: any = {}) {
    const clientModel = (this.raw as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (!clientModel) throw new Error(`Model ${modelName} not found`);
    return clientModel.findMany(queryArgs);
  }

  async findDeletedOnly(modelName: string, queryArgs: any = {}) {
    const clientModel = (this.raw as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (!clientModel) throw new Error(`Model ${modelName} not found`);
    const where = { ...queryArgs.where, deletedAt: { not: null } };
    return clientModel.findMany({ ...queryArgs, where });
  }

  async restore(modelName: string, id: number, staffId?: number) {
    const clientModel = (this.raw as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (!clientModel) throw new Error(`Model ${modelName} not found`);

    const existing = await clientModel.findUnique({ where: { id } });
    if (!existing) throw new Error(`${modelName} with ID ${id} not found`);

    const restored = await clientModel.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
      },
    });

    // Log the restoration action to audit_logs
    await this.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'RESTORE_ENTITY',
        entityType: modelName,
        entityId: String(id),
        oldValueJson: JSON.stringify({ deletedAt: existing.deletedAt, deletedBy: existing.deletedBy }),
        newValueJson: JSON.stringify({ deletedAt: null, deletedBy: null }),
      },
    });

    return restored;
  }

  async softDelete(modelName: string, id: number, staffId?: number) {
    const clientModel = (this.raw as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    if (!clientModel) throw new Error(`Model ${modelName} not found`);

    const existing = await clientModel.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw new Error(`${modelName} with ID ${id} not found or already deleted`);

    const deleted = await clientModel.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: staffId || null,
      },
    });

    // Log soft-delete action to audit_logs
    await this.raw.auditLog.create({
      data: {
        staffId: staffId || null,
        action: 'SOFT_DELETE_ENTITY',
        entityType: modelName,
        entityId: String(id),
        oldValueJson: JSON.stringify(existing),
        newValueJson: JSON.stringify(deleted),
      },
    });

    return deleted;
  }
}
