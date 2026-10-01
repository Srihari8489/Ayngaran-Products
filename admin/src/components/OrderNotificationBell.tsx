import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Volume2,
  VolumeX,
  Radio,
  CheckCheck,
  ShoppingBag,
  ExternalLink,
  Clock,
  Trash2,
} from 'lucide-react';
import { useOrderNotifications, OrderNotificationItem } from '../context/OrderNotificationContext';

function formatTimeAgo(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 30) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return 'Recent';
  }
}

export const OrderNotificationBell: React.FC = () => {
  const {
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
  } = useOrderNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpenOrder = (notif: OrderNotificationItem) => {
    markAsRead(notif.orderId);
    setIsOpen(false);
    navigate(`/orders?highlight=${notif.orderId}`);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={isConnected ? 'Live Order Notifications (Connected)' : 'Order Notifications (Connecting...)'}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2.4rem',
          height: '2.4rem',
          borderRadius: '0.6rem',
          backgroundColor: isOpen ? '#e2e8f0' : '#f1f5f9',
          border: '1px solid #cbd5e1',
          color: '#1a3d2b',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <Bell size={18} style={{ color: unreadCount > 0 ? '#1a3d2b' : '#64748b' }} />

        {/* Live WebSocket Connection Status Dot */}
        <span
          title={isConnected ? 'WebSocket Live' : 'WebSocket Disconnected'}
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: '7px',
            height: '7px',
            borderRadius: '9999px',
            backgroundColor: isConnected ? '#22c55e' : '#ef4444',
            boxShadow: isConnected ? '0 0 6px #22c55e' : 'none',
            border: '1px solid #ffffff',
          }}
        />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              minWidth: '1.15rem',
              height: '1.15rem',
              padding: '0 0.25rem',
              borderRadius: '9999px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(220, 38, 38, 0.4)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.6rem)',
            right: 0,
            width: '380px',
            maxWidth: '90vw',
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0,0,0,0.06)',
            zIndex: 100,
            overflow: 'hidden',
            animation: 'fadeInSlide 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              background: 'linear-gradient(135deg, #1a3d2b 0%, #0d2318 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                New Orders
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Quick Action Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? 'Order Sound Enabled' : 'Order Sound Muted'}
                style={{
                  background: soundEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  border: 'none',
                  borderRadius: '0.4rem',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} opacity={0.6} />}
              </button>

              {/* Browser Push Notifications Toggle */}
              <button
                type="button"
                onClick={toggleBrowserNotifications}
                title={browserNotificationsEnabled ? 'Browser Alerts On' : 'Enable Browser Alerts'}
                style={{
                  background: browserNotificationsEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  border: 'none',
                  borderRadius: '0.4rem',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '0.3rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Radio size={14} opacity={browserNotificationsEnabled ? 1 : 0.6} />
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#a7f3d0',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    marginLeft: '0.2rem',
                  }}
                >
                  <CheckCheck size={13} /> Read all
                </button>
              )}
            </div>
          </div>

          {/* Connection Status Banner if Disconnected */}
          {!isConnected && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                borderBottom: '1px solid #fee2e2',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>⚠️ Real-time stream reconnecting...</span>
            </div>
          )}

          {/* Notifications List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                <div
                  style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '9999px',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto',
                    color: '#94a3b8',
                  }}
                >
                  <ShoppingBag size={22} />
                </div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#334155' }}>
                  No New Orders
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Incoming customer orders will appear here in real-time.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isCod = n.paymentMethod === 'COD' || n.paymentStatus === 'PENDING_COD';
                return (
                  <div
                    key={n.id}
                    onClick={() => handleOpenOrder(n)}
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: n.read ? '#ffffff' : '#f0fdf4',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = n.read ? '#f8fafc' : '#e6f7ec';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = n.read ? '#ffffff' : '#f0fdf4';
                    }}
                  >
                    {/* Unread indicator dot */}
                    <div style={{ paddingTop: '0.35rem' }}>
                      <span
                        style={{
                          display: 'block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '9999px',
                          backgroundColor: n.read ? 'transparent' : '#16a34a',
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1a3d2b' }}>
                          #{n.orderNumber}
                        </span>
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                          ₹{n.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.35rem' }}>
                        <span>{n.customerName}</span>
                        <span style={{ margin: '0 0.35rem', color: '#cbd5e1' }}>•</span>
                        <span>{n.itemCount} item{n.itemCount > 1 ? 's' : ''} ({n.quantity} qty)</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.35rem',
                            backgroundColor: isCod ? '#fef3c7' : '#dcfce7',
                            color: isCod ? '#92400e' : '#15803d',
                          }}
                        >
                          {isCod ? 'Cash on Delivery' : 'PAID (Online)'}
                        </span>

                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Clock size={11} /> {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>
                    </div>

                    <ExternalLink size={14} style={{ color: '#94a3b8', marginTop: '0.35rem', flexShrink: 0 }} />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '0.65rem 1rem',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                type="button"
                onClick={clearNotifications}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Trash2 size={12} /> Clear history
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/orders');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1a3d2b',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Go to Orders →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
