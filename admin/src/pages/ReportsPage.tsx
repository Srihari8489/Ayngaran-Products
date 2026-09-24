import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  MapPin,
  Filter,
  Search,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';
import adminApi from '../api/client';
import { Category, Brand } from '../types';

export const ReportsPage: React.FC = () => {
  const [locationReport, setLocationReport] = useState<any[]>([]);
  const [categoryReport, setCategoryReport] = useState<any[]>([]);
  const [brandReport, setBrandReport] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (stateFilter) params.append('state', stateFilter);
      if (cityFilter) params.append('city', cityFilter);
      if (categoryFilter) params.append('categoryId', categoryFilter);
      if (brandFilter) params.append('brandId', brandFilter);

      const [locRes, catRes, brdRes, catsList, brdsList]: any = await Promise.all([
        adminApi.get(`/reports/location?${params.toString()}`),
        adminApi.get('/reports/category'),
        adminApi.get('/reports/brand'),
        adminApi.get('/categories'),
        adminApi.get('/brands'),
      ]);

      setLocationReport(locRes.data || locRes || []);
      setCategoryReport(catRes.data || catRes || []);
      setBrandReport(brdRes.data || brdRes || []);
      setCategories(catsList.data || catsList || []);
      setBrands(brdsList.data || brdsList || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [stateFilter, cityFilter, categoryFilter, brandFilter]);

  const handleResetFilters = () => {
    setStateFilter('');
    setCityFilter('');
    setCategoryFilter('');
    setBrandFilter('');
  };

  const hasActiveFilters = Boolean(stateFilter || cityFilter || categoryFilter || brandFilter);

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (stateFilter) params.append('state', stateFilter);
    if (cityFilter) params.append('city', cityFilter);
    if (categoryFilter) params.append('categoryId', categoryFilter);
    if (brandFilter) params.append('brandId', brandFilter);

    const token = localStorage.getItem('ayngaran_admin_token');
    const downloadUrl = `http://localhost:4000/api/v1/reports/export-location-csv?${params.toString()}`;

    // Use authorized fetch then trigger download
    fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ayngaran_location_report_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert('Failed to export CSV: ' + err.message));
  };

  const totalLocationOrders = locationReport.reduce((sum, r) => sum + (r.orderCount || 0), 0);
  const totalLocationRevenue = locationReport.reduce((sum, r) => sum + (Number(r.revenue) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Sales & Location Reports</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>
            Analyze where your orders come from, best selling categories and brands, and export reports to CSV.
          </p>
        </div>

        <button onClick={handleExportCsv} className="btn-primary" style={{ fontSize: '0.88rem' }}>
          <Download size={16} />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Aggregate KPI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Filtered Order Volume</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {totalLocationOrders} Orders
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>Across filtered delivery locations</p>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Filtered Revenue</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', marginTop: '0.25rem' }}>
            ₹{totalLocationRevenue.toLocaleString('en-IN')}
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>Total sales from matching orders</p>
        </div>
      </div>

      {/* Filter Controls Toolbar */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Filter Reports by Geography or Catalog</span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              <RotateCcw size={13} /> Reset Filters
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '0.35rem' }}>State</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Tamil Nadu, Karnataka"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '0.35rem' }}>City</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Chennai, Bangalore"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: '0.35rem' }}>Brand</label>
            <select
              className="form-select"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Location Breakdown Table */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} style={{ color: '#d97706' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Sales by Location</h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{locationReport.length} Delivery Zones</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>State</th>
                <th>City</th>
                <th>Completed Orders</th>
                <th>Total Revenue</th>
                <th>Avg Order Value</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    Loading location sales data...
                  </td>
                </tr>
              ) : locationReport.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                    <div>No orders found matching location filters.</div>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="btn-secondary"
                        style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                locationReport.map((row, idx) => {
                  const avg = row.orderCount > 0 ? row.revenue / row.orderCount : 0;
                  return (
                    <tr key={idx}>
                      <td>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{row.state}</span>
                      </td>
                      <td>
                        <span style={{ color: '#334155' }}>{row.city}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.orderCount}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#b45309' }}>
                          ₹{Number(row.revenue).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          ₹{Math.round(avg).toLocaleString('en-IN')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Category & Brand Sales Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Category Performance */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Sales by Category
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {categoryReport.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>
                No category sales recorded yet.
              </div>
            ) : (
              categoryReport.map((cat, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>{cat.name}</span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{cat.itemsSold ?? cat.unitsSold ?? 0} units sold</div>
                  </div>
                  <span style={{ fontWeight: 700, color: '#b45309', fontSize: '0.88rem' }}>
                    ₹{Number(cat.totalRevenue ?? cat.revenue ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Brand Performance */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem' }}>
            Sales by Brand
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {brandReport.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: '#64748b', textAlign: 'center', padding: '1.5rem' }}>
                No brand sales recorded yet.
              </div>
            ) : (
              brandReport.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' }}>{b.name}</span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.itemsSold ?? b.unitsSold ?? 0} units sold</div>
                  </div>
                  <span style={{ fontWeight: 700, color: '#b45309', fontSize: '0.88rem' }}>
                    ₹{Number(b.totalRevenue ?? b.revenue ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

