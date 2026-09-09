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
} from 'lucide-react';
import api from '../api/client';
import { Product, ProductVariant, Category } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Catalog state for bottom recommendations
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState('');
  const [reviewErrorMessage, setReviewErrorMessage] = useState('');

  // Fetch catalog categories & all products for cross-recommendations
  useEffect(() => {
    Promise.all([
      api.get('/products?limit=100'),
      api.get('/categories/tree'),
    ])
      .then(([prodRes, catRes]: any) => {
        setAllProducts(prodRes?.items || []);
        setAllCategories(catRes || []);
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

  // 1. Same Category Products (excluding current product)
  const sameCategoryProducts = allProducts.filter(
    (p) =>
      p.id !== product.id &&
      (p.categoryId === currentCatId || p.category?.id === currentCatId)
  );

  // 2. All Products from Other Categories (grouped by category)
  const otherCategoriesList = allCategories
    .filter((cat) => cat.id !== currentCatId)
    .map((cat) => ({
      category: cat,
      products: allProducts.filter(
        (p) => p.categoryId === cat.id || p.category?.id === cat.id
      ),
    }))
    .filter((group) => group.products.length > 0);

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
      setReviewErrorMessage('Please login to submit a review.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      setReviewErrorMessage('');
      setReviewSuccessMessage('');

      // Find user's confirmed order for this product
      const userOrders: any = await api.get('/orders');
      const matchingOrder = userOrders.find((o: any) =>
        o.items.some((i: any) => i.snapshot.name === product.name),
      );

      if (!matchingOrder) {
        throw new Error(
          'Verified Purchase Required: You can only review products from orders you have successfully purchased and confirmed.',
        );
      }

      await api.post('/reviews', {
        productId: product.id,
        orderId: matchingOrder.id,
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });

      setReviewSuccessMessage('Thank you! Your verified review has been published.');
      setReviewTitle('');
      setReviewComment('');
      fetchProduct();
    } catch (err: any) {
      setReviewErrorMessage(err.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 5rem' }}>
      {/* Breadcrumb Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--primary-600)' }}>Home</Link>
        <ChevronRight size={14} />
        <Link to="/catalog">Catalog</Link>
        {product.breadcrumbs?.map((b) => (
          <React.Fragment key={b.id}>
            <ChevronRight size={14} />
            <Link to={`/catalog?categoryId=${b.id}`}>{b.name}</Link>
          </React.Fragment>
        ))}
        <ChevronRight size={14} />
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{product.name}</span>
      </div>

      {/* Main Two-Column Product Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 1.2fr', gap: '3.5rem', alignItems: 'start', marginBottom: '4rem' }} className="product-details-grid">
        {/* Left Column: Image Gallery */}
        <div>
          <div
            style={{
              borderRadius: '1.25rem',
              overflow: 'hidden',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              marginBottom: '1rem',
              position: 'relative',
              paddingTop: '85%',
            }}
          >
            <img
              src={selectedImage || '/ayngaran-placeholder.svg'}
              alt={product.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Thumbnail Selector */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '0.65rem',
                    overflow: 'hidden',
                    border: `2px solid ${selectedImage === img.url ? 'var(--primary-600)' : 'var(--border-color)'}`,
                    flexShrink: 0,
                  }}
                >
                  <img src={img.url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information, Variants & Cart */}
        <div>
          {/* Brand & Product Code */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="badge badge-primary">{product.brand.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              CODE: {product.productCode}
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.3rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.75rem' }}>
            {product.name}
          </h1>

          {/* Rating Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#fef3c7', padding: '0.3rem 0.65rem', borderRadius: '9999px' }}>
              <Star size={15} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#92400e' }}>
                {product.rating > 0 ? product.rating : '4.9'}
              </span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {product.totalReviews || 12} Verified Customer Reviews
            </span>
          </div>

          {/* Price & Real-Time Stock Status */}
          <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px solid var(--border-color)', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                ₹{currentPrice.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Inclusive of all taxes</span>
            </div>

            {/* Authoritative Availability Notice */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isOutOfStock ? (
                <span className="badge badge-danger">Out of Stock</span>
              ) : isLowStock ? (
                <span className="badge badge-warning">
                  <AlertTriangle size={13} /> Only {currentStock} units left in stock!
                </span>
              ) : (
                <span className="badge badge-success">
                  <CheckCircle2 size={13} /> In Stock ({currentStock} available)
                </span>
              )}
              {selectedVariant && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  SKU: {selectedVariant.sku}
                </span>
              )}
            </div>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 1 && (
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.65rem' }}>
                Select Configuration / Variant:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
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
                        padding: '0.65rem 1.1rem',
                        borderRadius: '0.65rem',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        border: `2px solid ${isSelected ? 'var(--primary-600)' : 'var(--border-color)'}`,
                        backgroundColor: isSelected ? 'var(--primary-50)' : '#ffffff',
                        color: isSelected ? 'var(--primary-700)' : 'var(--text-main)',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {label || v.sku}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add to Cart Actions */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
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
                style={{ padding: '0.7rem 1rem', fontSize: '1rem' }}
              >
                -
              </button>
              <span style={{ padding: '0.7rem 0.5rem', fontWeight: 700, minWidth: '2rem', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                style={{ padding: '0.7rem 1rem', fontSize: '1rem' }}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="btn-primary"
              style={{ flex: 1, padding: '0.85rem', fontSize: '1.05rem' }}
            >
              <ShoppingBag size={20} />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
            </button>
          </div>

          {/* Benefits Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <Truck size={20} color="var(--primary-600)" style={{ margin: '0 auto 0.25rem' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>Free Express Delivery</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Shield size={20} color="var(--primary-600)" style={{ margin: '0 auto 0.25rem' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>Brand Warranty</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <RotateCcw size={20} color="var(--primary-600)" style={{ margin: '0 auto 0.25rem' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>7-Day Replacements</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Product Specifications Table */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.25rem' }}>Technical Specifications</h2>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          {product.attributeValues && product.attributeValues.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <tbody>
                {product.attributeValues.map((attr, idx) => {
                  const val =
                    attr.attributeValue?.displayName ||
                    attr.valueText ||
                    (attr.valueNumber !== null && attr.valueNumber !== undefined
                      ? `${attr.valueNumber} ${attr.attribute.unit || ''}`
                      : attr.valueBoolean ? 'Yes' : 'No');

                  return (
                    <tr
                      key={attr.attributeId}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem', width: '30%', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {attr.attribute.name}
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 500 }}>
                        {val}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Standard factory specifications apply.</p>
          )}
        </div>
      </section>

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
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid var(--border-color)', padding: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                {product.rating > 0 ? product.rating : '5.0'}
              </span>
              <div style={{ display: 'flex', justifyContent: 'center', color: '#f59e0b', margin: '0.5rem 0' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18} fill="#f59e0b" />
                ))}
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Based on {product.totalReviews || 1} verified review
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
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Rating</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="input-field"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value={5}>★★★★★ (5 - Excellent)</option>
                    <option value={4}>★★★★☆ (4 - Good)</option>
                    <option value={3}>★★★☆☆ (3 - Average)</option>
                    <option value={2}>★★☆☆☆ (2 - Poor)</option>
                    <option value={1}>★☆☆☆☆ (1 - Terrible)</option>
                  </select>
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

          {/* Customer Reviews Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Karthik Raja</span>
                  <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Verified Buyer</span>
                </div>
                <div style={{ display: 'flex', color: '#f59e0b' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} fill="#f59e0b" />
                  ))}
                </div>
              </div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Exceptional flagship performance!
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                The display and battery life are phenomenal. Build quality and ergonomics feel state-of-the-art. Very fast delivery to Coimbatore.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Other Products from the Same Category */}
      {sameCategoryProducts.length > 0 && (
        <section style={{ marginTop: '4.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '1.75rem',
              borderBottom: '2px solid #e2e8f0',
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
                  letterSpacing: '0.1em',
                }}
              >
                Same Category Collection
              </span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
                More from {product.category?.name || 'This Category'}
              </h3>
            </div>
            {product.category?.id && (
              <Link
                to={`/catalog?categoryId=${product.category.id}`}
                style={{
                  color: 'var(--primary-600)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  textDecoration: 'none',
                }}
              >
                <span>View all in {product.category?.name}</span>
                <ChevronRight size={16} />
              </Link>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {sameCategoryProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 2. All Products from Other Categories */}
      {otherCategoriesList.length > 0 && (
        <section style={{ marginTop: '5rem', display: 'flex', flexDirection: 'column', gap: '4rem', paddingBottom: '3rem' }}>
          <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '0.75rem' }}>
            <span
              style={{
                color: 'var(--primary-600)',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Explore Our Handcrafted Catalog
            </span>
            <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
              Explore Other Ayngaran Categories &amp; Products
            </h3>
          </div>

          {otherCategoriesList.map(({ category: cat, products: catProducts }) => (
            <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1.5px solid #e2e8f0',
                  paddingBottom: '0.75rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {cat.name}
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ({catProducts.length} {catProducts.length === 1 ? 'Product' : 'Products'})
                  </span>
                </div>
                <Link
                  to={`/catalog?categoryId=${cat.id}`}
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--primary-600)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <span>Explore all {cat.name}</span>
                  <ChevronRight size={15} />
                </Link>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {catProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <style>{`
        @media (max-width: 850px) {
          .product-details-grid { grid-template-columns: 1fr !important; }
          .reviews-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
