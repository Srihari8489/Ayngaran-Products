import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAdminAuth } from './AdminAuthContext';

export interface OrderNotificationItem {
  id: string; // unique deduplication id
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  itemCount: number;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  orderStatus: string;
  createdAt: string;
  read: boolean;
}

interface OrderNotificationContextType {
  notifications: OrderNotificationItem[];
  unreadCount: number;
  isConnected: boolean;
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  toggleSound: () => void;
  toggleBrowserNotifications: () => Promise<void>;
  markAsRead: (orderId: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  subscribeToNewOrders: (callback: (order: OrderNotificationItem) => void) => () => void;
  subscribeToOrderStatus: (callback: (event: { orderId: number; orderNumber: string; oldStatus: string; newStatus: string }) => void) => () => void;
  subscribeToReconnect: (callback: () => void) => () => void;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

// Web Audio API chime synthesizer for crisp notification bell
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // First tone (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Second tone (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.65);
  } catch (err) {
    // Autoplay restrictions or unavailable audio context handled safely
  }
}

export const OrderNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  const [notifications, setNotifications] = useState<OrderNotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ayngaran_sound_notif') !== 'false';
  });
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ayngaran_browser_notif') === 'true';
  });

  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Set<(order: OrderNotificationItem) => void>>(new Set());
  const statusListenersRef = useRef<Set<(event: { orderId: number; orderNumber: string; oldStatus: string; newStatus: string }) => void>>(new Set());
  const reconnectListenersRef = useRef<Set<() => void>>(new Set());

  // Deduplication cache to prevent handling the exact same order event multiple times
  const processedOrderIdsRef = useRef<Set<string>>(new Set());

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('ayngaran_sound_notif', String(next));
  };

  const toggleBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Browser notifications are not supported by this browser.');
      return;
    }

    if (Notification.permission === 'granted') {
      const next = !browserNotificationsEnabled;
      setBrowserNotificationsEnabled(next);
      localStorage.setItem('ayngaran_browser_notif', String(next));
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setBrowserNotificationsEnabled(true);
        localStorage.setItem('ayngaran_browser_notif', 'true');
      } else {
        setBrowserNotificationsEnabled(false);
        localStorage.setItem('ayngaran_browser_notif', 'false');
      }
    }
  };

  const markAsRead = (orderId: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.orderId === orderId ? { ...n, read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const subscribeToNewOrders = useCallback((callback: (order: OrderNotificationItem) => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  const subscribeToOrderStatus = useCallback((callback: (event: { orderId: number; orderNumber: string; oldStatus: string; newStatus: string }) => void) => {
    statusListenersRef.current.add(callback);
    return () => {
      statusListenersRef.current.delete(callback);
    };
  }, []);

  const subscribeToReconnect = useCallback((callback: () => void) => {
    reconnectListenersRef.current.add(callback);
    return () => {
      reconnectListenersRef.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem('ayngaran_admin_token');
    if (!token) return;

    // Connect to backend Socket.IO gateway on port 4000
    const serverUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:4000'
      : `${window.location.protocol}//${window.location.hostname}:4000`;

    const socket = io(serverUrl, {
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

    socket.on('reconnect', () => {
      setIsConnected(true);
      // Notify active pages to re-verify/fetch recent orders
      reconnectListenersRef.current.forEach((fn) => {
        try {
          fn();
        } catch {}
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('auth_error', (err) => {
      console.warn('[Admin Socket Auth Error]', err);
    });

    // Real-Time Event: order.created
    socket.on('order.created', (eventPayload: any) => {
      const data = eventPayload?.data || eventPayload;
      if (!data || !data.orderNumber) return;

      const deduplicationKey = `${data.orderId || data.orderNumber}`;

      // Idempotency: Reject duplicate events in memory
      if (processedOrderIdsRef.current.has(deduplicationKey)) {
        return;
      }
      processedOrderIdsRef.current.add(deduplicationKey);

      const newItem: OrderNotificationItem = {
        id: deduplicationKey,
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        customerName: data.customer?.name || 'Customer',
        customerPhone: data.customer?.phone,
        customerEmail: data.customer?.email,
        itemCount: data.itemCount || 1,
        quantity: data.quantity || 1,
        totalAmount: Number(data.totalAmount || 0),
        paymentStatus: data.paymentStatus || 'PENDING',
        paymentMethod: data.paymentMethod || 'COD',
        orderStatus: data.orderStatus || 'CONFIRMED',
        createdAt: data.createdAt || new Date().toISOString(),
        read: false,
      };

      // 1. Prepend to in-memory notification queue (cap at 50)
      setNotifications((prev) => [newItem, ...prev.filter((n) => n.id !== deduplicationKey)].slice(0, 50));

      // 2. Play Audio Chime if enabled
      if (soundEnabled) {
        playNotificationChime();
      }

      // 3. Display Browser Push Notification if enabled and permitted
      if (browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const n = new Notification(`🔔 New Order: #${newItem.orderNumber}`, {
            body: `${newItem.customerName} placed an order for ₹${newItem.totalAmount.toFixed(2)} (${newItem.itemCount} items)`,
            icon: '/favicon.ico',
            tag: newItem.orderNumber,
          });
          n.onclick = () => {
            window.focus();
            window.location.href = `/orders?highlight=${newItem.orderId}`;
          };
        } catch {}
      }

      // 4. Notify all registered active page listeners (e.g. OrdersPage, DashboardPage)
      listenersRef.current.forEach((fn) => {
        try {
          fn(newItem);
        } catch (err) {
          console.error('[Notification Listener Error]', err);
        }
      });
    });

    socket.on('order.status.updated', (event: any) => {
      if (!event || !event.orderId) return;
      setNotifications((prev) =>
        prev.map((n) =>
          n.orderId === event.orderId ? { ...n, orderStatus: event.newStatus } : n,
        ),
      );
      statusListenersRef.current.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error('[Status Listener Error]', err);
        }
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, soundEnabled, browserNotificationsEnabled]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <OrderNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        soundEnabled,
        browserNotificationsEnabled,
        toggleSound,
        toggleBrowserNotifications,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        subscribeToNewOrders,
        subscribeToOrderStatus,
        subscribeToReconnect,
      }}
    >
      {children}
    </OrderNotificationContext.Provider>
  );
};

export const useOrderNotifications = () => {
  const context = useContext(OrderNotificationContext);
  if (!context) {
    throw new Error('useOrderNotifications must be used within an OrderNotificationProvider');
  }
  return context;
};
