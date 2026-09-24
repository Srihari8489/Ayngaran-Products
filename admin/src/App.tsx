import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AttributesPage } from './pages/AttributesPage';
import { BrandsPage } from './pages/BrandsPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { OrdersPage } from './pages/OrdersPage';
import { DeliveryPartnersPage } from './pages/DeliveryPartnersPage';
import { GatewaysPage } from './pages/GatewaysPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { FeedbacksPage } from './pages/FeedbacksPage';
import { ReportsPage } from './pages/ReportsPage';
import { StaffPage } from './pages/StaffPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { InquiriesPage } from './pages/InquiriesPage';
import { SubscribersPage } from './pages/SubscribersPage';
import { UsersPage } from './pages/UsersPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16', color: '#fff' }}>
        Authenticating staff credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Administrative Operations Suite */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="attributes" element={<AttributesPage />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="inquiries" element={<InquiriesPage />} />
            <Route path="feedbacks" element={<FeedbacksPage />} />
            <Route path="subscribers" element={<SubscribersPage />} />
            <Route path="delivery-partners" element={<DeliveryPartnersPage />} />
            <Route path="gateways" element={<GatewaysPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
};

export default App;
