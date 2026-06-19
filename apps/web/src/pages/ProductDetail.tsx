import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, paymentsAPI, reviewsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import FileManager from '../components/FileManager';

/* ─── Purchase Modal ─── */
function PurchaseModal({
  product,
  onClose,
  onSuccess,
}: {
  product: { id: string; title: string; price: number };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(0);
  const [buying, setBuying] = useState(false);
  const steps = ['Review', 'Confirm', 'Done'];

  const handlePurchase = async () => {
    setBuying(true);
    try {
      const response = await paymentsAPI.createCheckoutSession(product.id);
      window.location.href = response.data.url;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Failed to create checkout session.');
      setBuying(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
        borderRadius: 20, width: '100%', maxWidth: 520, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px', borderBottom: '1px solid var(--border-dim)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{
              color: 'var(--eth-purple)', fontSize: 11, fontWeight: 700,
              letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
            }}>
              🔐 Purchase
            </div>
            <div style={{ color: 'var(--text-main)', fontSize: 18, fontWeight: 700 }}>
              {product.title}
            </div>
          </div>
          <button onClick={onClose} className="btn-outline"
            style={{ padding: '6px 12px', fontSize: 16, minWidth: 32, height: 32 }}>
            ×
          </button>
        </div>

        {/* Steps */}
        <div style={{
          padding: '16px 28px', borderBottom: '1px solid var(--border-dim)',
          display: 'flex',
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6, position: 'relative',
            }}>
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute', top: 14, left: '50%', width: '100%', height: 2,
                  background: i < step ? 'var(--eth-purple)' : 'var(--border-dim)',
                }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', zIndex: 1,
                background: i < step ? 'var(--eth-purple)' : 'var(--bg-panel)',
                border: `2px solid ${i <= step ? 'var(--eth-purple)' : 'var(--border-dim)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <div style={{
                fontSize: 10, fontFamily: 'var(--font-mono)',
                color: i <= step ? 'var(--text-muted)' : 'var(--text-faint)',
                textAlign: 'center',
              }}>
                {s}
              </div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          {step === 0 && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
                You're about to purchase <strong style={{ color: 'var(--text-main)' }}>{product.title}</strong>.
                A unique SHA-256 cryptographic certificate will be permanently linked to your account.
              </p>
              <div style={{
                background: 'transparent', borderRadius: 12,
                border: '1px solid var(--border-dim)', padding: '14px 16px', marginBottom: 20,
              }}>
                {[
                  ['Product', product.title],
                  ['Price', `$${product.price?.toFixed(2)}`],
                  ['Certificate', 'SHA-256 Cryptographic'],
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid var(--bg-surface)',
                  }}>
                    <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>{k}</span>
                    <span style={{
                      color: k === 'Price' ? 'var(--eth-purple)' : 'var(--text-main)',
                      fontSize: 13, fontWeight: 700,
                    }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={() => setStep(1)}
                style={{ width: '100%', padding: '14px', fontSize: 15 }}>
                Continue →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                Confirm purchase of <strong style={{ color: 'var(--text-main)' }}>{product.title}</strong> for{' '}
                <strong style={{ color: 'var(--eth-purple)' }}>${product.price?.toFixed(2)}</strong>.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(0)} className="btn-outline"
                  style={{ flex: 1, padding: '14px', fontSize: 14 }}>
                  ← Back
                </button>
                <button onClick={handlePurchase} disabled={buying}
                  className="btn-primary"
                  style={{
                    flex: 2, padding: '14px', fontSize: 15,
                    opacity: buying ? 0.6 : 1,
                  }}>
                  {buying ? 'Processing...' : '🔐 Confirm Purchase'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h3 style={{ color: 'var(--text-main)', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                Purchase Successful!
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
                Your cryptographic ownership certificate has been generated. Check your Profile → My Purchases.
              </p>
              <button onClick={() => { onSuccess(); onClose(); }}
                className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15 }}>
                Awesome! 🚀
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const catColors: Record<string, string> = {
  'react-components': '#7C3AED', 'node-packages': '#059669',
  'python-scripts': '#2563EB', 'mobile-templates': '#DC2626',
  'ui-kits': '#D97706', apis: '#0891B2', tools: '#7C3AED',
  blockchain: '#F59E0B', other: '#6B7280',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<{
    id: string; title: string; price: number;
    seller?: { id: string; username: string; reputationScore: number };
    category: string; description: string; tags: string[];
    techStack: string[]; downloadsCount: number;
    reviews?: Array<{
      id: string; rating: number; comment: string | null;
      createdAt: string;
      reviewer: { id: string; username: string; avatarUrl: string | null };
    }>;
    averageRating?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [purchased, setPurchased] = useState(false);
  const [myReview, setMyReview] = useState<{
    id: string; rating: number; comment: string | null;
  } | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    productsAPI.getOne(id!)
      .then((res) => setProduct(res.data.product))
      .catch(() => navigate('/marketplace'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Check if user has already reviewed this product
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    reviewsAPI.getMyReview(id!)
      .then((res) => setMyReview(res.data.data))
      .catch(() => {});
  }, [isAuthenticated, id]);

  const handleSubmitReview = async () => {
    if (!id) return;
    setSubmittingReview(true);
    try {
      if (myReview) {
        await reviewsAPI.update(myReview.id, reviewForm);
      } else {
        const res = await reviewsAPI.create({ productId: id, ...reviewForm });
        setMyReview(res.data.data);
      }
      setReviewForm({ rating: 5, comment: '' });
      // Refresh product to get new reviews
      const res = await productsAPI.getOne(id);
      setProduct(res.data.product);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div style={{
      paddingTop: 72, minHeight: '100vh', background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13,
    }}>
      Loading...
    </div>
  );
  if (!product) return null;

  const isOwner = product.seller?.id === user?.id;
  const color = catColors[product.category] || 'var(--eth-purple)';

  return (
    <>
      <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent' }}>
        <div className="container" style={{ padding: '48px 2rem' }}>
          <button onClick={() => navigate('/marketplace')}
            className="btn-outline"
            style={{ padding: '8px 18px', fontSize: 13, marginBottom: 32 }}>
            ← Back to Marketplace
          </button>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 340px',
            gap: 32, alignItems: 'start',
          }}>
            {/* ─── Main Content ─── */}
            <div>
              <div style={{ marginBottom: 24 }}>
                <span style={{
                  background: `${color}22`, color, padding: '4px 12px', borderRadius: 6,
                  fontSize: 12, fontWeight: 700, marginBottom: 12, display: 'inline-block',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {product.category}
                </span>
                <h1 style={{
                  fontSize: 36, fontWeight: 700, color: 'var(--text-main)',
                  marginBottom: 12, lineHeight: 1.2, letterSpacing: '-0.04em',
                }}>
                  {product.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--eth-purple)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#fff',
                  }}>
                    {product.seller?.username?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>
                    @{product.seller?.username}
                  </span>
                  <span style={{ color: 'var(--text-faint)' }}>·</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 14 }}>
                    ⬇️ {product.downloadsCount} sales
                  </span>
                  {product.averageRating ? (
                    <>
                      <span style={{ color: 'var(--text-faint)' }}>·</span>
                      <span style={{ color: '#f59e0b', fontSize: 14 }}>
                        ★ {product.averageRating.toFixed(1)}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex', gap: 4, background: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)', borderRadius: 12,
                padding: 4, marginBottom: 28, width: 'fit-content',
              }}>
                {['about', 'tech', 'reviews'].map((t) => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{
                    padding: '8px 20px', borderRadius: 8, border: 'none',
                    background: activeTab === t ? 'var(--eth-purple)' : 'transparent',
                    color: activeTab === t ? '#fff' : 'var(--text-muted)',
                    fontWeight: 600, fontSize: 14, cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', textTransform: 'capitalize',
                    transition: 'background 0.2s',
                  }}>
                    {t}
                  </button>
                ))}
              </div>

              {activeTab === 'about' && (
                <div>
                  <p style={{
                    color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.8,
                    marginBottom: 24, whiteSpace: 'pre-line',
                  }}>
                    {product.description}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {product.tags?.map((t: string) => (
                      <span key={t} style={{
                        background: 'var(--bg-panel)', padding: '4px 10px', borderRadius: 6,
                        color: 'var(--text-faint)', fontSize: 13, fontFamily: 'var(--font-mono)',
                      }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'tech' && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {product.techStack?.length > 0 ? (
                    product.techStack.map((t: string) => (
                      <div key={t} style={{
                        background: 'var(--bg-surface)',
                        border: `1px solid ${color}44`, borderRadius: 10,
                        padding: '10px 16px', color, fontWeight: 700, fontSize: 14,
                      }}>
                        {t}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No tech stack listed.</p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  {/* Average Rating */}
                  {product.reviews && product.reviews.length > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      marginBottom: 28, padding: '16px 20px',
                      background: 'var(--bg-surface)', borderRadius: 12,
                      border: '1px solid var(--border-dim)',
                    }}>
                      <div style={{ fontSize: 36, fontWeight: 900, color: '#f59e0b' }}>
                        {product.averageRating?.toFixed(1)}
                      </div>
                      <div>
                        <div style={{ fontSize: 18 }}>
                          {'★'.repeat(Math.round(product.averageRating || 0))}
                          {'☆'.repeat(5 - Math.round(product.averageRating || 0))}
                        </div>
                        <div style={{ color: 'var(--text-faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                          {product.reviews.length} review{product.reviews.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review Form (show if authenticated and purchased) */}
                  {isAuthenticated && (
                    <div style={{
                      marginBottom: 28, padding: '20px 24px',
                      background: 'var(--bg-surface)', borderRadius: 12,
                      border: '1px solid var(--border-dim)',
                    }}>
                      <div style={{
                        color: 'var(--text-main)', fontWeight: 700, fontSize: 15,
                        marginBottom: 12,
                      }}>
                        {myReview ? 'Edit Your Review' : 'Write a Review'}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 24, padding: 2, lineHeight: 1,
                              color: star <= reviewForm.rating ? '#f59e0b' : 'var(--border-dim)',
                              transition: 'color 0.15s',
                            }}>
                            {star <= reviewForm.rating ? '★' : '☆'}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        placeholder="Share your experience with this product..."
                        maxLength={2000}
                        rows={3}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          background: 'var(--bg-panel)', border: '1px solid var(--border-dim)',
                          color: 'var(--text-main)', fontSize: 14, resize: 'vertical',
                          fontFamily: 'inherit', marginBottom: 12,
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>
                          {myReview ? 'Update your review' : 'Only purchasers can review'}
                        </span>
                        <button onClick={handleSubmitReview} disabled={submittingReview}
                          className="btn-primary"
                          style={{
                            padding: '8px 20px', fontSize: 14,
                            opacity: submittingReview ? 0.6 : 1,
                          }}>
                          {submittingReview ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {product.reviews && product.reviews.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {product.reviews.map((rev) => (
                        <div key={rev.id} style={{
                          padding: '16px 20px',
                          background: 'var(--bg-surface)', borderRadius: 12,
                          border: '1px solid var(--border-dim)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 8,
                                background: 'var(--eth-purple)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 800, color: '#fff',
                              }}>
                                {rev.reviewer?.username?.[0]?.toUpperCase()}
                              </div>
                              <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: 14 }}>
                                @{rev.reviewer?.username}
                              </span>
                            </div>
                            <div style={{ color: '#f59e0b', fontSize: 14, letterSpacing: 1 }}>
                              {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                            </div>
                          </div>
                          {rev.comment && (
                            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                              {rev.comment}
                            </p>
                          )}
                          <div style={{
                            color: 'var(--text-faint)', fontSize: 11, fontFamily: 'var(--font-mono)',
                            marginTop: 8,
                          }}>
                            {new Date(rev.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                      <p style={{ fontSize: 40, marginBottom: 12 }}>⭐</p>
                      <p>No reviews yet. Be the first!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Sidebar ─── */}
            <div style={{ position: 'sticky', top: 90 }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border-dim)' }}>
                  <div style={{
                    color: 'var(--text-faint)', fontSize: 12, fontWeight: 600,
                    letterSpacing: 1, textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono)', marginBottom: 8,
                  }}>
                    Price
                  </div>
                  <div style={{
                    fontSize: 42, fontWeight: 900,
                    background: 'linear-gradient(135deg, #a78bfa, var(--eth-purple))',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: 4,
                  }}>
                    ${product.price?.toFixed(2)}
                  </div>
                </div>

                <div style={{
                  padding: '14px 24px', borderBottom: '1px solid var(--border-dim)',
                  background: 'var(--eth-purple-dim)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 18 }}>🔐</span>
                  <div>
                    <div style={{ color: 'var(--eth-purple)', fontSize: 12, fontWeight: 700 }}>
                      SHA-256 Ownership Certificate
                    </div>
                    <div style={{ color: 'var(--text-faint)', fontSize: 11 }}>
                      Permanent · Verifiable
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {isOwner ? (
                    <div style={{
                      textAlign: 'center', padding: '16px',
                      background: 'var(--eth-purple-dim)', borderRadius: 12,
                      color: 'var(--eth-purple)', fontWeight: 700, fontSize: 15,
                    }}>
                      ✅ You own this product
                    </div>
                  ) : purchased ? (
                    <div style={{
                      textAlign: 'center', padding: '16px',
                      background: 'rgba(16, 185, 129, 0.1)', borderRadius: 12,
                      color: 'var(--success-green)', fontWeight: 700, fontSize: 15,
                    }}>
                      🎉 Purchased!
                    </div>
                  ) : !isAuthenticated ? (
                    <button onClick={() => navigate('/login')}
                      className="btn-primary"
                      style={{ width: '100%', padding: '16px', fontSize: 16 }}>
                      Login to Purchase
                    </button>
                  ) : (
                    <button onClick={() => setShowModal(true)}
                      className="btn-primary"
                      style={{
                        width: '100%', padding: '16px', fontSize: 16,
                        boxShadow: '0 4px 24px rgba(98, 126, 234, 0.35)',
                      }}>
                      🔐 Buy Now — ${product.price?.toFixed(2)}
                    </button>
                  )}
                </div>

                <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-dim)' }}>
                  <div style={{
                    color: 'var(--text-faint)', fontSize: 11, fontWeight: 700,
                    letterSpacing: 1, textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono)', marginBottom: 12,
                  }}>
                    Seller
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'var(--eth-purple)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800, color: '#fff',
                    }}>
                      {product.seller?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 15 }}>
                        @{product.seller?.username}
                      </div>
                      <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>
                        ⭐ {product.seller?.reputationScore} reputation
                      </div>
                    </div>
                  </div>
                  {/* Message Seller button — only for non-owners */}
                  {!isOwner && (
                    <div style={{ marginTop: 14 }}>
                      <button
                        onClick={() => {
                          if (!isAuthenticated) return navigate('/login');
                          navigate(`/chat?userId=${product.seller?.id}`);
                        }}
                        className="btn-outline"
                        style={{ width: '100%', padding: '12px', fontSize: 14 }}
                      >
                        💬 Message Seller
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FileManager productId={product.id} isSeller={isOwner} />

      {showModal && (
        <PurchaseModal
          product={product}
          onClose={() => setShowModal(false)}
          onSuccess={() => setPurchased(true)}
        />
      )}
    </>
  );
}
