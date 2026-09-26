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
  Plus,
  Edit,
  Check,
  Tag,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { UserAddress } from '../types';
import { resolveGstStateCode, SELLER_STATE_CODE, INDIAN_STATES } from '../utils/gst.util';
import { getVariantDisplay } from '../components/CartDrawer';

export const CheckoutPage: React.FC = () => {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);

  // Dynamic Shipping Calculation State
  const [shippingData, setShippingData] = useState<{
    shippingZone: string;
    destinationState: string;
    destinationStateCode: string;
    totalWeightGrams: number;
    billableWeightGrams: number;
    billableUnits: number;
    ratePerUnit: number;
    shippingAmount: number;
    estimatedDelivery: string;
    baseWeightGrams: number;
  } | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // Profile Completion Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name && user.name !== 'Customer' ? user.name : '',
    email: user?.email || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Sync profileData when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name && user.name !== 'Customer' ? user.name : '',
        email: user.email || '',
      });
    }
  }, [user]);

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

  // Address Modal (Add / Edit) state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    recipientName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641004',
    country: 'India',
    isDefault: false,
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressSuccessMsg, setAddressSuccessMsg] = useState('');

  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      recipientName: user?.name && user.name !== 'Customer' ? user.name : '',
      phone: user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004',
      country: 'India',
      isDefault: addresses.length === 0,
    });
    setAddressError('');
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      recipientName: addr.recipientName || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || 'Coimbatore',
      state: addr.state || 'Tamil Nadu',
      pincode: addr.pincode || '641004',
      country: addr.country || 'India',
      isDefault: addr.isDefault || false,
    });
    setAddressError('');
    setIsAddressModalOpen(true);
  };

  const fetchAddresses = async () => {
    try {
      const res: any = await api.get('/auth/customer/addresses');
      const addrs = Array.isArray(res) ? res : (res.addresses || []);
      setAddresses(addrs);
      return addrs;
    } catch {
      try {
        const profile: any = await api.get('/auth/customer/profile');
        const addrs = profile.addresses || [];
        setAddresses(addrs);
        return addrs;
      } catch {
        return [];
      }
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');
    setIsSavingAddress(true);

    try {
      if (editingAddressId) {
        await api.patch(`/auth/customer/addresses/${editingAddressId}`, addressForm);
        setAddressSuccessMsg('Address updated successfully!');
      } else {
        const created: any = await api.post('/auth/customer/addresses', addressForm);
        setAddressSuccessMsg('New delivery address saved to your account!');
        if (created?.id) {
          setSelectedAddressId(created.id);
        }
      }

      const updatedList = await fetchAddresses();
      if (!editingAddressId && updatedList.length > 0) {
        const lastAdded = updatedList[updatedList.length - 1];
        if (lastAdded) setSelectedAddressId(lastAdded.id);
      }
      setIsAddingNewAddress(false);
      setIsAddressModalOpen(false);
      setTimeout(() => setAddressSuccessMsg(''), 4000);
    } catch (err: any) {
      setAddressError(err.message || 'Failed to save address.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses().then((addrs) => {
        if (addrs && addrs.length > 0) {
          const defaultAddr = addrs.find((a: any) => a.isDefault) || addrs[0];
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

  // Determine delivery destination state code for GST bifurcation & shipping zone (must be before early returns)
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || (isAddingNewAddress ? newAddress : null);
  const destinationState = selectedAddress?.state?.trim() || 'Tamil Nadu';
  const customerStateCode = resolveGstStateCode(destinationState);
  const supplyType = customerStateCode === SELLER_STATE_CODE ? 'INTRA_STATE' : 'INTER_STATE';
  const isIntraState = supplyType === 'INTRA_STATE';

  // Fetch Authoritative Backend Shipping Calculation (Hook must be called unconditionally before any early returns)
  useEffect(() => {
    let isMounted = true;
    const fetchShipping = async () => {
      if (!isAuthenticated || !cart || !cart.items || cart.items.length === 0) return;
      setIsCalculatingShipping(true);
      try {
        const res: any = await api.post('/checkout/shipping/calculate', {
          destinationState,
          items: cart.items.map((it) => ({
            variantId: it.variantId,
            productId: it.productId,
            quantity: it.quantity,
          })),
        });
        const data = res?.data || res;
        if (isMounted && data && data.shippingAmount !== undefined) {
          setShippingData(data);
        }
      } catch (err) {
        console.error('Failed to calculate shipping:', err);
      } finally {
        if (isMounted) setIsCalculatingShipping(false);
      }
    };

    fetchShipping();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, destinationState, cart?.items]);

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

  // Shipping charge from authoritative backend response (or fallback based on zone and item quantities)
  const fallbackUnits = (cart.items || []).reduce((acc, it) => acc + Math.max(1, it.quantity || 1), 0);
  const shippingFee = shippingData
    ? Number(shippingData.shippingAmount)
    : (isIntraState ? 60 : 120) * Math.max(1, fallbackUnits);

  // Reverse GST calculation: Selling prices in store are inclusive of GST
  // Taxable Value = itemTotal / (1 + rate / 100)
  const taxableSubtotal = Math.round(
    cart.items.reduce((sum, item) => {
      const rate = item.gstRate ?? 5;
      return sum + (item.totalPrice / (1 + rate / 100));
    }, 0) * 100
  ) / 100;

  const taxAmount = Math.round((subtotal - taxableSubtotal) * 100) / 100;

  const cgstAmount = isIntraState ? Math.round((taxAmount / 2) * 100) / 100 : 0;
  const sgstAmount = isIntraState ? Math.round((taxAmount - cgstAmount) * 100) / 100 : 0;
  const igstAmount = !isIntraState ? taxAmount : 0;

  // Total payable: items subtotal already includes GST
  const rawTotal = subtotal + shippingFee;
  const roundTotal = Math.round(rawTotal);
  const roundOff = Math.round((roundTotal - rawTotal) * 100) / 100;

  const handleSaveProfileAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.name.trim() || profileData.name.trim() === 'Customer') {
      setProfileError('Please enter your full name to complete your profile.');
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileError('');
      await api.put('/auth/customer/profile', {
        name: profileData.name.trim(),
        email: profileData.email.trim(),
      });
      await refreshProfile();
      setIsProfileModalOpen(false);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile details.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Check if profile details are completed before placing order
    const isProfileComplete = user?.name && user.name.trim() !== '' && user.name.trim() !== 'Customer';
    if (!isProfileComplete) {
      setIsProfileModalOpen(true);
      return;
    }

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
    <div className="container" style={{ padding: '2.5rem' }}>

      {errorMessage && (
        <div className="badge-danger" style={{ padding: '0.85rem 1.25rem', borderRadius: '0.65rem', marginBottom: '1.5rem', width: '100%', fontSize: '0.9rem' }}>
          {errorMessage}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '3rem', alignItems: 'start' }} className="checkout-layout">
        {/* Left Column: Delivery Address & Payment Method */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* 1. Address Section */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '2px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.4rem 0.6rem', background: '#f0fdf4', borderRadius: '0.5rem', color: '#1a3d2b', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={22} color="#1a3d2b" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a3d2b', margin: 0 }}>1. Delivery Address Selection</h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>Choose or manage your delivery destination</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openAddAddressModal()}
                className="btn-primary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', fontWeight: 800, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={15} /> Add New Address
              </button>
            </div>

            {addressSuccessMsg && (
              <div style={{ padding: '0.75rem 1rem', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: '0.625rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                ✓ {addressSuccessMsg}
              </div>
            )}

            {/* Address Selection Grid */}
            {addresses.length === 0 ? (
              <div style={{ padding: '2rem 1.5rem', borderRadius: '0.875rem', background: '#fafaf9', border: '2px dashed #cbd5e1', textAlign: 'center' }}>
                <MapPin size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ fontWeight: 800, color: '#334155', marginBottom: '0.35rem' }}>No Saved Delivery Addresses Found</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>Please add a delivery address to complete your order.</p>
                <button
                  type="button"
                  onClick={() => openAddAddressModal()}
                  className="btn-primary"
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  ➕ Add New Delivery Address
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Scrollable Address List Container */}
                <div
                  style={{
                    maxHeight: '265px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    paddingRight: addresses.length > 2 ? '0.35rem' : '0',
                    paddingBottom: '2px',
                  }}
                >
                  {addresses.map((a) => {
                    const isSelected = selectedAddressId === a.id;
                    return (
                      <div
                        key={a.id}
                        onClick={() => {
                          setSelectedAddressId(a.id);
                          setIsAddingNewAddress(false);
                        }}
                        style={{
                          position: 'relative',
                          padding: '1rem 1.25rem',
                          borderRadius: '0.75rem',
                          border: isSelected ? '2px solid #113926' : '1.5px solid #e2e8f0',
                          backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                          boxShadow: isSelected ? '0 4px 14px rgba(17, 57, 38, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          flexShrink: 0,
                        }}
                      >
                        {/* Left Radio indicator */}
                        <div style={{ paddingTop: '0.2rem' }}>
                          <div
                            style={{
                              width: '1.25rem',
                              height: '1.25rem',
                              borderRadius: '50%',
                              border: isSelected ? '5px solid #113926' : '2px solid #cbd5e1',
                              background: '#ffffff',
                              boxSizing: 'border-box',
                              flexShrink: 0,
                              transition: 'all 0.2s ease',
                            }}
                          />
                        </div>

                        {/* Middle Address Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: isSelected ? '#113926' : '#0f172a' }}>
                              {a.recipientName}
                            </span>
                            {a.isDefault && (
                              <span style={{ background: '#113926', color: '#86efac', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                Default
                              </span>
                            )}
                            {isSelected && (
                              <span style={{ background: '#16a34a', color: '#ffffff', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px' }}>
                                Selected
                              </span>
                            )}
                          </div>

                          {/* Full address line */}
                          <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.45, margin: '0 0 0.35rem 0' }}>
                            {a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}, {a.city}, {a.state} - <strong style={{ color: '#0f172a' }}>{a.pincode}</strong>
                          </p>

                          {/* Phone number */}
                          <p style={{ fontSize: '0.82rem', color: '#113926', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>📞</span> {a.phone}
                          </p>
                        </div>

                        {/* Right Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, alignSelf: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditAddressModal(a);
                            }}
                            style={{
                              background: '#ffffff',
                              border: '1.5px solid #cbd5e1',
                              color: '#113926',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#113926';
                              e.currentTarget.style.background = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.background = '#ffffff';
                            }}
                          >
                            <Edit size={14} /> Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Address List Row option */}
                <button
                  type="button"
                  onClick={() => openAddAddressModal()}
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: '2px dashed #cbd5e1',
                    backgroundColor: '#fafaf9',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    transition: 'all 0.2s ease',
                    marginTop: '0.25rem',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#113926';
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.backgroundColor = '#fafaf9';
                  }}
                >
                  <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#113926' }}>
                    <Plus size={15} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#113926' }}>
                    + Add New Delivery Address
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    (Deliver to another location)
                  </span>
                </button>
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
              {cart.items.map((item) => {
                const variantLabel = getVariantDisplay(item);
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{item.productName}</span>
                        {variantLabel && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '1px 7px',
                              background: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              borderRadius: '4px',
                              fontSize: '0.70rem',
                              fontWeight: 600,
                            }}
                          >
                            <Tag size={10} />
                            {variantLabel}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                        Qty: {item.quantity} {variantLabel ? `• Variant: ${variantLabel}` : ''} {item.gstRate !== undefined ? `• GST ${item.gstRate}%` : ''}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700 }}>₹{item.totalPrice.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            {/* Calculations Breakdown */}
            <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', fontSize: '0.88rem' }}>
                <span style={{ color: '#475569' }}>Products Subtotal</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Tax Details Table (Clear Breakdown for Normal Customers) */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.625rem',
                  border: '1px solid #e2e8f0',
                  padding: '0.75rem 0.85rem',
                  margin: '0.65rem 0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.45rem',
                    borderBottom: '1px dashed #cbd5e1',
                    paddingBottom: '0.35rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1a3d2b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Tax Breakdown (Included in Price)
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      backgroundColor: isIntraState ? '#dcfce7' : '#e0e7ff',
                      color: isIntraState ? '#166534' : '#4338ca',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      border: isIntraState ? '1px solid #bbf7d0' : '1px solid #c7d2fe',
                    }}
                  >
                    {isIntraState ? 'Intra-State (TN → TN)' : `Inter-State (TN → ${destinationState})`}
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 0', color: '#64748b' }}>Price Before Tax:</td>
                      <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                        ₹{taxableSubtotal.toFixed(2)}
                      </td>
                    </tr>
                    {isIntraState ? (
                      <>
                        <tr>
                          <td style={{ padding: '3px 0', color: '#64748b' }}>Central Govt Tax (CGST):</td>
                          <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, color: '#0369a1' }}>
                            ₹{cgstAmount.toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '3px 0', color: '#64748b' }}>State Govt Tax (SGST):</td>
                          <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, color: '#0369a1' }}>
                            ₹{sgstAmount.toFixed(2)}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td style={{ padding: '3px 0', color: '#64748b' }}>Integrated Interstate Tax (IGST):</td>
                        <td style={{ padding: '3px 0', textAlign: 'right', fontWeight: 600, color: '#0369a1' }}>
                          ₹{igstAmount.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '1px dashed #cbd5e1' }}>
                      <td style={{ padding: '5px 0 0', fontWeight: 700, color: '#166534', fontSize: '0.8rem' }}>
                        Total Tax (Already Included):
                      </td>
                      <td style={{ padding: '5px 0 0', textAlign: 'right', fontWeight: 800, color: '#166534', fontSize: '0.82rem' }}>
                        ₹{taxAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '5px', lineHeight: 1.35 }}>
                  * No extra tax added at checkout. All product prices are already inclusive of GST.
                </div>
              </div>

              {/* Delivery Charges (Positioned before Round Off) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '0.65rem 0',
                  borderTop: '1px solid #f1f5f9',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '0.88rem',
                  marginBottom: '0.4rem',
                }}
              >
                <div style={{ color: '#475569', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={15} color="#059669" />
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Delivery Charges</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-block',
                        width: 'fit-content',
                        padding: '1px 7px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: (shippingData?.shippingZone === 'TAMIL_NADU' || isIntraState) ? '#dcfce7' : '#e0f2fe',
                        color: (shippingData?.shippingZone === 'TAMIL_NADU' || isIntraState) ? '#15803d' : '#0369a1',
                        border: (shippingData?.shippingZone === 'TAMIL_NADU' || isIntraState) ? '1px solid #bbf7d0' : '1px solid #bae6fd',
                      }}>
                        {(shippingData?.shippingZone === 'TAMIL_NADU' || isIntraState) ? 'Tamil Nadu (Intrastate Zone)' : 'Outside Tamil Nadu (Interstate Zone)'}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                        ₹{shippingData?.ratePerUnit || (isIntraState ? 60 : 120)} / 1 KG
                      </span>
                    </div>
                    {shippingData && (
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        Weight: {((shippingData.totalWeightGrams ?? 0) / 1000).toFixed(2)} KG ({shippingData.totalWeightGrams ?? 0}g) → {shippingData.billableUnits || 1} slab{(shippingData.billableUnits || 1) > 1 ? 's' : ''} ({shippingData.billableUnits || 1} × ₹{shippingData.ratePerUnit || (isIntraState ? 60 : 120)})
                      </span>
                    )}
                    <span style={{ color: '#059669', fontWeight: 700 }}>
                      Est. Delivery: {shippingData?.estimatedDelivery || (isIntraState ? 'Within 2 days' : '3-5 days')}
                    </span>
                  </div>
                </div>
                <div style={{ padding: '0 0 0 0.5rem', textAlign: 'right', fontWeight: 900, color: '#1a3d2b', fontSize: '1.05rem', verticalAlign: 'top', flexShrink: 0 }}>
                  {isCalculatingShipping ? 'Calculating...' : `₹${shippingFee.toFixed(2)}`}
                </div>
              </div>

              {/* Round Off Line Item */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.35rem 0',
                  fontSize: '0.85rem',
                  color: '#475569',
                }}
              >
                <span>Round Off</span>
                <span style={{ fontWeight: 600 }}>
                  {roundOff >= 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}
                </span>
              </div>

              {/* Total Payable Box */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingTop: '0.75rem',
                  borderTop: '2px solid #cbd5e1',
                  marginTop: '0.35rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', display: 'block' }}>Total Amount to Pay</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Includes all items, taxes & delivery</span>
                </div>
                <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1a3d2b' }}>
                  ₹{roundTotal.toLocaleString('en-IN')}
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

      {/* ── Complete Profile Required Modal ── */}
      {isProfileModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 25, 15, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '1rem',
          }}
        >
          <div
            className="glass-panel animate-fadeIn"
            style={{
              width: '100%',
              maxWidth: '460px',
              borderRadius: '1.25rem',
              padding: '2.25rem 2rem',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
              border: '2px solid #8b7d2a',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#fefce8',
                border: '2px solid #d4c56a',
                color: '#8b7d2a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <ShieldCheck size={34} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1a3d2b', marginBottom: '0.4rem', fontFamily: 'Outfit', textAlign: 'center' }}>
              Complete Your Profile Details
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5, textAlign: 'center' }}>
              Authentication is verified via your phone number (<strong>{user?.phone}</strong>). Please complete your Full Name &amp; Email address before placing an order.
            </p>

            {profileError && (
              <div style={{ padding: '0.75rem', borderRadius: '0.625rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#e11d48', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {profileError}
              </div>
            )}

            <form onSubmit={handleSaveProfileAndContinue} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hari Prasad"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '0.92rem', padding: '0.7rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Email Address (for invoice &amp; tracking updates)
                </label>
                <input
                  type="email"
                  placeholder="e.g. customer@example.com"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="input-field"
                  style={{ fontSize: '0.92rem', padding: '0.7rem' }}
                />
              </div>

              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 800 }}
                >
                  <CheckCircle2 size={18} />
                  <span>{isSavingProfile ? 'Saving Details...' : 'Save & Proceed to Order'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', padding: '0.4rem', cursor: 'pointer', textAlign: 'center' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add / Edit Address Modal ── */}
      {isAddressModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 25, 15, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 130,
            padding: '1rem',
          }}
        >
          <div
            className="glass-panel animate-fadeIn"
            style={{
              width: '100%',
              maxWidth: '540px',
              borderRadius: '1.25rem',
              padding: '2rem',
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
              border: '2px solid #2d6a4f',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <MapPin size={22} color="#1a3d2b" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a3d2b', margin: 0, fontFamily: 'Outfit' }}>
                  {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            {addressError && (
              <div style={{ padding: '0.75rem', borderRadius: '0.625rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#e11d48', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {addressError}
              </div>
            )}

            <form onSubmit={handleSaveAddress} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hari Prasad"
                  value={addressForm.recipientName}
                  onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Address Line 1 (House No, Building, Street) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12, Main Street, Gandhipuram"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Address Line 2 / Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Bus Stand"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coimbatore"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  State / Union Territory *
                </label>
                <select
                  required
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="input-field"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    fontWeight: 600,
                    color: '#0f172a',
                  }}
                >
                  <option value="" disabled>-- Select Delivery State --</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st.code} value={st.name}>
                      {st.name} ({st.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Pincode *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 641004"
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Country
                </label>
                <input
                  type="text"
                  disabled
                  value={addressForm.country}
                  className="input-field"
                  style={{ backgroundColor: '#f1f5f9' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '0.7rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="btn-primary"
                  style={{ padding: '0.7rem 1.5rem', fontWeight: 800 }}
                >
                  {isSavingAddress ? 'Saving...' : (editingAddressId ? 'Update Address' : 'Save & Select Address')}
                </button>
              </div>
            </form>
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
