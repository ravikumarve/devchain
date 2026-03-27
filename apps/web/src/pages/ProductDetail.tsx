import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, paymentsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import FileManager from '../components/FileManager';

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#0f1117',
          border: '1px solid #1e2433',
          borderRadius: 20,
          width: '100%',
          maxWidth: 520,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid #1e2433',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                color: '#7C3AED',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              🔐 Purchase
            </div>
            <div style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>{product.title}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#1e2433',
              border: 'none',
              color: '#94a3b8',
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '16px 28px', borderBottom: '1px solid #1e2433', display: 'flex' }}>
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                position: 'relative',
              }}
            >
              {i < steps.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: '50%',
                    width: '100%',
                    height: 2,
                    background: i < step ? '#7C3AED' : '#1e2433',
                  }}
                />
              )}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  zIndex: 1,
                  background: i < step ? '#7C3AED' : '#1e2433',
                  border: `2px solid ${i <= step ? '#7C3AED' : '#2a3044'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: i <= step ? '#94a3b8' : '#374151',
                  textAlign: 'center',
                }}
              >
                {s}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '24px 28px' }}>
          {step === 0 && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
                You're about to purchase <strong style={{ color: '#fff' }}>{product.title}</strong>.
                A unique SHA-256 blockchain ownership certificate will be permanently linked to your
                account.
              </p>
              <div
                style={{
                  background: '#13161e',
                  borderRadius: 12,
                  border: '1px solid #1e2433',
                  padding: '14px 16px',
                  marginBottom: 20,
                }}
              >
                {[
                  ['Product', product.title],
                  ['Price', `$${product.price?.toFixed(2)}`],
                  ['Certificate', 'SHA-256 Blockchain'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px solid #0d0d12',
                    }}
                  >
                    <span style={{ color: '#4b5563', fontSize: 13 }}>{k}</span>
                    <span
                      style={{
                        color: k === 'Price' ? '#7C3AED' : '#e2e8f0',
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
                Confirm purchase of <strong style={{ color: '#fff' }}>{product.title}</strong> for{' '}
                <strong style={{ color: '#7C3AED' }}>${product.price?.toFixed(2)}</strong>.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep(0)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 12,
                    background: '#1e2433',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={buying}
                  style={{
                    flex: 2,
                    padding: '14px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: buying ? 0.6 : 1,
                  }}
                >
                  {buying ? 'Processing...' : '🔐 Confirm Purchase'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
                Purchase Successful!
              </h3>
              <p style={{ color: '#9898b0', fontSize: 14, marginBottom: 20 }}>
                Your blockchain ownership certificate has been generated. Check your Profile → My
                Purchases.
              </p>
              <button
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
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
  'react-components': '#7C3AED',
  'node-packages': '#059669',
  'python-scripts': '#2563EB',
  'mobile-templates': '#DC2626',
  'ui-kits': '#D97706',
  apis: '#0891B2',
  tools: '#7C3AED',
  blockchain: '#F59E0B',
  other: '#6B7280',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<{
    id: string;
    title: string;
    price: number;
    seller?: { id: string; username: string; reputationScore: number };
    category: string;
    description: string;
    tags: string[];
    techStack: string[];
    downloadsCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    productsAPI
      .getOne(id!)
      .then((res) => setProduct(res.data.product))
      .catch(() => navigate('/marketplace'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div
        style={{
          paddingTop: 64,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9898b0',
        }}
      >
        Loading...
      </div>
    );
  if (!product) return null;

  const isOwner = product.seller?.id === user?.id;
  const color = catColors[product.category] || '#7C3AED';

  return (
    <>
      <div style={{ paddingTop: 64, minHeight: '100vh' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
          <button
            onClick={() => navigate('/marketplace')}
            style={{
              background: 'none',
              border: 'none',
              color: '#7C3AED',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 32,
              padding: 0,
            }}
          >
            ← Back to Marketplace
          </button>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 340px',
              gap: 32,
              alignItems: 'start',
            }}
          >
            <div>
              <div style={{ marginBottom: 24 }}>
                <span
                  style={{
                    background: color + '22',
                    color,
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 12,
                    display: 'inline-block',
                  }}
                >
                  {product.category}
                </span>
                <h1
                  style={{
                    fontSize: 36,
                    fontWeight: 900,
                    color: '#fff',
                    marginBottom: 12,
                    lineHeight: 1.2,
                  }}
                >
                  {product.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 800,
                      color: '#fff',
                    }}
                  >
                    {product.seller?.username?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ color: '#9898b0', fontSize: 14 }}>
                    @{product.seller?.username}
                  </span>
                  <span style={{ color: '#55556a' }}>·</span>
                  <span style={{ color: '#55556a', fontSize: 14 }}>
                    ⬇️ {product.downloadsCount} sales
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  background: '#0d0d12',
                  border: '1px solid #1e1e2e',
                  borderRadius: 12,
                  padding: 4,
                  marginBottom: 28,
                  width: 'fit-content',
                }}
              >
                {['about', 'tech', 'reviews'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: activeTab === t ? '#7C3AED' : 'transparent',
                      color: activeTab === t ? '#fff' : '#9898b0',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {activeTab === 'about' && (
                <div>
                  <p
                    style={{
                      color: '#ccc',
                      fontSize: 16,
                      lineHeight: 1.8,
                      marginBottom: 24,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {product.description}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {product.tags?.map((t: string) => (
                      <span
                        key={t}
                        style={{
                          background: '#12121a',
                          padding: '4px 10px',
                          borderRadius: 6,
                          color: '#55556a',
                          fontSize: 13,
                        }}
                      >
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
                      <div
                        key={t}
                        style={{
                          background: '#0d0d12',
                          border: `1px solid ${color}44`,
                          borderRadius: 10,
                          padding: '10px 16px',
                          color,
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {t}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#9898b0' }}>No tech stack listed.</p>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div style={{ color: '#9898b0', textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ fontSize: 40, marginBottom: 12 }}>⭐</p>
                  <p>No reviews yet. Be the first to purchase!</p>
                </div>
              )}
            </div>

            <div style={{ position: 'sticky', top: 90 }}>
              <div
                style={{
                  background: '#0d0f17',
                  border: '1px solid #1e2433',
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 0 60px rgba(124,58,237,0.08)',
                }}
              >
                <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #1e2433' }}>
                  <div
                    style={{
                      color: '#4b5563',
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    Price
                  </div>
                  <div
                    style={{
                      fontSize: 42,
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #a78bfa, #7C3AED)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: 4,
                    }}
                  >
                    ${product.price?.toFixed(2)}
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px 24px',
                    borderBottom: '1px solid #1e2433',
                    background: 'rgba(124,58,237,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 18 }}>🔐</span>
                  <div>
                    <div style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>
                      Blockchain Ownership Certificate
                    </div>
                    <div style={{ color: '#374151', fontSize: 11 }}>
                      SHA-256 · Permanent · Verifiable
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {isOwner ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '16px',
                        background: '#1a0a2e',
                        borderRadius: 12,
                        color: '#7C3AED',
                        fontWeight: 700,
                      }}
                    >
                      ✅ You own this product
                    </div>
                  ) : purchased ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '16px',
                        background: '#0a1a0a',
                        borderRadius: 12,
                        color: '#059669',
                        fontWeight: 700,
                      }}
                    >
                      🎉 Purchased!
                    </div>
                  ) : !isAuthenticated ? (
                    <button
                      onClick={() => navigate('/login')}
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Login to Purchase
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowModal(true)}
                      style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
                      }}
                    >
                      🔐 Buy Now — ${product.price?.toFixed(2)}
                    </button>
                  )}
                </div>

                <div style={{ padding: '20px 24px', borderTop: '1px solid #1e2433' }}>
                  <div
                    style={{
                      color: '#374151',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      marginBottom: 12,
                    }}
                  >
                    Seller
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#fff',
                      }}
                    >
                      {product.seller?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15 }}>
                        @{product.seller?.username}
                      </div>
                      <div style={{ color: '#4b5563', fontSize: 12 }}>
                        ⭐ {product.seller?.reputationScore} reputation
                      </div>
                    </div>
                  </div>
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
