import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, closeCart, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

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
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 90,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => e.target === e.currentTarget && closeCart()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          height: '100%',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
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
        <div style={{ padding: '0.75rem 1.5rem', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
          {(cart?.subtotal || 0) >= 1000 ? (
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>🎉 You qualify for FREE Delivery!</span>
          ) : (
            <span>Add <strong>₹{1000 - (cart?.subtotal || 0)}</strong> more to get <strong>FREE Express Delivery</strong>!</span>
          )}
        </div>

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

                    {item.variantDescription && (
                      <span
                        className="badge"
                        style={{ margin: '0.35rem 0', background: '#f1f5f9', color: 'var(--text-main)', fontSize: '0.72rem' }}
                      >
                        {item.variantDescription}
                      </span>
                    )}

                    {/* Stock Warning if any */}
                    {item.stockWarning && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--warning)', fontSize: '0.75rem', margin: '0.25rem 0' }}>
                        <AlertTriangle size={13} />
                        <span>{item.stockWarning}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        ₹{item.totalPrice.toLocaleString()}
                      </span>

                      {/* Quantity Controls */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid var(--border-color)',
                          borderRadius: '0.4rem',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          style={{ padding: '0.25rem 0.5rem', background: '#f8fafc' }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ padding: '0.25rem 0.65rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ padding: '0.25rem 0.5rem', background: '#f8fafc' }}
                        >
                          <Plus size={13} />
                        </button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>₹{cart.subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Delivery</span>
              <span style={{ fontWeight: 600, color: cart.subtotal >= 1000 ? 'var(--success)' : 'inherit' }}>
                {cart.subtotal >= 1000 ? 'FREE' : '₹99'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: 800 }}>
              <span>Total Estimated</span>
              <span style={{ color: 'var(--primary-600)' }}>
                ₹{(cart.subtotal + (cart.subtotal >= 1000 ? 0 : 99)).toLocaleString()}
              </span>
            </div>

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
