import React, { useState } from 'react';
import { Star, CheckCircle2, AlertCircle, ArrowLeft, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const RATING_DESCRIPTIONS: Record<number, string> = {
  5: '😍 Excellent — Love it!',
  4: '😊 Very Good — Really liked it!',
  3: '🙂 Good — Satisfied',
  2: '😐 Fair — Could be better',
  1: '😞 Poor — Not satisfied',
};

export const FeedbackPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!feedback.trim()) {
      setErrorMessage('Please write your feedback or suggestions.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/feedback', {
        name: name.trim(),
        email: email.trim(),
        rating,
        feedback: feedback.trim(),
      });

      setLoading(false);
      setSubmitted(true);
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(
        err.response?.data?.message || 'Failed to submit feedback. Please check your details and try again.'
      );
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setRating(5);
    setFeedback('');
    setSubmitted(false);
    setErrorMessage('');
  };

  const currentRating = hoverRating || rating;

  return (
    <div
      style={{
        backgroundColor: '#fbf8f2',
        minHeight: '85vh',
        padding: '3rem 1rem 5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '560px' }}>
        {/* Back Link */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: '#166534',
            marginBottom: '1.5rem',
            textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {submitted ? (
          /* ── Success State ── */
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1.25rem',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              border: '1.5px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <CheckCircle2 size={36} color="#16a34a" />
            </div>

            <h2
              style={{
                fontSize: '1.65rem',
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: '0.5rem',
              }}
            >
              Thank You for Your Feedback!
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: '#64748b',
                lineHeight: 1.6,
                maxWidth: '420px',
                margin: '0 auto 2rem',
              }}
            >
              We truly appreciate you taking the time to share your thoughts. Your review helps us continuously improve our traditional products and serve you better.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.625rem',
                  backgroundColor: '#113926',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(17, 57, 38, 0.25)',
                }}
              >
                Return to Home
              </Link>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.625rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Submit Another Review
              </button>
            </div>
          </div>
        ) : (
          /* ── Feedback Form Card (Matches User's Images 3 & 4) ── */
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1.25rem',
              padding: '2.5rem 2.25rem',
              boxShadow: '0 4px 25px rgba(0, 0, 0, 0.04)',
              border: '1.5px solid #e2e8f0',
            }}
          >
            {/* Form Title & Subtitle */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  marginBottom: '0.4rem',
                  letterSpacing: '-0.02em',
                }}
              >
                Share Your Experience
              </h1>
              <p style={{ fontSize: '0.92rem', color: '#64748b', margin: 0 }}>
                We value your honest opinion about our products and service
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '0.625rem',
                  color: '#dc2626',
                  fontSize: '0.875rem',
                  marginBottom: '1.5rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              {/* Full Name */}
              <div>
                <label
                  htmlFor="feedback-name"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '0.45rem',
                  }}
                >
                  Full Name
                </label>
                <input
                  id="feedback-name"
                  type="text"
                  placeholder="Priya Suresh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.625rem',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#faf8f5',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#166534';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.backgroundColor = '#faf8f5';
                  }}
                />
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="feedback-email"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '0.45rem',
                  }}
                >
                  Email Address
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  placeholder="abc@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.625rem',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#faf8f5',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#166534';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.backgroundColor = '#faf8f5';
                  }}
                />
              </div>

              {/* Rating Component with 5 Golden Stars */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '0.5rem',
                  }}
                >
                  Rating
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= currentRating;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '0.2rem',
                          cursor: 'pointer',
                          transition: 'transform 0.1s ease',
                          transform: hoverRating === starVal ? 'scale(1.2)' : 'scale(1)',
                        }}
                        aria-label={`${starVal} Star`}
                      >
                        <Star
                          size={28}
                          fill={isFilled ? '#f59e0b' : '#ffffff'}
                          stroke={isFilled ? '#f59e0b' : '#cbd5e1'}
                          strokeWidth={isFilled ? 0 : 2}
                        />
                      </button>
                    );
                  })}
                </div>
                {/* Rating Description Label */}
                <p
                  style={{
                    marginTop: '0.5rem',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#b45309',
                    minHeight: '1.25rem',
                  }}
                >
                  {RATING_DESCRIPTIONS[currentRating]}
                </p>
              </div>

              {/* Your Feedback Textarea */}
              <div>
                <label
                  htmlFor="feedback-text"
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#334155',
                    marginBottom: '0.45rem',
                  }}
                >
                  Your Feedback
                </label>
                <textarea
                  id="feedback-text"
                  rows={4}
                  placeholder="Write your suggestions, review or experience here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.625rem',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#faf8f5',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#166534';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.backgroundColor = '#faf8f5';
                  }}
                />
              </div>

              {/* Submit Feedback Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '0.625rem',
                  backgroundColor: loading ? '#94a3b8' : '#113926',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(17, 57, 38, 0.28)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
