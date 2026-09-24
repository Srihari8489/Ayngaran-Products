import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, ShieldCheck, Sparkles, Truck, Award, Sprout, ChevronLeft, ChevronRight, Star, PenLine } from 'lucide-react';
import api from '../api/client';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

// Count-up animation component that counts up from 0 to the target number on every mount / refresh
const AnimatedCounter: React.FC<{
  end: number;
  suffix?: string;
  duration?: number;
}> = ({ end, suffix = '', duration = 1800 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutCubic: fast initial count, smoothly settling at target
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * end));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [end, duration]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

export const HomePage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryImageMap, setCategoryImageMap] = useState<Record<number, string>>({});
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const collectionsRowRef = useRef<HTMLDivElement>(null);

  // Single-row feedback auto-scroll & interactive controls
  const feedbackScrollRef = useRef<HTMLDivElement>(null);
  const [isFeedbackPaused, setIsFeedbackPaused] = useState(false);
  const isDraggingFeedback = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  // Smooth continuous auto-scroll from right to left (scrollLeft increments)
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const el = feedbackScrollRef.current;
      if (el && !isFeedbackPaused && !isDraggingFeedback.current) {
        el.scrollLeft += 0.75;
        // When scrolled past half the duplicated carousel, seamlessly reset
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isFeedbackPaused]);

  const scrollFeedback = (dir: 'left' | 'right') => {
    if (feedbackScrollRef.current) {
      const amount = 360;
      feedbackScrollRef.current.scrollBy({
        left: dir === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  const onFeedbackMouseDown = (e: React.MouseEvent) => {
    if (!feedbackScrollRef.current) return;
    isDraggingFeedback.current = true;
    dragStartX.current = e.pageX - feedbackScrollRef.current.offsetLeft;
    dragScrollLeft.current = feedbackScrollRef.current.scrollLeft;
  };

  const onFeedbackMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingFeedback.current || !feedbackScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - feedbackScrollRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.4;
    feedbackScrollRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const onFeedbackMouseUp = () => {
    isDraggingFeedback.current = false;
  };

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=100'),
      api.get('/categories/tree'),
      api.get('/feedback/approved').catch(() => []),
    ])
      .then(([prodRes, catRes, feedRes]: any) => {
        const prods = prodRes?.items || prodRes?.data?.items || (Array.isArray(prodRes) ? prodRes : []);
        const cats = Array.isArray(catRes) ? catRes : (catRes?.data || []);
        const feeds = feedRes?.data || (Array.isArray(feedRes) ? feedRes : []);
        setAllProducts(prods);
        setCategories(cats);
        setFeedbacks(feeds);

        const map: Record<number, string> = {};
        prods.forEach((p: any) => {
          const cId = p.categoryId || p.category?.id;
          const img = p.primaryImage || p.images?.[0]?.url;
          if (cId && img && !map[cId]) {
            map[cId] = img;
          }
        });
        setCategoryImageMap(map);
      })
      .catch((err) => {
        console.error('Error fetching data for home:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Compute Our Collections for single row:
  // "take like more orders if count is not enough then random category also"
  const rowCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    // Calculate score for each category based on total orders and product activity
    const scoredCategories = categories.map((cat) => {
      const catProducts = allProducts.filter(
        (p) => p.categoryId === cat.id || p.category?.id === cat.id
      );
      const totalOrders = catProducts.reduce((sum, p: any) => {
        const orderCount = (p as any).ordersCount || (p as any).totalSold || 0;
        const reviewScore = ((p.reviewsCount || 0) * 2) + (p.rating || 0);
        return sum + orderCount * 10 + reviewScore;
      }, 0);

      return {
        category: cat,
        score: totalOrders,
        productCount: catProducts.length,
      };
    });

    // Categories with verified orders/activity sorted descending
    const active = scoredCategories
      .filter((cs) => cs.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((cs) => cs.category);

    // Remaining categories with lower or no activity
    const remaining = scoredCategories
      .filter((cs) => cs.score <= 0)
      .map((cs) => cs.category);

    // Randomize remaining categories for balanced variety
    const shuffledRemaining = [...remaining].sort(() => 0.5 - Math.random());

    // Combine active first, then random categories
    return [...active, ...shuffledRemaining];
  }, [categories, allProducts]);

  const scrollCollectionsRow = (direction: 'left' | 'right') => {
    if (collectionsRowRef.current) {
      const scrollAmount = 360;
      collectionsRowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Compute Trending Products:
  // "based on random or most order based produdcts if order based is low then display randomproduct but must dsplay the products 4 based on the site width"
  const trendingProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    // Calculate score for each product based on orders / sales / reviews
    const scoredProducts = allProducts.map((p) => {
      const orderCount = (p as any).ordersCount || (p as any).totalSold || 0;
      const reviewScore = ((p.reviewsCount || 0) * 2) + (p.rating || 0);
      return {
        product: p,
        score: orderCount * 10 + reviewScore,
      };
    });

    // Check if we have strong order-based data
    const hasOrderActivity = scoredProducts.filter((s) => s.score > 0).length >= 4;

    let selected: Product[] = [];

    if (hasOrderActivity) {
      // Sort descending by order/activity score
      scoredProducts.sort((a, b) => b.score - a.score);
      selected = scoredProducts.map((s) => s.product).slice(0, 8);
      // If fewer than 8, supplement with pseudo-random picks
      if (selected.length < 8) {
        const remaining = allProducts.filter((p) => !selected.includes(p));
        const shuffled = [...remaining].sort(() => 0.5 - Math.random());
        selected = [...selected, ...shuffled].slice(0, 8);
      }
    } else {
      // Low or no order activity: pick a fresh shuffled selection of products
      const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
      selected = shuffled.slice(0, 8);
    }

    return selected;
  }, [allProducts]);

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '80vh' }}>

      {/* 1. Hero Section (Natural & Healthy Traditional Foods) */}
      <section
        style={{
          backgroundColor: '#0c351f',
          color: '#ffffff',
          padding: '4.5rem 0 5.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '5%',
            height: '550px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '3.5rem',
            }}
            className="hero-flex-container"
          >
            {/* Left Content Column */}
            <div style={{ flex: '1', minWidth: '300px', maxWidth: '580px' }}>
              {/* Badge: Traditional Tamil Recipes */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#f59e0b',
                  borderRadius: '9999px',
                  padding: '0.4rem 1rem',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '1.5rem',
                }}
              >
                <Sprout size={16} color="#f59e0b" />
                <span>Traditional Tamil Recipes</span>
              </div>

              {/* Main Headline */}
              <h1
                style={{
                  fontSize: 'clamp(2.4rem, 4.8vw, 3.8rem)',
                  fontWeight: 900,
                  lineHeight: 1.12,
                  marginBottom: '1.35rem',
                  color: '#ffffff',
                  letterSpacing: '-0.025em',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                Natural &amp; Healthy<br />
                <span style={{ color: '#f59e0b' }}>Traditional Foods</span>
              </h1>

              {/* Subtitle Description */}
              <p
                style={{
                  fontSize: '1.05rem',
                  color: 'rgba(255, 255, 255, 0.82)',
                  lineHeight: 1.6,
                  marginBottom: '2.25rem',
                  fontWeight: 400,
                  maxWidth: '520px',
                }}
              >
                Discover the power of ancient recipes crafted with love. 100% natural, no preservatives — from our kitchen to yours.
              </p>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  flexWrap: 'wrap',
                  marginBottom: '3.25rem',
                }}
              >
                <Link
                  to="/catalog"
                  className="hero-shop-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#f59e0b',
                    color: '#0c2b18',
                    padding: '0.85rem 2rem',
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span>Shop Now</span>
                  <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>→</span>
                </Link>

                <Link
                  to="/about"
                  className="hero-story-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    border: '1.5px solid rgba(255, 255, 255, 0.35)',
                    padding: '0.85rem 2rem',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Our Story
                </Link>
              </div>

              {/* Animated Count-Up Stats Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'clamp(2rem, 5vw, 4rem)',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 'clamp(2rem, 3.8vw, 2.6rem)',
                      fontWeight: 900,
                      color: '#f59e0b',
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    <AnimatedCounter end={50} suffix="+" />
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.72)', marginTop: '0.35rem', fontWeight: 500 }}>
                    Traditional Recipes
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 'clamp(2rem, 3.8vw, 2.6rem)',
                      fontWeight: 900,
                      color: '#f59e0b',
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    <AnimatedCounter end={10} suffix="K+" />
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.72)', marginTop: '0.35rem', fontWeight: 500 }}>
                    Happy Customers
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 'clamp(2rem, 3.8vw, 2.6rem)',
                      fontWeight: 900,
                      color: '#f59e0b',
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      fontFamily: 'Outfit, sans-serif',
                    }}
                  >
                    <AnimatedCounter end={100} suffix="%" />
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.72)', marginTop: '0.35rem', fontWeight: 500 }}>
                    Natural &amp; Pure
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Floating Round Spices Image + "BEST SELLER" Badge */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
            >
              {/* Circular Spices Image Container */}
              <div
                className="hero-floating-circle"
                style={{
                  width: 'clamp(280px, 32vw, 440px)',
                  height: 'clamp(280px, 32vw, 440px)',
                  borderRadius: '50%',
                  border: '8px solid #3e5e34',
                  overflow: 'hidden',
                  boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.65)',
                  position: 'relative',
                  flexShrink: 0,
                  backgroundColor: '#1a3d2b',
                }}
              >
                <img
                  src="/traditional_spices.jpg"
                  alt="Natural &amp; Traditional Foods"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>

              {/* Floating "BEST SELLER" Circular Badge */}
              <div
                className="hero-floating-badge"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '18px',
                  width: 'clamp(84px, 8vw, 98px)',
                  height: 'clamp(84px, 8vw, 98px)',
                  borderRadius: '50%',
                  backgroundColor: '#f59e0b',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  zIndex: 20,
                  cursor: 'default',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <span
                  style={{
                    color: '#0c2b18',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    lineHeight: 1.15,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  BEST<br />SELLER
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Our Collections Section (Single Row with Arrow Navigation & View All Link) */}
      {rowCategories.length > 0 && (
        <section style={{ padding: '4.5rem 0 3.75rem', backgroundColor: '#fdfbf7', borderBottom: '1px solid #f1ece1' }}>
          <div className="container">
            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginBottom: '2.25rem',
                flexWrap: 'wrap',
                gap: '1.25rem',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#e6f7f0',
                    color: '#113926',
                    border: '1px solid #c7ebd9',
                    padding: '0.28rem 0.85rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}
                >
                  <Sparkles size={13} color="#113926" />
                  <span>BROWSE CATEGORIES</span>
                </div>
                <h2
                  style={{
                    fontSize: 'clamp(2rem, 3.5vw, 2.6rem)',
                    fontWeight: 800,
                    color: '#113926',
                    margin: 0,
                    letterSpacing: '-0.02em',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Our Collections
                </h2>
                <p style={{ fontSize: '0.98rem', color: '#64748b', margin: '0.35rem 0 0' }}>
                  Explore our carefully curated range of traditional healthy foods
                </p>
              </div>

              {/* View All Collections Button & Row Scroll Arrows */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link
                  to="/catalog"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    backgroundColor: '#113926',
                    color: '#ffffff',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '9999px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(17, 57, 38, 0.18)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  className="collection-view-all-btn"
                >
                  <span>View All Collections</span>
                  <ArrowRight size={15} />
                </Link>

              </div>
            </div>

            {/* Single Row Horizontal Categories Container */}
            <div
              ref={collectionsRowRef}
              className="collections-one-row-scroll"
              style={{
                display: 'flex',
                gap: '1.25rem',
                overflowX: 'auto',
                padding: '1.25rem 0.6rem 1.25rem',
                margin: '-0.5rem -0.6rem 0',
                scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
              }}
            >
              {rowCategories.map((cat) => {
                const thumbUrl = cat.image || categoryImageMap[cat.id] || '/traditional_spices.jpg';
                return (
                  <Link
                    key={cat.id}
                    to={`/catalog?categoryId=${cat.id}`}
                    className="home-collection-card"
                    style={{
                      minWidth: '155px',
                      width: '165px',
                      flexShrink: 0,
                      height: '175px',
                      backgroundColor: '#ffffff',
                      borderRadius: '1.25rem',
                      border: '2px solid #e2e8f0',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.25rem 0.85rem',
                      textDecoration: 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      scrollSnapAlign: 'start',
                    }}
                  >
                    {/* Rounded Image / Icon Container */}
                    <div
                      className="collection-card-img-box"
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        backgroundColor: '#f8fafc',
                        border: '2px solid #eef2f6',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      <img
                        src={thumbUrl}
                        alt={cat.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.3s ease',
                        }}
                        className="collection-thumb-img"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/traditional_spices.jpg';
                        }}
                      />
                    </div>

                    {/* Category Title */}
                    <span
                      className="collection-card-title"
                      style={{
                        marginTop: '0.85rem',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: '#111827',
                        textAlign: 'center',
                        lineHeight: 1.25,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {cat.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 3. Trending Products Section (4-column responsive grid matching site width) */}
      <section style={{ padding: '4.5rem 0 5.5rem', backgroundColor: '#faf7f2' }}>
        <div className="container">

          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '2.5rem',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                <Flame size={14} color="#d97706" />
                <span>Trending Now</span>
              </div>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 3.5vw, 2.5rem)',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                Trending Products
              </h2>
              <p style={{ fontSize: '0.96rem', color: '#64748b', marginTop: '0.35rem', margin: '0.35rem 0 0' }}>
                Customer favorites and most popular traditional selections
              </p>
            </div>

            <Link
              to="/catalog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#ffffff',
                color: '#113926',
                border: '1px solid #e5e7eb',
                padding: '0.6rem 1.25rem',
                borderRadius: '0.625rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#113926';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#113926';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#113926';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <span>Explore Full Store</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Products Grid: 4 columns on desktop width */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b', fontSize: '1rem' }}>
              Loading trending products...
            </div>
          ) : trendingProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b', fontSize: '1rem' }}>
              No products found.
            </div>
          ) : (
            <div
              className="trending-products-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '1.75rem',
              }}
            >
              {trendingProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         4. WHY CHOOSE US? (THE AYNGARAN PROMISE) SECTION
         ══════════════════════════════════════════════════════════ */}
      <section
        style={{
          backgroundColor: '#071f14',
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(34, 197, 94, 0.16) 0%, transparent 60%),
            radial-gradient(circle at 85% 90%, rgba(234, 179, 8, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 15% 90%, rgba(16, 185, 129, 0.09) 0%, transparent 40%)
          `,
          padding: '6rem 0',
          position: 'relative',
          overflow: 'hidden',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Subtle grid pattern background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1.2px, transparent 1.2px)',
            backgroundSize: '30px 30px',
            opacity: 0.3,
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* THE AYNGARAN PROMISE Pill Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              color: '#facc15',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.4rem 1.25rem',
              borderRadius: '9999px',
              marginBottom: '1.25rem',
            }}
          >
            THE AYNGARAN PROMISE
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: 'clamp(2.25rem, 4vw, 3rem)',
              fontWeight: 900,
              color: '#ffffff',
              margin: '0 0 0.85rem',
              letterSpacing: '-0.02em',
            }}
          >
            Why Choose Us?
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '1.05rem',
              color: '#94a3b8',
              margin: '0 auto',
              maxWidth: '580px',
              lineHeight: 1.65,
            }}
          >
            We believe in bringing back the wisdom of our ancestors through pure, unadulterated food.
          </p>

          {/* 4 Cards Grid */}
          <div
            className="why-choose-us-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '1.75rem',
              marginTop: '3.75rem',
            }}
          >
            {/* 100% Natural */}
            <div className="why-choose-card">
              <div className="why-choose-icon" style={{ fontSize: '3.25rem', marginBottom: '1.25rem', lineHeight: 1 }}>
                🌿
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
                100% Natural
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                No artificial colors, flavors or preservatives. Just pure nature.
              </p>
            </div>

            {/* Traditional Recipe */}
            <div className="why-choose-card">
              <div className="why-choose-icon" style={{ fontSize: '3.25rem', marginBottom: '1.25rem', lineHeight: 1 }}>
                👵
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
                Traditional Recipe
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                Authentic preparation methods passed down through generations.
              </p>
            </div>

            {/* Health First */}
            <div className="why-choose-card">
              <div className="why-choose-icon" style={{ fontSize: '3.25rem', marginBottom: '1.25rem', lineHeight: 1 }}>
                💪
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
                Health First
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                Focused on immunity, gut health and overall well-being.
              </p>
            </div>

            {/* Premium Quality */}
            <div className="why-choose-card">
              <div className="why-choose-icon" style={{ fontSize: '3.25rem', marginBottom: '1.25rem', lineHeight: 1 }}>
                ✨
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem' }}>
                Premium Quality
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                Sourced from the finest organic farms across South India.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
         5. CUSTOMER FEEDBACK / REVIEWS SECTION ("What Our Family Says")
         ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '5.5rem 0', backgroundColor: '#faf7f2' }}>
        <div className="container">
          <div style={{ marginBottom: '2rem' }}>
            {/* Header with REVIEWS badge & title */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #bbf7d0',
                  color: '#047857',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '0.35rem 0.95rem',
                  borderRadius: '9999px',
                  marginBottom: '0.75rem',
                }}
              >
                REVIEWS
              </div>

              <h2
                style={{
                  fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                  fontWeight: 900,
                  color: '#0f172a',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                }}
              >
                What Our <span style={{ color: '#166534' }}>Family Says</span>
              </h2>
              <p style={{ fontSize: '1rem', color: '#64748b', margin: '0 auto 1.5rem', maxWidth: '520px' }}>
                Real experiences from people who made the healthy switch
              </p>

              {/* Actions & Navigation Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>


                {/* Share Your Experience Button */}
                <Link
                  to="/feedback"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#ffffff',
                    color: '#113926',
                    border: '1.5px solid #113926',
                    padding: '0.65rem 1.45rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(17, 57, 38, 0.08)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#113926';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#113926';
                  }}
                >
                  <PenLine size={15} />
                  <span>Share Your Experience</span>
                </Link>


              </div>
            </div>

            {/* Single Row Auto-Scrolling Carousel Wrapper with Left & Right Gradient Shadow Fades */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Left Edge Shadow / Opacity Gradient Fade */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: 'clamp(50px, 9vw, 120px)',
                  background: 'linear-gradient(to right, #faf7f2 15%, rgba(250, 247, 242, 0.8) 60%, rgba(250, 247, 242, 0) 100%)',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />

              {/* Right Edge Shadow / Opacity Gradient Fade */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: 'clamp(50px, 9vw, 120px)',
                  background: 'linear-gradient(to left, #faf7f2 15%, rgba(250, 247, 242, 0.8) 60%, rgba(250, 247, 242, 0) 100%)',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              />

              <div
                ref={feedbackScrollRef}
                className="feedback-carousel-scroll"
                onMouseEnter={() => setIsFeedbackPaused(true)}
                onMouseLeave={() => {
                  setIsFeedbackPaused(false);
                  onFeedbackMouseUp();
                }}
                onTouchStart={() => setIsFeedbackPaused(true)}
                onTouchEnd={() => setIsFeedbackPaused(false)}
                onMouseDown={onFeedbackMouseDown}
                onMouseMove={onFeedbackMouseMove}
                onMouseUp={onFeedbackMouseUp}
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: '1.5rem',
                  overflowX: 'auto',
                  padding: '1.25rem 0.6rem 1.75rem',
                  margin: '0 -0.6rem',
                  cursor: 'grab',
                  userSelect: 'none',
                  scrollbarWidth: 'none',
                }}
              >
                {(() => {
                  const baseList =
                    feedbacks.length > 0
                      ? feedbacks
                      : [
                        {
                          id: 1,
                          name: 'Senthil Kumar',
                          rating: 5,
                          feedback: 'Excellent service and prompt delivery. The packaging was eco-friendly and clean. Will order again.',
                        },
                        {
                          id: 2,
                          name: 'Meera Raghavan',
                          rating: 5,
                          feedback: 'Great initiative bringing back traditional healthy grains! U-Malt has become a part of our morning routine.',
                        },
                        {
                          id: 3,
                          name: 'Priya Suresh',
                          rating: 5,
                          feedback: 'Delicious and authentic traditional products! The natural flavor is unmatched.',
                        },
                        {
                          id: 4,
                          name: 'Karthik Raja',
                          rating: 5,
                          feedback: 'Fast shipping and authentic quality. Customer support was also very helpful when I asked about usage instructions.',
                        },
                        {
                          id: 5,
                          name: 'Ananya Sundaram',
                          rating: 5,
                          feedback: 'Pure homemade taste without any chemical preservatives. The cold-pressed oils and herbal health mixes remind me of my grandmother recipes.',
                        },
                        {
                          id: 6,
                          name: 'SRI HARI',
                          rating: 5,
                          feedback: 'Authentic traditional quality with pristine customer care and pure ingredients.',
                        },
                      ];
                  // Duplicate once to enable seamless infinite scroll loop
                  const loopList = [...baseList, ...baseList];

                  return loopList.map((item: any, idx: number) => (
                    <div
                      key={`${item.id}-${idx}`}
                      style={{
                        display: 'block',
                        flexShrink: 0,
                        width: '340px',
                        maxWidth: '85vw',
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: '1.25rem',
                          border: '1.5px solid #e2e8f0',
                          padding: '1.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '215px',
                          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.borderColor = '#166534';
                          e.currentTarget.style.boxShadow = '0 10px 25px rgba(22, 101, 52, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px)';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.03)';
                        }}
                      >
                        <div>
                          {/* 5 Stars */}
                          <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.85rem' }}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                fill={i < (item.rating || 5) ? '#f59e0b' : '#ffffff'}
                                stroke={i < (item.rating || 5) ? '#f59e0b' : '#cbd5e1'}
                              />
                            ))}
                          </div>

                          {/* Feedback Text Quote */}
                          <p
                            style={{
                              fontSize: '0.9rem',
                              fontStyle: 'italic',
                              color: '#334155',
                              lineHeight: 1.55,
                              margin: 0,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            "{item.feedback}"
                          </p>
                        </div>

                        {/* Customer Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                              fontWeight: 800,
                              fontSize: '0.92rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <h4
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                color: '#0f172a',
                                margin: 0,
                              }}
                            >
                              {item.name}
                            </h4>
                            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                              Verified Customer
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Grid & Hero Floating Keyframe Styles */}
      <style>{`
        @keyframes heroImgFloat {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-16px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        @keyframes heroBadgeFloat {
          0% {
            transform: translateY(0px) rotate(-3deg);
          }
          50% {
            transform: translateY(-19px) rotate(3deg);
          }
          100% {
            transform: translateY(0px) rotate(-3deg);
          }
        }

        .hero-floating-circle {
          animation: heroImgFloat 4.2s ease-in-out infinite;
          will-change: transform;
        }

        .hero-floating-badge {
          animation: heroBadgeFloat 3.8s ease-in-out infinite;
          will-change: transform;
        }

        .hero-shop-btn:hover {
          background-color: #fbbf24 !important;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(245, 158, 11, 0.45) !important;
        }

        .hero-story-btn:hover {
          background-color: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.6) !important;
          transform: translateY(-2px);
        }

        .home-collection-card:hover {
          transform: translateY(-6px);
          border-color: #113926 !important;
          box-shadow: 0 12px 28px rgba(17, 57, 38, 0.14) !important;
        }
        .home-collection-card:hover .collection-card-title {
          color: #113926 !important;
        }
        .home-collection-card:hover .collection-card-img-box {
          border-color: #113926 !important;
          transform: scale(1.06);
        }
        .home-collection-card:hover .collection-thumb-img {
          transform: scale(1.1);
        }
        .collection-view-all-btn:hover {
          background-color: #0b281b !important;
          transform: translateX(2px);
          box-shadow: 0 6px 18px rgba(17, 57, 38, 0.25) !important;
        }
        .collection-nav-arrow-btn:hover {
          background-color: #113926 !important;
          color: #ffffff !important;
          border-color: #113926 !important;
          transform: scale(1.08);
        }
        .collections-one-row-scroll::-webkit-scrollbar {
          display: none;
        }
        .feedback-carousel-scroll::-webkit-scrollbar {
          display: none;
        }
        .feedback-carousel-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .feedback-carousel-scroll:active {
          cursor: grabbing !important;
        }

        @media (max-width: 900px) {
          .hero-flex-container {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
          .hero-flex-container > div:first-child {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .hero-floating-badge {
            top: 5px !important;
            right: 5px !important;
          }
        }

        @media (max-width: 1100px) {
          .trending-products-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 768px) {
          .trending-products-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 480px) {
          .trending-products-grid {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
        }

        /* Why Choose Us Cards */
        .why-choose-card {
          background-color: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.25rem;
          padding: 2.75rem 1.75rem 2.25rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(8px);
        }

        .why-choose-card:hover {
          transform: translateY(-8px);
          background-color: rgba(255, 255, 255, 0.075) !important;
          border-color: rgba(74, 222, 128, 0.45) !important;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45), 0 0 24px rgba(34, 197, 94, 0.15) !important;
        }

        .why-choose-card .why-choose-icon {
          transition: transform 0.3s ease;
        }

        .why-choose-card:hover .why-choose-icon {
          transform: scale(1.18);
        }

        @media (max-width: 1024px) {
          .why-choose-us-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 1.5rem !important;
          }
        }

        @media (max-width: 640px) {
          .why-choose-us-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
};
