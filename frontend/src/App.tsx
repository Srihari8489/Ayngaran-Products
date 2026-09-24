import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OtpLoginModal } from './components/OtpLoginModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { WishlistPage } from './pages/WishlistPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { AccountLayout } from './pages/account/AccountLayout';
import { ProfilePage } from './pages/account/ProfilePage';
import { AddressesPage } from './pages/account/AddressesPage';
import { OrdersPage as AccountOrdersPage } from './pages/account/OrdersPage';

import { ScrollToTop } from './components/ScrollToTop';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-amber-500 selection:text-black">
              {/* Top Navigation */}
              <Header />

              {/* Main Application Routes */}
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/product/:slug" element={<ProductDetailPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/feedback" element={<FeedbackPage />} />

                  {/* Policies and Help Support Routes */}
                  <Route path="/policies" element={<PoliciesPage />} />
                  <Route path="/shipping-policy" element={<PoliciesPage />} />
                  <Route path="/return-policy" element={<PoliciesPage />} />
                  <Route path="/privacy-policy" element={<PoliciesPage />} />
                  <Route path="/terms-of-service" element={<PoliciesPage />} />
                  <Route path="/track-order" element={<PoliciesPage />} />
                  <Route path="/faq" element={<PoliciesPage />} />

                  {/* Legacy redirect */}
                  <Route path="/orders" element={<Navigate to="/account/orders" replace />} />

                  {/* Customer Account Section */}
                  <Route path="/account" element={<AccountLayout />}>
                    <Route index element={<Navigate to="/account/profile" replace />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="addresses" element={<AddressesPage />} />
                    <Route path="orders" element={<AccountOrdersPage />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Global Overlays & Drawers */}
              <OtpLoginModal />
              <CartDrawer />
              <WishlistDrawer />

              {/* Footer */}
              <Footer />
            </div>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;

