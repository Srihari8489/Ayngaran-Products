import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  Boxes,
  Layers,
  ChevronRight,
  ShieldCheck,
  FolderTree,
  Sliders,
  Tag,
  BarChart3,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import adminApi from '../api/client';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get('/reports/dashboard')
      .then((res: any) => {
        setData(res.data || res);
      })
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ height: '2rem', width: '12rem', backgroundColor: '#e2e8f0', borderRadius: '0.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="glass-panel" style={{ height: '7rem', borderRadius: '1rem' }} />
          ))}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const recentOrders = data?.recentOrders || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Title & Quick Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Store Dashboard
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Welcome back! Here is a summary of your sales, stock, and store activity.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/products" className="btn-primary" style={{ fontSize: '0.85rem' }}>
            <Boxes size={16} />
            <span>Manage Products</span>
          </Link>
          <Link to="/inventory" className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Layers size={16} />
            <span>Check Stock</span>
          </Link>
        </div>
      </div>

      {/* Direct Navigation Shortcuts */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Quick Store Shortcuts</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Jump directly to any section of your store
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          <Link
            to="/categories"
            style={{
              padding: '0.85rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)' }}>
              <FolderTree size={18} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>Categories</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Organize Products</span>
          </Link>

          <Link
            to="/attributes"
            style={{
              padding: '0.85rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-indigo)' }}>
              <Sliders size={18} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>Specifications</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Colors, RAM, Filters</span>
          </Link>

          <Link
            to="/brands"
            style={{
              padding: '0.85rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ec4899' }}>
              <Tag size={18} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>Brands</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Apple, Samsung, etc.</span>
          </Link>

          <Link
            to="/products"
            style={{
              padding: '0.85rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)' }}>
              <Boxes size={18} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>Products</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Add & Edit Items</span>
          </Link>

          <Link
            to="/inventory"
            style={{
              padding: '0.85rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
              <Layers size={18} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>Stock & Alerts</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Inventory Quantities</span>
          </Link>

          <Link
            to="/orders"
            style={{
              padding: '0.85rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0284c7' }}>
              <ShoppingBag size={18} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>Orders</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Customer Deliveries</span>
          </Link>

          <Link
            to="/staff"
            style={{
              padding: '0.85rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7' }}>
              <Users size={18} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>Team & Staff</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Accounts & Roles</span>
          </Link>

          <Link
            to="/reports"
            style={{
              padding: '0.85rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706' }}>
              <BarChart3 size={18} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>Sales Reports</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Revenue & Analytics</span>
          </Link>

          <Link
            to="/audit-logs"
            style={{
              padding: '0.85rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669' }}>
              <ShieldCheck size={18} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>Activity Log</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>System History</span>
          </Link>
        </div>
      </div>

      {/* Critical Alerts Banner (Low Stock) */}
      {metrics.lowStockCount > 0 && (
        <div
          style={{
            padding: '1.1rem 1.25rem',
            borderRadius: '1rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.6rem',
                backgroundColor: 'rgba(217, 119, 6, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b45309',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>
                Low Stock Alert: {metrics.lowStockCount} item(s) running low
              </p>
              <p style={{ fontSize: '0.8rem', color: '#b45309' }}>
                Some product quantities have reached low stock limits. Restock soon to avoid running out.
              </p>
            </div>
          </div>
          <Link
            to="/inventory"
            className="btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '0.45rem 0.85rem',
              borderColor: '#fcd34d',
              color: '#92400e',
              backgroundColor: '#ffffff',
            }}
          >
            Review Stock <ArrowUpRight size={14} />
          </Link>
        </div>
      )}

      {/* Primary Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Total Revenue */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Revenue
            </span>
            <div
              style={{
                padding: '0.45rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#059669',
              }}
            >
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            ₹{Number(metrics.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            From confirmed & completed orders
          </p>
        </div>

        {/* Total Orders */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Orders
            </span>
            <div
              style={{
                padding: '0.45rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#4f46e5',
              }}
            >
              <ShoppingBag size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {metrics.totalOrders || 0}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>{metrics.pendingOrdersCount || 0} Pending</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>{metrics.deliveredOrdersCount || 0} Delivered</span>
          </div>
        </div>

        {/* Catalog Products */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Products
            </span>
            <div
              style={{
                padding: '0.45rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#d97706',
              }}
            >
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {metrics.totalProducts || 0}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Across {metrics.totalCategories || 0} categories & {metrics.totalBrands || 0} brands
          </p>
        </div>

        {/* Registered Customers */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Customer Accounts
            </span>
            <div
              style={{
                padding: '0.45rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(236, 72, 153, 0.15)',
                color: '#db2777',
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {metrics.totalUsers || 0}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Registered customers
          </p>
        </div>
      </div>

      {/* Orders Status & Store Overview Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Order Status Breakdown */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Order Status Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Clock size={16} color="#d97706" />
                <span style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 500 }}>Pending Orders</span>
              </div>
              <span className="badge badge-warning">{metrics.pendingOrdersCount || 0}</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <CheckCircle2 size={16} color="#059669" />
                <span style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 500 }}>Confirmed & Ready to Ship</span>
              </div>
              <span className="badge badge-success">{metrics.confirmedOrdersCount || 0}</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Truck size={16} color="#0284c7" />
                <span style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 500 }}>Delivered Successfully</span>
              </div>
              <span className="badge badge-info">{metrics.deliveredOrdersCount || 0}</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <Link
              to="/orders"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: 'var(--accent-amber)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <span>View all customer orders</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Store Health & Features */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Store Health & Features
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
              }}
            >
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46' }}>
                ✓ Real-Time Stock Updates
              </p>
              <p style={{ fontSize: '0.78rem', color: '#047857', marginTop: '0.15rem' }}>
                Inventory counts adjust automatically with every customer purchase.
              </p>
            </div>

            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backgroundColor: '#eef2ff',
                border: '1px solid #c7d2fe',
              }}
            >
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3730a3' }}>
                ✓ Verified Customer Reviews
              </p>
              <p style={{ fontSize: '0.78rem', color: '#4338ca', marginTop: '0.15rem' }}>
                Only buyers with delivered orders can submit reviews, keeping feedback authentic.
              </p>
            </div>

            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
              }}
            >
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e' }}>
                ✓ Secure Payment Processing
              </p>
              <p style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '0.15rem' }}>
                Accept Cash on Delivery and online gateway transactions safely.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Recent Customer Orders</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest orders placed on your store</p>
          </div>
          <Link to="/orders" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
            View All Orders
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Order Status</th>
                <th>Payment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    No orders recorded yet. Place test orders from your online store!
                  </td>
                </tr>
              ) : (
                recentOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-amber)' }}>
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{order.user?.name || 'Customer'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.email || 'N/A'}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          order.orderStatus === 'CONFIRMED' || order.orderStatus === 'DELIVERED'
                            ? 'badge-success'
                            : order.orderStatus === 'CANCELLED'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{order.paymentStatus}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
