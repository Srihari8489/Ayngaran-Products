import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle, ChevronDown, ChevronUp, Tag, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { CartItem } from '../types';

export const getVariantDisplay = (item: CartItem): string | null => {
  if (item.variantDescription && item.variantDescription.trim()) {
    return item.variantDescription.trim();
  }
  if (item.variantWeight !== undefined && item.variantWeight !== null) {
    const num = Number(item.variantWeight);
    if (!isNaN(num) && num > 0) {
      if (num < 10) {
        return num < 1 ? `${Math.round(num * 1000)}g` : `${Number(num.toFixed(2))} KG`;
      }
      return num >= 1000 ? `${Number((num / 1000).toFixed(2))} KG` : `${Math.round(num)}g`;
    }
  }
  if (item.sku) {
    const match = item.sku.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|g|gm|gram)\b/i);
    if (match) {
      return `${match[1]}${match[2].toLowerCase().startsWith('k') ? ' KG' : 'g'}`;
    }
  }
  return null;
};

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, closeCart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const [isTaxBreakdownOpen, setIsTaxBreakdownOpen] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999990,
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'drawerFadeIn 0.2s ease-out forwards',
        }}
        onClick={closeCart}
      />

      {/* Slide-out Drawer Panel strictly anchored to the right */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 35px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          animation: 'drawerSlideFromRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShoppingBag size={22} color="var(--primary-600)" />
            <h3 style={{ fontSize: '1.15rem' }}>Your Cart ({cart?.totalItems || 0})</h3>
          </div>
          <button
            onClick={closeCart}
            style={{ padding: '0.4rem', color: 'var(--text-muted)', borderRadius: '9999px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Meter */}
        {/* <div style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
          {(cart?.subtotal || 0) >= 1000 ? (
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>🎉 You qualify for FREE Delivery!</span>
          ) : (
            <span>Add <strong>₹{1000 - (cart?.subtotal || 0)}</strong> more to get <strong>FREE Express Delivery</strong>!</span>
          )}
        </div> */}

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {!cart || cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Your cart is empty</h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>Explore our catalog and find the best electronics</p>
              <button
                onClick={() => { closeCart(); navigate('/catalog'); }}
                className="btn-primary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    padding: '0.9rem',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                  }}
                >
                  {/* Thumbnail */}
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200'}
                    alt={item.productName}
                    style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '0.5rem' }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{item.brandName}</span>
                        <h4 style={{ fontSize: '0.9rem', lineHeight: 1.3 }}>{item.productName}</h4>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{ color: 'var(--text-muted)', padding: '0.2rem' }}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {(() => {
                      const variantLabel = getVariantDisplay(item);
                      if (!variantLabel) return null;
                      return (
                        <div style={{ margin: '0.3rem 0' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              background: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                          >
                            <Tag size={11} />
                            Variant: {variantLabel}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Stock Warning if any */}
                    {item.stockWarning && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--warning)', fontSize: '0.75rem', margin: '0.25rem 0' }}>
                        <AlertTriangle size={13} />
                        <span>{item.stockWarning}</span>
                      </div>
                    )}

                    {/* Item Price Calculation Row (Single Price x Qty = Total) */}
                    <div style={{ marginTop: '0.65rem', paddingTop: '0.55rem', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Quantity Controls */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          background: '#ffffff',
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          style={{ padding: '0.3rem 0.55rem', background: '#f8fafc', borderRight: '1px solid #e2e8f0', cursor: 'pointer' }}
                          title="Decrease quantity"
                        >
                          <Minus size={12} color="#334155" />
                        </button>
                        <span style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem', fontWeight: 800, color: '#1a3d2b' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ padding: '0.3rem 0.55rem', background: '#f8fafc', borderLeft: '1px solid #e2e8f0', cursor: 'pointer' }}
                          title="Increase quantity"
                        >
                          <Plus size={12} color="#334155" />
                        </button>
                      </div>

                      {/* Formula & Total Calculation */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                          ₹{item.unitPrice.toLocaleString()} × {item.quantity}
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1a3d2b' }}>
                          = ₹{item.totalPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart && cart.items.length > 0 && (
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: '#f8fafc',
            }}
          >
            {(() => {
              const subtotal = Number(cart.subtotal || 0);
              const shippingCharge = cart.shipping?.shippingAmount ?? 0;
              const hasShipping = cart.shipping !== undefined && cart.shipping !== null;
              const finalTotal = Math.round(subtotal + shippingCharge);
              const roundOff = Math.round((finalTotal - (subtotal + shippingCharge)) * 100) / 100;

              const taxAmount = Number(cart.taxAmount || 0);
              const taxableAmount = cart.taxableAmount !== undefined ? Number(cart.taxableAmount) : Math.max(0, subtotal - taxAmount);
              const isIntra = cart.supplyType === 'INTRA_STATE' || !cart.supplyType;
              const cgstAmount = isIntra ? (cart.cgstAmount !== undefined ? Number(cart.cgstAmount) : Math.round((taxAmount / 2) * 100) / 100) : 0;
              const sgstAmount = isIntra ? (cart.sgstAmount !== undefined ? Number(cart.sgstAmount) : Math.round((taxAmount - cgstAmount) * 100) / 100) : 0;
              const igstAmount = !isIntra ? (cart.igstAmount !== undefined ? Number(cart.igstAmount) : taxAmount) : 0;

              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', fontSize: '0.88rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#475569' }}>Products Subtotal</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{subtotal.toFixed(2)}</span>
                  </div>

                  {/* Collapsible Tax Breakdown Card (Shrunk by default) */}
                  <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsTaxBreakdownOpen(!isTaxBreakdownOpen)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 0.75rem',
                        background: '#f8fafc',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      title="Click to view detailed tax breakdown"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1a3d2b', textTransform: 'uppercase' }}>
                          Tax Breakdown (Included in Price)
                        </span>
                        <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                          {isIntra ? 'TN (33)' : 'Interstate'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          {isTaxBreakdownOpen ? 'Hide' : `₹${taxAmount.toFixed(2)}`}
                        </span>
                        {isTaxBreakdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {isTaxBreakdownOpen && (
                      <div style={{ padding: '0.65rem 0.75rem', borderTop: '1px dashed #cbd5e1' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '2px 0', color: '#64748b' }}>Price Before Tax:</td>
                              <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 600, color: '#334155' }}>
                                ₹{taxableAmount.toFixed(2)}
                              </td>
                            </tr>
                            {isIntra ? (
                              <>
                                <tr>
                                  <td style={{ padding: '2px 0', color: '#64748b' }}>Central Govt Tax (CGST):</td>
                                  <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 600, color: '#0369a1' }}>
                                    ₹{cgstAmount.toFixed(2)}
                                  </td>
                                </tr>
                                <tr>
                                  <td style={{ padding: '2px 0', color: '#64748b' }}>State Govt Tax (SGST):</td>
                                  <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 600, color: '#0369a1' }}>
                                    ₹{sgstAmount.toFixed(2)}
                                  </td>
                                </tr>
                              </>
                            ) : (
                              <tr>
                                <td style={{ padding: '2px 0', color: '#64748b' }}>Integrated Interstate Tax (IGST):</td>
                                <td style={{ padding: '2px 0', textAlign: 'right', fontWeight: 600, color: '#0369a1' }}>
                                  ₹{igstAmount.toFixed(2)}
                                </td>
                              </tr>
                            )}
                            <tr style={{ borderTop: '1px dashed #cbd5e1' }}>
                              <td style={{ padding: '4px 0 0', fontWeight: 700, color: '#166534' }}>Total Tax (Included):</td>
                              <td style={{ padding: '4px 0 0', textAlign: 'right', fontWeight: 800, color: '#166534' }}>
                                ₹{taxAmount.toFixed(2)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                          * No extra tax added at checkout. All product prices are already inclusive of GST.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shipping Charges (Before Round Off) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.45rem 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontSize: '0.88rem', marginBottom: '0.45rem' }}>
                    <div style={{ color: '#475569', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Truck size={14} color="#059669" />
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>Shipping Charges</span>
                      </div>
                      {hasShipping && cart.shipping && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                          <span>
                            {cart.shipping.shippingZone === 'TAMIL_NADU' ? 'Tamil Nadu' : 'Outside TN'} • {((cart.shipping.totalWeightGrams || 1000) / 1000).toFixed(2)} KG ({cart.shipping.totalWeightGrams}g) → {cart.shipping.billableUnits} slab{cart.shipping.billableUnits > 1 ? 's' : ''} ({cart.shipping.billableUnits} × ₹{cart.shipping.ratePerUnit})
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', paddingLeft: '0.5rem', flexShrink: 0 }}>
                      {hasShipping && cart.shipping ? `₹${cart.shipping.shippingAmount.toFixed(2)}` : 'Calculated at Checkout'}
                    </div>
                  </div>

                  {/* Round Off field before final price */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#64748b', marginBottom: '0.35rem' }}>
                    <span>Round Off</span>
                    <span style={{ fontWeight: 600 }}>
                      {roundOff >= 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.1rem', paddingTop: '0.5rem', borderTop: '1.5px solid #cbd5e1' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Estimated Total</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1a3d2b' }}>
                      ₹{finalTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              );
            })()}

            <button
              onClick={handleCheckoutClick}
              disabled={!cart.allItemsAvailable}
              className="btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            >
              <span>{cart.allItemsAvailable ? 'Proceed to Checkout' : 'Some Items Out of Stock'}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
