import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Shield,
  Truck,
  RotateCcw,
  MessageSquare,
  Heart,
} from 'lucide-react';
import api from '../api/client';
import { Product, ProductVariant, Category } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Catalog state for bottom recommendations
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState('');
  const [reviewErrorMessage, setReviewErrorMessage] = useState('');

  const RATING_LABELS: Record<number, string> = {
    1: 'Terrible',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
  };

  // Fetch catalog categories & all products for cross-recommendations
  useEffect(() => {
    Promise.all([
      api.get('/products?limit=100'),
      api.get('/categories/tree'),
    ])
      .then(([prodRes, catRes]: any) => {
        const prods = Array.isArray(prodRes) ? prodRes : (prodRes?.items || prodRes?.data?.items || []);
        setAllProducts(prods);
        setAllCategories(Array.isArray(catRes) ? catRes : (catRes?.data || []));
      })
      .catch((err) => {
        console.error('Failed to load related products', err);
      });
  }, []);

  const fetchProduct = () => {
    if (!slug) return;
    setIsLoading(true);
    api
      .get(`/products/${slug}`)
      .then((res: any) => {
        setProduct(res);
        if (res.images && res.images.length > 0) {
          setSelectedImage(res.images[0].url);
        }
        if (res.variants && res.variants.length > 0) {
          setSelectedVariant(res.variants[0]);
        }
        if (Array.isArray(res.reviews)) {
          setReviews(res.reviews);
        }
        if (res.id) {
          api
            .get(`/reviews/product/${res.id}`)
            .then((revRes: any) => {
              if (Array.isArray(revRes?.reviews)) {
                setReviews(revRes.reviews);
              }
            })
            .catch(() => { });
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQuantity(1); // reset qty on product change
    fetchProduct();
  }, [slug]);

  if (isLoading || !product) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading product details...
      </div>
    );
  }

  const currentPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.basePrice);
  const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.totalStock;
  const isLowStock = currentStock <= product.minStockAlert && currentStock > 0;
  const isOutOfStock = currentStock === 0;

  const currentCatId = product.categoryId || product.category?.id;

  // List of all active categories to display as cards
  const displayCategories = allCategories;

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, selectedVariant?.id, quantity);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setReviewErrorMessage('Please sign in to submit a review.');
      openLoginModal();
      return;
    }

    try {
      setIsSubmittingReview(true);
      setReviewErrorMessage('');
      setReviewSuccessMessage('');

      let matchingOrderId: number | undefined;
      try {
        const userOrders: any = await api.get('/orders');
        if (Array.isArray(userOrders)) {
          const order = userOrders.find((o: any) =>
            o.items?.some((i: any) => i.productId === product.id || i.snapshot?.name === product.name)
          );
          if (order) matchingOrderId = order.id;
        }
      } catch (err) {
        // ignore order lookup error
      }

      await api.post('/reviews', {
        productId: product.id,
        orderId: matchingOrderId,
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });

      setReviewSuccessMessage('Thank you! Your review has been submitted successfully.');
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      setHoverRating(null);
      fetchProduct();
    } catch (err: any) {
      setReviewErrorMessage(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="container" style={{ padding: '1.25rem 1.5rem 4rem', maxWidth: '1140px', margin: '0 auto' }}>
      {/* Breadcrumb Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        <Link to="/" style={{ color: 'var(--primary-600)' }}>Home</Link>
        <ChevronRight size={13} />
        <Link to="/catalog">Catalog</Link>
        {product.breadcrumbs?.map((b) => (
          <React.Fragment key={b.id}>
            <ChevronRight size={13} />
            <Link to={`/catalog?categoryId=${b.id}`}>{b.name}</Link>
          </React.Fragment>
        ))}
        <ChevronRight size={13} />
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{product.name}</span>
      </div>

      {/* Main Two-Column Product Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '2.25rem', alignItems: 'start', marginBottom: '2.75rem' }} className="product-details-grid">
        {/* Left Column: Image Gallery */}
        <div>
          <div
            style={{
              position: 'relative',
              borderRadius: '1rem',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-color)',
              marginBottom: '0.75rem',
              height: '350px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            {product && (
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                style={{
                  position: 'absolute',
                  top: '0.85rem',
                  right: '0.85rem',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: isInWishlist(product.id) ? '#ffffff' : 'rgba(255, 255, 255, 0.94)',
                  border: isInWishlist(product.id) ? '1.5px solid #fecaca' : '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(0, 0, 0, 0.12)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 4,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Heart
                  size={20}
                  fill={isInWishlist(product.id) ? '#ef4444' : 'none'}
                  color={isInWishlist(product.id) ? '#ef4444' : '#64748b'}
                  style={{ transition: 'all 0.15s ease' }}
                />
              </button>
            )}
            <img
              src={selectedImage || '/ayngaran-placeholder.svg'}
              alt={product.name}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>

          {/* Thumbnail Selector */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    border: `2px solid ${selectedImage === img.url ? 'var(--primary-600)' : 'var(--border-color)'}`,
                    flexShrink: 0,
                    backgroundColor: '#ffffff',
                    padding: '2px',
                    cursor: 'pointer',
                  }}
                >
                  <img src={img.url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information, Variants & Cart */}
        <div>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>{product.brand.name}</span>
          </div>

          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.45rem', color: '#0f172a' }}>
            {product.name}
          </h1>

          {/* Rating Summary */}
          {(() => {
            const hasReviews = reviews.length > 0;
            const avgRating = hasReviews
              ? (reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
              : (product.rating > 0 ? Number(product.rating).toFixed(1) : '5.0');
            const reviewCount = hasReviews ? reviews.length : (product.totalReviews || 0);

            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#fef3c7', padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
                  <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#92400e' }}>
                    {avgRating}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {reviewCount} Verified Customer Review{reviewCount === 1 ? '' : 's'}
                </span>
              </div>
            );
          })()}

          {/* Price */}
          <div style={{ padding: '0.85rem 1.15rem', backgroundColor: '#f8fafc', borderRadius: '0.85rem', border: '1px solid var(--border-color)', marginBottom: '1.15rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                ₹{currentPrice.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Inclusive of all taxes</span>
            </div>
            {isOutOfStock && (
              <div style={{ marginTop: '0.4rem' }}>
                <span className="badge badge-danger">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 1 && (
            <div style={{ marginBottom: '1.15rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem' }}>
                Select Configuration / Variant:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const label = v.variantValues
                    .map((vv) => `${vv.attributeValue.displayName}`)
                    .join(' / ');

                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        border: `1.5px solid ${isSelected ? 'var(--primary-600)' : 'var(--border-color)'}`,
                        backgroundColor: isSelected ? 'var(--primary-50)' : '#ffffff',
                        color: isSelected ? 'var(--primary-700)' : 'var(--text-main)',
                        transition: 'all var(--transition-fast)',
                        cursor: 'pointer',
                      }}
                    >
                      {label || ((v as any).weight ? `${(v as any).weight}g` : 'Standard')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to Cart Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                backgroundColor: '#ffffff',
              }}
            >
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{ padding: '0.5rem 0.8rem', fontSize: '0.9rem' }}
              >
                -
              </button>
              <span style={{ padding: '0.5rem 0.4rem', fontWeight: 700, minWidth: '1.8rem', textAlign: 'center', fontSize: '0.88rem' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                style={{ padding: '0.5rem 0.8rem', fontSize: '0.9rem' }}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="btn-primary"
              style={{ flex: 1, padding: '0.65rem 1.25rem', fontSize: '0.92rem' }}
            >
              <ShoppingBag size={18} />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
            </button>

            {product && (
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.15rem',
                  borderRadius: '0.5rem',
                  border: isInWishlist(product.id) ? '1.5px solid #fecaca' : '1.5px solid #cbd5e1',
                  backgroundColor: isInWishlist(product.id) ? '#fef2f2' : '#ffffff',
                  color: isInWishlist(product.id) ? '#ef4444' : '#334155',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isInWishlist(product.id)) {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#94a3b8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isInWishlist(product.id)) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }
                }}
              >
                <Heart
                  size={18}
                  fill={isInWishlist(product.id) ? '#ef4444' : 'none'}
                  color={isInWishlist(product.id) ? '#ef4444' : 'currentColor'}
                />
                <span>{isInWishlist(product.id) ? 'In Wishlist' : 'Wishlist'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Verified Customer Reviews</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Only authenticated buyers can submit verified reviews</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '3rem', alignItems: 'start' }} className="reviews-grid">
          {/* Rating Breakdown */}
          {(() => {
            const hasReviews = reviews.length > 0;
            const avgRating = hasReviews
              ? (reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
              : (product.rating > 0 ? Number(product.rating).toFixed(1) : '5.0');
            const reviewCount = hasReviews ? reviews.length : (product.totalReviews || 0);
            const numAvg = Math.round(Number(avgRating));

            return (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                    {avgRating}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'center', color: '#f59e0b', margin: '0.5rem 0' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={18} fill={s <= numAvg ? "#f59e0b" : "none"} color="#f59e0b" />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Based on {reviewCount} verified review{reviewCount === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Submit Review Trigger */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem' }}>Review this product</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Share your experience with other customers.
                  </p>

                  {reviewSuccessMessage && (
                    <div className="badge-success" style={{ padding: '0.6rem 0.85rem', borderRadius: '0.5rem', width: '100%', marginBottom: '1rem', fontSize: '0.82rem' }}>
                      {reviewSuccessMessage}
                    </div>
                  )}

                  {reviewErrorMessage && (
                    <div className="badge-danger" style={{ padding: '0.6rem 0.85rem', borderRadius: '0.5rem', width: '100%', marginBottom: '1rem', fontSize: '0.82rem' }}>
                      {reviewErrorMessage}
                    </div>
                  )}

                  <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                          Your Rating
                        </label>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d97706' }}>
                          {hoverRating || reviewRating} / 5
                          <span style={{ fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.3rem' }}>
                            ({RATING_LABELS[hoverRating || reviewRating]})
                          </span>
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 8px',
                          backgroundColor: '#fdfbf7',
                          borderRadius: '0.5rem',
                          border: '1px solid #f1ede4',
                        }}
                        onMouseLeave={() => setHoverRating(null)}
                      >
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (hoverRating || reviewRating);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              className="star-rating-btn"
                              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                outline: 'none',
                              }}
                            >
                              <Star
                                size={24}
                                fill={isFilled ? '#f59e0b' : '#e2e8f0'}
                                color={isFilled ? '#f59e0b' : '#e2e8f0'}
                                style={{
                                  transition: 'fill 0.15s ease, color 0.15s ease',
                                }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Review Headline</label>
                      <input
                        type="text"
                        placeholder="e.g. Blown away by the performance!"
                        className="input-field"
                        style={{ fontSize: '0.85rem' }}
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Your Comments</label>
                      <textarea
                        placeholder="Write your honest review..."
                        className="input-field"
                        style={{ fontSize: '0.85rem', height: '80px', resize: 'vertical' }}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="btn-primary"
                      style={{ padding: '0.65rem', fontSize: '0.88rem' }}
                    >
                      <MessageSquare size={16} />
                      <span>{isSubmittingReview ? 'Submitting...' : 'Submit Verified Review'}</span>
                    </button>
                  </form>
                </div>
              </div>
            );
          })()}

          {/* Customer Reviews Feed */}
          <div
            className="reviews-scroll-container"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '520px',
              overflowY: 'auto',
              paddingRight: '0.4rem',
            }}
          >
            {reviews.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '1rem',
                  border: '1px dashed var(--border-color)',
                  padding: '2.5rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <MessageSquare size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  No customer reviews yet
                </h4>
                <p style={{ fontSize: '0.85rem', maxWidth: '360px', margin: '0 auto' }}>
                  Be the first customer to share your thoughts on {product.name}!
                </p>
              </div>
            ) : (
              reviews.map((rev: any) => (
                <div
                  key={rev.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '1rem',
                    border: '1px solid var(--border-color)',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                        {rev.user?.name || 'Verified Customer'}
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Verified Buyer</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', color: '#f59e0b' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={14} fill={s <= rev.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {rev.title && (
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.4rem', color: '#1e293b' }}>
                      {rev.title}
                    </h4>
                  )}
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Explore Ayngaran Categories (Interactive Category Cards) */}
      {displayCategories.length > 0 && (
        <section style={{ marginTop: '5rem', paddingBottom: '3.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '0.85rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <span
                style={{
                  color: 'var(--primary-600)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Explore By Category
              </span>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                Explore Ayngaran Categories
              </h3>
            </div>
            <Link
              to="/catalog"
              style={{
                color: 'var(--primary-600)',
                fontWeight: 700,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'none',
              }}
            >
              <span>View Full Catalog</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {displayCategories.map((cat) => {
              const count = allProducts.filter(
                (p) => p.categoryId === cat.id || p.category?.id === cat.id
              ).length;
              const repProduct = allProducts.find(
                (p) =>
                  (p.categoryId === cat.id || p.category?.id === cat.id) &&
                  (p.primaryImage || (p.images && p.images.length > 0))
              );
              const thumbUrl =
                cat.image ||
                repProduct?.primaryImage ||
                repProduct?.images?.[0]?.url ||
                '/ayngaran-placeholder.svg';
              const isCurrentCat = cat.id === currentCatId;

              return (
                <Link
                  key={cat.id}
                  to={`/catalog?categoryId=${cat.id}`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '1.25rem',
                    border: isCurrentCat ? '2px solid #113926' : '1px solid #e2e8f0',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    textDecoration: 'none',
                    color: 'inherit',
                    position: 'relative',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="category-box-card"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 14px 30px rgba(17, 57, 38, 0.12)';
                    e.currentTarget.style.borderColor = '#113926';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.borderColor = isCurrentCat ? '#113926' : '#e2e8f0';
                  }}
                >
                  {/* Category Thumbnail Container */}
                  <div
                    style={{
                      height: '180px',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <img
                      src={thumbUrl}
                      alt={cat.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                      className="cat-card-img"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to top, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.2) 55%, transparent 100%)',
                      }}
                    />

                    {/* Count badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.85rem',
                        right: '0.85rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.94)',
                        backdropFilter: 'blur(6px)',
                        padding: '0.3rem 0.7rem',
                        borderRadius: '9999px',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: '#113926',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      }}
                    >
                      {count} {count === 1 ? 'Product' : 'Products'}
                    </div>

                    {isCurrentCat && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '0.85rem',
                          left: '0.85rem',
                          backgroundColor: '#113926',
                          color: '#ffffff',
                          padding: '0.3rem 0.7rem',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        ✓ Current Category
                      </div>
                    )}

                    {/* Category Title in Image Banner */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '0.9rem',
                        left: '1.1rem',
                        right: '1.1rem',
                      }}
                    >
                      <h4
                        style={{
                          color: '#ffffff',
                          fontSize: '1.3rem',
                          fontWeight: 800,
                          margin: 0,
                          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        }}
                      >
                        {cat.name}
                      </h4>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      flex: 1,
                      gap: '0.9rem',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '0.86rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.55,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {cat.description ||
                        `Explore authentic handcrafted ${cat.name} prepared with pure ingredients.`}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid #f1f5f9',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: 'var(--primary-600)',
                        }}
                      >
                        View {cat.name} Products
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          backgroundColor: '#f0fdf4',
                          color: '#113926',
                          transition: 'all 0.2s ease',
                        }}
                        className="cat-arrow-btn"
                      >
                        <ChevronRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <style>{`
        .reviews-scroll-container::-webkit-scrollbar {
          width: 5px;
        }
        .reviews-scroll-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 9999px;
        }
        .reviews-scroll-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .reviews-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .category-box-card:hover .cat-card-img {
          transform: scale(1.06);
        }
        .category-box-card:hover .cat-arrow-btn {
          background-color: #113926 !important;
          color: #ffffff !important;
          transform: translateX(3px);
        }
        .star-rating-btn {
          transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .star-rating-btn:hover {
          transform: scale(1.22);
        }
        .star-rating-btn:active {
          transform: scale(0.92);
        }
        @media (max-width: 850px) {
          .product-details-grid { grid-template-columns: 1fr !important; }
          .reviews-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
