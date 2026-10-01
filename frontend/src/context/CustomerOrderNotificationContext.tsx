import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

export interface OrderStatusUpdatedPayload {
  orderId: number;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  notes?: string | null;
  updatedAt: string;
}

export interface CustomerToastAlert {
  id: string;
  orderId: number;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  message: string;
  timestamp: number;
}

interface CustomerOrderNotificationContextValue {
  isConnected: boolean;
  toast: CustomerToastAlert | null;
  dismissToast: () => void;
  subscribeToOrderStatus: (callback: (event: OrderStatusUpdatedPayload) => void) => () => void;
}

const CustomerOrderNotificationContext = createContext<CustomerOrderNotificationContextValue | null>(null);

function getSocketHost(): string {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return 'http://localhost:4000';
}

function playCustomerNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio autoplay restrictions caught safely
  }
}

const STATUS_FRIENDLY_NAMES: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return Requested',
  RETURNED: 'Returned',
  REFUNDED: 'Refunded',
};

export const CustomerOrderNotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [toast, setToast] = useState<CustomerToastAlert | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Set<(event: OrderStatusUpdatedPayload) => void>>(new Set());
  const processedEventKeysRef = useRef<Set<string>>(new Set());
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const subscribeToOrderStatus = useCallback(
    (callback: (event: OrderStatusUpdatedPayload) => void) => {
      listenersRef.current.add(callback);
      return () => {
        listenersRef.current.delete(callback);
      };
    },
    [],
  );

  useEffect(() => {
    // Only connect if customer is authenticated
    const token = localStorage.getItem('ayngaran_customer_token');
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const host = getSocketHost();

    const socket = io(host, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    // Handle incoming real-time order status update for this customer
    socket.on('order.status.updated', (event: OrderStatusUpdatedPayload) => {
      if (!event || !event.orderId) return;

      // Duplicate Event Protection
      const eventKey = `${event.orderId}:${event.newStatus}:${event.updatedAt}`;
      if (processedEventKeysRef.current.has(eventKey)) {
        return;
      }
      processedEventKeysRef.current.add(eventKey);

      // Keep cache small
      if (processedEventKeysRef.current.size > 200) {
        const first = processedEventKeysRef.current.values().next().value;
        if (first) processedEventKeysRef.current.delete(first);
      }

      // Play subtle sound
      playCustomerNotificationSound();

      // Show toast alert
      const friendlyStatus = STATUS_FRIENDLY_NAMES[event.newStatus] || event.newStatus;
      const message = `Order ${event.orderNumber} is now ${friendlyStatus}.`;

      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      setToast({
        id: `${event.orderId}-${Date.now()}`,
        orderId: event.orderId,
        orderNumber: event.orderNumber,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus,
        message,
        timestamp: Date.now(),
      });

      // Auto dismiss after 6 seconds
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
      }, 6000);

      // Notify all active page listeners
      listenersRef.current.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error('Error in customer order status subscriber:', err);
        }
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [isAuthenticated, user?.id]);

  return (
    <CustomerOrderNotificationContext.Provider
      value={{
        isConnected,
        toast,
        dismissToast,
        subscribeToOrderStatus,
      }}
    >
      {children}
      {/* Real-time Order Status Floating Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '1.25rem',
            right: '1.25rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: '#18181b',
            color: '#f4f4f5',
            padding: '0.85rem 1.15rem',
            borderRadius: '0.75rem',
            border: '1px solid #27272a',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            animation: 'fadeInSlide 0.3s ease-out',
            maxWidth: '360px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor:
                toast.newStatus === 'CANCELLED'
                  ? '#ef4444'
                  : toast.newStatus === 'DELIVERED'
                  ? '#10b981'
                  : '#f59e0b',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Order Status Updated</div>
            <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '2px' }}>
              {toast.message}
            </div>
          </div>
          <button
            onClick={dismissToast}
            style={{
              background: 'none',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '1rem',
              lineHeight: 1,
            }}
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>
      )}
    </CustomerOrderNotificationContext.Provider>
  );
};

export const useCustomerOrderNotifications = () => {
  const context = useContext(CustomerOrderNotificationContext);
  if (!context) {
    throw new Error(
      'useCustomerOrderNotifications must be used within a CustomerOrderNotificationProvider',
    );
  }
  return context;
};
