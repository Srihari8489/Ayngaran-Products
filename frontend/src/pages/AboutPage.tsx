import React from 'react';
import { Store, Smile, Sprout, Trophy } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '80vh' }}>
      
      {/* 1. Hero Section (Matching Image 3) */}
      <section
        style={{
          backgroundColor: '#113926',
          color: '#ffffff',
          padding: '4.5rem 1.5rem',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.4rem)',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <span>Our Story</span>
            <span style={{ fontSize: '2.4rem' }}>🌿</span>
          </h1>
          <p
            style={{
              fontSize: '1.15rem',
              color: '#d8f3dc',
              lineHeight: 1.6,
              fontWeight: 500,
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            Rooted in Tamil tradition, growing towards a healthier India. We are Ayngaran — your trusted partner in traditional wellness.
          </p>
        </div>
      </section>

      {/* 2. Story Content Section (Matching Image 3) */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#ffffff' }}>
        <div
          className="container"
          style={{
            maxWidth: '1150px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Narrative */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2
              style={{
                fontSize: 'clamp(1.85rem, 3.5vw, 2.35rem)',
                fontWeight: 800,
                color: '#111827',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
              }}
            >
              From Grandmother's Kitchen to Your Doorstep
            </h2>

            <p style={{ fontSize: '1.02rem', color: '#4b5563', lineHeight: 1.75, margin: 0 }}>
              Ayngaran was born out of a simple belief: the best medicine is food, and the best food is traditional. Founded in the heart of Tamil Nadu, we started our journey by rediscovering and preserving the incredible nutritional wisdom embedded in our ancestors' cooking.
            </p>

            <p style={{ fontSize: '1.02rem', color: '#4b5563', lineHeight: 1.75, margin: 0 }}>
              Every product we make follows recipes passed down through generations. We use only the finest naturally grown ingredients sourced directly from trusted Tamil Nadu farmers.
            </p>

            <p style={{ fontSize: '1.02rem', color: '#4b5563', lineHeight: 1.75, margin: 0 }}>
              Our mission is to make traditional Tamil health foods accessible to every household.
            </p>
          </div>

          {/* Right Column: 50+ Traditional Products Box with Green Dashed Border (Matching Image 3) */}
          <div
            style={{
              backgroundColor: '#f2fbf4',
              border: '2px dashed #4ade80',
              borderRadius: '1.5rem',
              padding: '3.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(74, 222, 128, 0.08)',
            }}
          >
            {/* Custom Grains / Traditional Plant Graphic */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                marginBottom: '1.5rem',
              }}
            >
              🌾
            </div>

            <h3
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#111827',
                marginBottom: '0.5rem',
              }}
            >
              50+ Traditional Products
            </h3>

            <p
              style={{
                fontSize: '0.96rem',
                color: '#64748b',
                lineHeight: 1.5,
                margin: 0,
                maxWidth: '300px',
              }}
            >
              Each product carries centuries of Tamil culinary wisdom.
            </p>
          </div>

        </div>
      </section>

      {/* 3. By the Numbers / Our Impact Section (Matching Image 4) */}
      <section
        style={{
          backgroundColor: '#faf7f2',
          padding: '5rem 1.5rem',
          borderTop: '1px solid #f1ece1',
        }}
      >
        <div className="container" style={{ maxWidth: '1150px', margin: '0 auto', textAlign: 'center' }}>
          
          {/* Pill Badge */}
          <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
            <span
              style={{
                backgroundColor: '#e0f2fe',
                color: '#0369a1',
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.35rem 0.9rem',
                borderRadius: '9999px',
                display: 'inline-block',
              }}
            >
              BY THE NUMBERS
            </span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.6rem)',
              fontWeight: 800,
              color: '#113926',
              marginBottom: '3rem',
              letterSpacing: '-0.02em',
            }}
          >
            Our Impact
          </h2>

          {/* 4 Cards Grid (Matching Image 4) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Card 1: 50+ Products */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '1rem',
                padding: '2.25rem 1.5rem',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏬</div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>
                50+
              </span>
              <span style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: 500 }}>
                Products
              </span>
            </div>

            {/* Card 2: 10K+ Happy Customers */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '1rem',
                padding: '2.25rem 1.5rem',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>😊</div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>
                10K+
              </span>
              <span style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: 500 }}>
                Happy Customers
              </span>
            </div>

            {/* Card 3: 50+ Partner Farmers */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '1rem',
                padding: '2.25rem 1.5rem',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌾</div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>
                50+
              </span>
              <span style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: 500 }}>
                Partner Farmers
              </span>
            </div>

            {/* Card 4: FSSAI Certified */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '1rem',
                padding: '2.25rem 1.5rem',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏆</div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#113926', marginBottom: '0.25rem' }}>
                FSSAI
              </span>
              <span style={{ fontSize: '0.92rem', color: '#64748b', fontWeight: 500 }}>
                Certified
              </span>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};
