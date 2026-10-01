import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OrderCreatedPayload } from './dto/order-notification.payload';

export const ADMIN_ORDERS_ROOM = 'admin:orders';

export interface OrderStatusUpdatedPayload {
  orderId: number;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  notes?: string | null;
  updatedAt: string;
}

@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests from all origins in dev or configured CORS origins
      callback(null, true);
    },
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Initializing NotificationsGateway Socket.IO authentication middleware...');

    // Strict Socket.IO Handshake Authentication Middleware
    server.use(async (socket, next) => {
      try {
        const rawToken =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization ||
          socket.handshake.query?.token;

        if (!rawToken || typeof rawToken !== 'string') {
          this.logger.warn(`[SOCKET_REJECTED] Socket ${socket.id} missing auth token`);
          return next(new Error('Authentication token is required'));
        }

        const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7).trim() : rawToken.trim();
        const jwtSecret =
          process.env.JWT_SECRET || 'ayngaran_secret_jwt_key_2026_super_secure_access_token';

        let payload: any;
        try {
          payload = this.jwtService.verify(token, { secret: jwtSecret });
        } catch {
          this.logger.warn(`[SOCKET_REJECTED] Socket ${socket.id} invalid JWT signature`);
          return next(new Error('Invalid or expired authentication token'));
        }

        // Branch 1: Staff Authentication
        if (payload.type === 'staff') {
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
            this.logger.warn(`[ADMIN_SOCKET_REJECTED] Inactive staff ID: ${payload.sub}`);
            return next(new Error('Staff account is inactive or not found'));
          }

          const roleName = (staff.role?.name || '').toUpperCase();
          const isSuperAdmin = roleName === 'SUPER_ADMIN' || roleName.includes('ADMIN');
          const userPermissions = (staff.role?.permissions || []).map((p) => p.permission.code);
          const hasOrderPermission =
            isSuperAdmin ||
            userPermissions.includes('ORDERS_MANAGE') ||
            userPermissions.includes('ORDERS_VIEW');

          if (!hasOrderPermission) {
            this.logger.warn(
              `[ADMIN_SOCKET_REJECTED] Staff ${staff.email} lacks ORDERS_MANAGE permission`,
            );
            return next(new Error('Insufficient permissions for order stream'));
          }

          socket.data.userType = 'staff';
          socket.data.staff = {
            id: staff.id,
            name: staff.name,
            email: staff.email,
            role: staff.role.name,
          };

          return next();
        }

        // Branch 2: Customer Authentication
        if (payload.type === 'customer') {
          const user = await this.prisma.client.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, name: true, email: true, phone: true, userCode: true },
          });

          if (!user) {
            this.logger.warn(`[CUSTOMER_SOCKET_REJECTED] Customer ID: ${payload.sub} not found`);
            return next(new Error('Customer account not found'));
          }

          socket.data.userType = 'customer';
          socket.data.user = user;

          return next();
        }

        this.logger.warn(`[SOCKET_REJECTED] Unknown token type: ${payload.type}`);
        return next(new Error('Unauthorized token type'));
      } catch (err: any) {
        return next(new Error('Authentication failed: ' + (err.message || 'unknown')));
      }
    });
  }

  async handleConnection(client: Socket) {
    if (client.data.userType === 'staff' && client.data.staff) {
      await client.join(ADMIN_ORDERS_ROOM);
      this.logger.log(
        `[ADMIN_SOCKET_CONNECTED] Socket ${client.id} joined ${ADMIN_ORDERS_ROOM} (Staff: ${client.data.staff.email})`,
      );

      client.emit('authenticated', {
        success: true,
        userType: 'staff',
        room: ADMIN_ORDERS_ROOM,
        staff: client.data.staff,
      });
    } else if (client.data.userType === 'customer' && client.data.user) {
      const customerRoom = `customer:${client.data.user.id}`;
      await client.join(customerRoom);
      this.logger.log(
        `[CUSTOMER_SOCKET_CONNECTED] Socket ${client.id} joined ${customerRoom} (Customer: ${client.data.user.email || client.data.user.phone})`,
      );

      client.emit('authenticated', {
        success: true,
        userType: 'customer',
        room: customerRoom,
        userId: client.data.user.id,
      });
    } else {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const ident =
      client.data?.userType === 'staff'
        ? `Staff: ${client.data.staff?.email}`
        : client.data?.userType === 'customer'
        ? `Customer: ${client.data.user?.email || client.data.user?.id}`
        : 'unauthenticated';
    this.logger.log(`[SOCKET_DISCONNECTED] Socket ${client.id} disconnected (${ident})`);
  }

  /**
   * Broadcasts order.created event to all authorized admin clients in admin:orders room
   */
  broadcastOrderCreated(payload: OrderCreatedPayload): boolean {
    try {
      if (!this.server) {
        this.logger.warn('[ORDER_NOTIFICATION_SOCKET_WARNING] Socket server instance not ready');
        return false;
      }

      this.server.to(ADMIN_ORDERS_ROOM).emit('order.created', payload);

      this.logger.log(
        `[ORDER_NOTIFICATION_SOCKET_EMITTED] order.created event emitted for #${payload.data.orderNumber} to ${ADMIN_ORDERS_ROOM}`,
      );
      return true;
    } catch (err: any) {
      this.logger.error(
        `[ORDER_NOTIFICATION_SOCKET_FAILED] Error emitting order.created for #${payload.data.orderNumber}: ${err.message}`,
        err.stack,
      );
      return false;
    }
  }

  /**
   * Emits order.status.updated event to the specific customer room and admin room
   */
  emitOrderStatusUpdated(userId: number, payload: OrderStatusUpdatedPayload): boolean {
    try {
      if (!this.server) {
        this.logger.warn('[ORDER_STATUS_SOCKET_WARNING] Socket server instance not ready');
        return false;
      }

      const customerRoom = `customer:${userId}`;
      this.server.to(customerRoom).emit('order.status.updated', payload);
      this.server.to(ADMIN_ORDERS_ROOM).emit('order.status.updated', payload);

      this.logger.log(
        `[ORDER_STATUS_SOCKET_EMITTED] order.status.updated emitted for #${payload.orderNumber} (Status: ${payload.oldStatus} -> ${payload.newStatus}) to ${customerRoom} and ${ADMIN_ORDERS_ROOM}`,
      );
      return true;
    } catch (err: any) {
      this.logger.error(
        `[ORDER_STATUS_SOCKET_FAILED] Error emitting order.status.updated for #${payload.orderNumber}: ${err.message}`,
        err.stack,
      );
      return false;
    }
  }
}
