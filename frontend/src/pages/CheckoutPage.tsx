import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Banknote,
  Truck,
  ArrowRight,
  MapPin,
  Lock,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { UserAddress } from '../types';

export const CheckoutPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // New Address form
  const [newAddress, setNewAddress] = useState({
    recipientName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641004',
  });

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'MOCK' | 'RAZORPAY'>('MOCK');
  const [gateways, setGateways] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment Simulator Modal
  const [paymentModalData, setPaymentModalData] = useState<any | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/auth/customer/profile').then((res: any) => {
        setAddresses(res.addresses || []);
        if (res.addresses && res.addresses.length > 0) {
          const defaultAddr = res.addresses.find((a: any) => a.isDefault) || res.addresses[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setIsAddingNewAddress(true);
        }
      });

      api.get('/payments/gateways').then((res: any) => {
        setGateways(res || []);
      });
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Please log in to proceed to Checkout</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Your shopping cart will be ready for you</p>
        <Link to="/catalog" className="btn-primary">Return to Catalog</Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Add some products to your cart before checking out.</p>
        <Link to="/catalog" className="btn-primary">Browse Catalog</Link>
      </div>
    );
  }

  const subtotal = cart.subtotal;
  const shippingFee = subtotal >= 1000 ? 0 : 99;
  const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
  const totalAmount = subtotal + shippingFee + taxAmount;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const payload: any = {
        paymentMethod,
      };

      if (isAddingNewAddress) {
        payload.newAddress = newAddress;
      } else {
        payload.addressId = selectedAddressId;
      }

      // Authoritative Checkout request
      const res: any = await api.post('/checkout', payload);

      if (res.paymentRequired) {
        // Online Payment Flow: Open payment modal
        setPaymentModalData({
          orderId: res.orderId,
          orderNumber: res.orderNumber,
          amount: res.totalAmount,
          method: paymentMethod,
        });
      } else {
        // COD Instant Confirmation Flow
        await refreshCart();
        navigate(`/orders?success=${res.orderNumber}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Authoritative server-side payment verification simulation
  const handleSimulatePaymentSuccess = async () => {
    if (!paymentModalData) return;

    try {
      setIsVerifyingPayment(true);
      const mockTxId = `pay_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      // Authoritative backend verification
      await api.post('/payments/verify', {
        orderId: paymentModalData.orderId,
        gatewayCode: paymentModalData.method,
        transactionId: mockTxId,
        paymentSignature: `test_sig_${mockTxId}`,
      });

      await refreshCart();
      navigate(`/orders?success=${paymentModalData.orderNumber}`);
    } catch (err: any) {
      setErrorMessage(err.message);
      setPaymentModalData(null);
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 6rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Secure Checkout</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Server-side price & stock verification guaranteed
        </p>
      </div>

      {errorMessage && (
        <div className="badge-danger" style={{ padding: '0.85rem 1.25rem', borderRadius: '0.65rem', marginBottom: '1.5rem', width: '100%', fontSize: '0.9rem' }}>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '3rem', alignItems: 'start' }} className="checkout-layout">
        {/* Left Column: Delivery Address & Payment Method */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* 1. Address Section */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} color="var(--primary-600)" />
                <h3 style={{ fontSize: '1.15rem' }}>1. Delivery Address</h3>
              </div>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                  style={{ color: 'var(--primary-600)', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  {isAddingNewAddress ? 'Select Saved Address' : '+ Add New Address'}
                </button>
              )}
            </div>

            {!isAddingNewAddress && addresses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '1rem',
                      borderRadius: '0.65rem',
                      border: `2px solid ${selectedAddressId === addr.id ? 'var(--primary-600)' : 'var(--border-color)'}`,
                      backgroundColor: selectedAddressId === addr.id ? 'var(--primary-50)' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      style={{ accentColor: 'var(--primary-600)', marginTop: '0.2rem' }}
                    />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{addr.recipientName}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{addr.phone}</span>
                      <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Recipient Name</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={newAddress.recipientName}
                    onChange={(e) => setNewAddress({ ...newAddress, recipientName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Contact Phone</label>
                  <input
                    type="tel"
                    className="input-field"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Address Line</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>City</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>State</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Pincode</label>
                  <input
                    type="text"
                    className="input-field"
                    required
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Payment Method Section */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <CreditCard size={20} color="var(--primary-600)" />
              <h3 style={{ fontSize: '1.15rem' }}>2. Payment Method</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Instant Sandbox Gateway */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${paymentMethod === 'MOCK' ? 'var(--primary-600)' : 'var(--border-color)'}`,
                  backgroundColor: paymentMethod === 'MOCK' ? 'var(--primary-50)' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'MOCK'}
                    onChange={() => setPaymentMethod('MOCK')}
                    style={{ accentColor: 'var(--primary-600)', width: '16px', height: '16px' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Instant Mock Sandbox Gateway</span>
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Recommended for Testing</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Simulate instant card/UPI payment with authoritative backend verification
                    </span>
                  </div>
                </div>
                <CreditCard size={22} color="var(--primary-600)" />
              </label>

              {/* Cash on Delivery */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${paymentMethod === 'COD' ? 'var(--primary-600)' : 'var(--border-color)'}`,
                  backgroundColor: paymentMethod === 'COD' ? 'var(--primary-50)' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    style={{ accentColor: 'var(--primary-600)', width: '16px', height: '16px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cash on Delivery (COD)</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                      Pay with cash or UPI at your doorstep upon order delivery
                    </span>
                  </div>
                </div>
                <Banknote size={22} color="var(--success)" />
              </label>

              {/* Razorpay Test Mode */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.1rem',
                  borderRadius: '0.75rem',
                  border: `2px solid ${paymentMethod === 'RAZORPAY' ? 'var(--primary-600)' : 'var(--border-color)'}`,
                  backgroundColor: paymentMethod === 'RAZORPAY' ? 'var(--primary-50)' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    style={{ accentColor: 'var(--primary-600)', width: '16px', height: '16px' }}
                  />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Razorpay Payment Gateway</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                      Encrypted gateway integration with server-side HMAC verification
                    </span>
                  </div>
                </div>
                <Lock size={20} color="var(--text-muted)" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Items & Authoritative Price Summary */}
        <div>
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              border: '1px solid var(--border-color)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              Order Summary ({cart.totalItems} Items)
            </h3>

            {/* Items Mini List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {cart.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <span style={{ fontWeight: 600 }}>{item.productName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Qty: {item.quantity} {item.variantDescription ? `• ${item.variantDescription}` : ''}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700 }}>₹{item.totalPrice.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Items Subtotal</span>
                <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Express Delivery</span>
                <span style={{ fontWeight: 600, color: shippingFee === 0 ? 'var(--success)' : 'inherit' }}>
                  {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>GST (18% included)</span>
                <span style={{ fontWeight: 600 }}>₹{taxAmount.toLocaleString()}</span>
              </div>

              <div
                style={{
                  borderTop: '2px dashed var(--border-color)',
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>Total Payable</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !cart.allItemsAvailable}
              className="btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.9rem', fontSize: '1.05rem' }}
            >
              <span>{isProcessing ? 'Verifying Stock & Prices...' : paymentMethod === 'COD' ? 'Confirm Order (COD)' : 'Proceed to Payment'}</span>
              <ArrowRight size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <ShieldCheck size={14} color="var(--success)" />
              <span>Authoritative SSL & encrypted backend verification</span>
            </div>
          </div>
        </div>
      </form>

      {/* Interactive Payment Gateway Simulator Modal */}
      {paymentModalData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1rem',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '440px',
              borderRadius: '1.25rem',
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '9999px',
                background: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <CreditCard size={30} />
            </div>

            <h3 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>Payment Gateway Simulator</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Simulating encrypted gateway session for order <strong>#{paymentModalData.orderNumber}</strong>
            </p>

            <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Gateway</span>
                <strong>{paymentModalData.method}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                <strong>₹{paymentModalData.amount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span className="badge badge-warning">Awaiting Authorization</span>
              </div>
            </div>

            <button
              onClick={handleSimulatePaymentSuccess}
              disabled={isVerifyingPayment}
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginBottom: '0.75rem' }}
            >
              <CheckCircle2 size={18} />
              <span>{isVerifyingPayment ? 'Authorizing & Deducting Stock...' : 'Approve & Verify Payment'}</span>
            </button>

            <button
              onClick={() => setPaymentModalData(null)}
              disabled={isVerifyingPayment}
              style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem' }}
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 850px) {
          .checkout-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
