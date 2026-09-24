import React, { useEffect, useState } from 'react';
import {
  Layers,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  X
} from 'lucide-react';
import adminApi from '../api/client';
import { InventoryTransaction, PaginationMeta } from '../types';
import { Pagination } from '../components/Pagination';
import { useDebounce } from '../hooks/useDebounce';
import { AdminModal } from '../components/AdminModal';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LEDGER'>('OVERVIEW');
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [stockPagination, setStockPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [stockPage, setStockPage] = useState(1);
  const [stockLimit, setStockLimit] = useState(20);

  const [ledgerItems, setLedgerItems] = useState<InventoryTransaction[]>([]);
  const [ledgerPagination, setLedgerPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLimit, setLedgerLimit] = useState(20);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  // Stock Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adjustData, setAdjustData] = useState({
    variantId: '',
    quantityChange: '',
    type: 'RESTOCK' as 'RESTOCK' | 'ADJUSTMENT' | 'RETURN',
    reason: '',
  });
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const fetchStock = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(stockPage));
      params.append('limit', String(stockLimit));
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (lowStockOnly) params.append('lowStockOnly', 'true');

      const res: any = await adminApi.get(`/inventory?${params.toString()}`);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setStockItems(Array.isArray(items) ? items : []);
      if (res?.pagination) {
        setStockPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load stock overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    try {
      setLedgerLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(ledgerPage));
      params.append('limit', String(ledgerLimit));
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (ledgerTypeFilter !== 'ALL') params.append('type', ledgerTypeFilter);

      const res: any = await adminApi.get(`/inventory/history?${params.toString()}`);
      const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setLedgerItems(Array.isArray(items) ? items : []);
      if (res?.pagination) {
        setLedgerPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load inventory ledger:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  // Reset pages on filter/search change
  useEffect(() => {
    if (activeTab === 'OVERVIEW') {
      setStockPage(1);
    } else {
      setLedgerPage(1);
    }
  }, [debouncedSearch, lowStockOnly, ledgerTypeFilter, activeTab]);

  useEffect(() => {
    if (activeTab === 'OVERVIEW') {
      fetchStock();
    }
  }, [activeTab, stockPage, stockLimit, debouncedSearch, lowStockOnly]);

  useEffect(() => {
    if (activeTab === 'LEDGER') {
      fetchLedger();
    }
  }, [activeTab, ledgerPage, ledgerLimit, debouncedSearch, ledgerTypeFilter]);

  const handleOpenAdjustModal = (item?: any) => {
    setSelectedVariant(item || null);
    setAdjustData({
      variantId: item ? String(item.variantId || item.id) : stockItems.length > 0 ? String(stockItems[0].variantId || stockItems[0].id) : '',
      quantityChange: '10',
      type: 'RESTOCK',
      reason: 'Physical inventory restock batch',
    });
    setAdjustError('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');
    setAdjustSubmitting(true);

    try {
      await adminApi.post('/inventory/adjust', {
        variantId: Number(adjustData.variantId),
        quantityChange: Number(adjustData.quantityChange),
        type: adjustData.type,
        reason: adjustData.reason,
      });

      setIsAdjustModalOpen(false);
      fetchStock();
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Failed to adjust stock. Verify quantity does not cause negative balance.');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const filteredStock = Array.isArray(stockItems) ? stockItems : [];
  const lowStockCount = stockPagination.total ? stockItems.filter((i) => i.isLowStock).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Stock & Inventory</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Monitor warehouse stock, track low stock alerts, and update inventory counts.
          </p>
        </div>

        <button onClick={() => handleOpenAdjustModal()} className="btn-primary" style={{ fontSize: '0.88rem' }}>
          <Plus size={16} />
          <span>Update Stock Levels</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`btn-secondary ${activeTab === 'OVERVIEW' ? 'border-amber-500/50' : ''}`}
          style={{
            fontSize: '0.88rem',
            fontWeight: 600,
            backgroundColor: activeTab === 'OVERVIEW' ? '#fef3c7' : '#ffffff',
            color: activeTab === 'OVERVIEW' ? '#b45309' : '#475569',
            borderColor: activeTab === 'OVERVIEW' ? '#f59e0b' : '#e2e8f0',
          }}
        >
          <Layers size={16} />
          <span>Current Stock</span>
          {lowStockCount > 0 && (
            <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
              {lowStockCount} Low
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`btn-secondary ${activeTab === 'LEDGER' ? 'border-amber-500/50' : ''}`}
          style={{
            fontSize: '0.88rem',
            fontWeight: 600,
            backgroundColor: activeTab === 'LEDGER' ? '#fef3c7' : '#ffffff',
            color: activeTab === 'LEDGER' ? '#b45309' : '#475569',
            borderColor: activeTab === 'LEDGER' ? '#f59e0b' : '#e2e8f0',
          }}
        >
          <ShieldCheck size={16} />
          <span>Stock History Log</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Controls toolbar */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: search ? '2.5rem' : '1rem' }}
                placeholder="Search by SKU, product name, or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.2rem',
                    borderRadius: '50%',
                  }}
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#0f172a', cursor: 'pointer', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              <span style={{ color: lowStockOnly ? '#b45309' : '#475569' }}>
                Show Low Stock Alerts Only ({lowStockCount})
              </span>
            </label>
          </div>

          {/* Table */}
          <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Variant SKU</th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Available Stock</th>
                    <th>Alert Threshold</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        Loading inventory status...
                      </td>
                    </tr>
                  ) : filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        <div>No inventory records found matching your search.</div>
                        {search && (
                          <button
                            onClick={() => setSearch('')}
                            className="btn-secondary"
                            style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
                          >
                            Clear Search
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map((item) => {
                      const isLow = item.stockQuantity <= item.minStockAlert;
                      return (
                        <tr key={item.variantId || item.id}>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#b45309', fontSize: '0.88rem' }}>
                              {item.sku}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.productName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Code: {item.productCode}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                              ₹{Number(item.price).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: isLow ? '#dc2626' : '#0f172a' }}>
                              {item.stockQuantity}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.25rem' }}>units</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                              ≤ {item.minStockAlert} units
                            </span>
                          </td>
                          <td>
                            {isLow ? (
                              <span className="badge badge-warning">
                                <AlertTriangle size={12} /> Low Stock Alert
                              </span>
                            ) : (
                              <span className="badge badge-success">
                                <CheckCircle2 size={12} /> In Stock
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => handleOpenAdjustModal(item)}
                              className="btn-secondary"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                            >
                              Update Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={stockPagination}
              onPageChange={setStockPage}
              onLimitChange={setStockLimit}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* TAB 2: LEDGER */}
      {activeTab === 'LEDGER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <ShieldCheck size={20} style={{ color: '#2563eb' }} />
            <div style={{ fontSize: '0.85rem', color: '#1e3a8a' }}>
              <strong>Stock History Log:</strong> Every stock addition, customer order deduction, restock shipment, or manual adjustment is safely recorded here for full inventory transparency.
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Date & Time</th>
                    <th>Product / Variant SKU</th>
                    <th>Type</th>
                    <th>Quantity Change</th>
                    <th>Stock Delta</th>
                    <th>Reason</th>
                    <th>Updated By</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerLoading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        Loading stock history...
                      </td>
                    </tr>
                  ) : ledgerItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        No stock transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerItems.map((tx: any) => {
                      const isPositive = tx.quantityChange > 0;
                      return (
                        <tr key={tx.id}>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748b' }}>
                              #{tx.id}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                              {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{tx.product?.name || 'Product'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#b45309', fontFamily: 'var(--font-mono)' }}>
                              {tx.variant?.sku || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                tx.type === 'RESTOCK' || tx.type === 'INITIAL'
                                  ? 'badge-success'
                                  : tx.type === 'ORDER_DEDUCTION'
                                  ? 'badge-warning'
                                  : 'badge-info'
                              }`}
                              style={{ fontSize: '0.7rem' }}
                            >
                              {tx.type === 'ORDER_DEDUCTION' ? 'Customer Order' : tx.type === 'RESTOCK' ? 'Restock' : tx.type}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: '0.95rem',
                                color: isPositive ? '#16a34a' : '#e11d48',
                              }}
                            >
                              {isPositive ? `+${tx.quantityChange}` : tx.quantityChange}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748b' }}>
                              {tx.previousQuantity} → <strong style={{ color: '#0f172a' }}>{tx.newQuantity}</strong>
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.82rem', color: '#334155' }}>
                              {tx.reason || '—'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {tx.staff?.name || 'Store System'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              pagination={ledgerPagination}
              onPageChange={setLedgerPage}
              onLimitChange={setLedgerLimit}
              loading={ledgerLoading}
            />
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      <AdminModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Update Stock Quantity"
        subtitle="Record a restock shipment or adjust quantity based on physical warehouse count"
        maxWidth="32rem"
      >
        {adjustError && (
          <div style={{ padding: '0.65rem 1rem', borderRadius: '0.65rem', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem' }}>
            {adjustError}
          </div>
        )}

        <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
              Select Product Variant
            </label>
            <select
              className="form-select"
              value={adjustData.variantId}
              onChange={(e) => setAdjustData({ ...adjustData, variantId: e.target.value })}
              required
            >
              {stockItems.map((item) => (
                <option key={item.variantId || item.id} value={item.variantId || item.id}>
                  {item.sku} — {item.productName} (Current: {item.stockQuantity})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                Adjustment Reason
              </label>
              <select
                className="form-select"
                value={adjustData.type}
                onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value as any })}
              >
                <option value="RESTOCK">Restock (New stock arrived)</option>
                <option value="ADJUSTMENT">Stock Count Adjustment</option>
                <option value="RETURN">Customer Return</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
                Quantity (+ / -) *
              </label>
              <input
                type="number"
                required
                className="form-input"
                value={adjustData.quantityChange}
                onChange={(e) => setAdjustData({ ...adjustData, quantityChange: e.target.value })}
                placeholder="e.g. 25 or -5"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', fontWeight: 600, marginBottom: '0.35rem' }}>
              Notes / Reference *
            </label>
            <input
              type="text"
              required
              className="form-input"
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              placeholder="e.g. Supplier delivery invoice #4092"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adjustSubmitting}
              className="btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              {adjustSubmitting ? 'Saving...' : 'Save Stock Update'}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

