import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { productsAPI, jobsAPI } from '../services/api';
import BlockchainSphere from '../components/BlockchainSphere';
import CryptoTerminal from '../components/CryptoTerminal';
import BentoGrid from '../components/BentoGrid';
import ApiReference from '../components/ApiReference';
import CtaBand from '../components/CtaBand';
import Footer from '../components/Footer';

interface LProductData {
  id: string;
  title: string;
  description?: string;
  price?: number;
  category: string;
  seller?: { username: string };
}

interface LJobData {
  id: string;
  title: string;
  budgetMin: number;
  budgetMax: number;
  proposalCount?: number;
  client?: { username: string };
}

const TICKER_ITEMS = [
  'React', 'Node.js', 'Python', 'TypeScript', 'Solidity', 'FastAPI',
  'Vue', 'Next.js', 'GraphQL', 'Docker', 'Rust', 'Go', 'Tailwind',
  'Prisma', 'PostgreSQL', 'MongoDB',
];

const catColors: Record<string, string> = {
  'react-components': '#7C3AED', 'node-packages': '#059669',
  'python-scripts': '#2563EB', 'mobile-templates': '#DC2626',
  'ui-kits': '#D97706', 'apis': '#0891B2', 'tools': '#7C3AED',
  'blockchain': '#F59E0B', 'other': '#6B7280',
};

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function StatItem({
  value, label, prefix = '', suffix = '',
}: {
  value: number; label: string; prefix?: string; suffix?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(value, 1800, started);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true); },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        textAlign: 'center',
        padding: '0 40px',
        borderRight: '1px solid var(--border-dim)',
      }}
    >
      <div style={{ fontSize: 38, fontWeight: 900, color: 'var(--eth-purple)', lineHeight: 1 }}>
        {prefix}{count}{suffix}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<LProductData[]>([]);
  const [jobs, setJobs] = useState<LJobData[]>([]);
  const [certVisible, setCertVisible] = useState(false);

  useEffect(() => {
    productsAPI.getAll({ limit: 3 })
      .then(res => setProducts(res.data.products || []))
      .catch(() => {});
    jobsAPI.getAll({ limit: 3 })
      .then(res => setJobs(res.data.jobs || []))
      .catch(() => {});
    const t = setTimeout(() => setCertVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ─── 3D Blockchain Sphere ─── */}
      <BlockchainSphere />
      <div className="ambient-core" />

      <div className="container">
        {/* ─── HERO ─── */}
        <section className="landing-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span
                style={{
                  display: 'inline-block', width: 6, height: 6,
                  background: 'var(--eth-purple)', borderRadius: '50%',
                  boxShadow: '0 0 10px var(--eth-purple)',
                }}
              />
              183 Tests Passing · Production Ready
            </div>
            <h1>
              The SHA-256 Verified <br />Developer Economy.
            </h1>
            <p>
              DevChain is a next-generation marketplace where developers can
              sell digital products, offer services, and connect with
              clients—all secured by verifiable cryptographic ownership
              certificates.
            </p>
            <div
              style={{
                display: 'flex', gap: '1rem', marginBottom: '4rem',
                flexWrap: 'wrap', justifyContent: 'center',
              }}
            >
              <Link to="/marketplace" className="btn btn-primary">
                Browse Marketplace
              </Link>
              <a
                href="https://github.com/ravikumarve/devchain"
                className="btn btn-outline"
              >
                View GitHub
              </a>
            </div>
          </div>

          <CryptoTerminal />
        </section>

        {/* ─── TICKER ─── */}
        <div
          style={{
            background: 'var(--bg-void)',
            borderTop: '1px solid var(--border-dim)',
            borderBottom: '1px solid var(--border-dim)',
            padding: '14px 0',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 0,
              animation: 'ticker 30s linear infinite',
              width: 'max-content',
            }}
          >
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span
                key={i}
                style={{
                  padding: '0 28px',
                  color: 'var(--text-faint)',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRight: '1px solid var(--border-dim)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: 'var(--eth-purple)', marginRight: 8 }}>
                  ◆
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ─── BENTO MATRIX ─── */}
        <section className="section-matrix" id="marketplace">
          <div className="matrix-header">
            <h2>
              Built for the <span className="text-purple">Creator Economy.</span>
            </h2>
            <p>
              DevChain provides end-to-end infrastructure for independent
              developers to monetize their code, tools, and expertise safely.
            </p>
          </div>
          <BentoGrid />
        </section>

        {/* ─── LIVE PRODUCTS ─── */}
        {products.length > 0 && (
          <section
            style={{
              padding: '6rem 0',
              borderBottom: '1px solid var(--border-dim)',
            }}
          >
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 40,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 36, fontWeight: 700, marginBottom: 8,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    🔥 Live on DevChain
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                    Real products. Real ownership certificates.
                  </p>
                </div>
                <Link
                  to="/marketplace"
                  style={{
                    color: 'var(--eth-purple)',
                    fontWeight: 700,
                    fontSize: 15,
                    fontFamily: 'var(--font-mono)',
                    textDecoration: 'none',
                  }}
                >
                  View all →
                </Link>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 20,
                }}
              >
                {products.map((p) => {
                  const color = catColors[p.category] || 'var(--eth-purple)';
                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/product/${p.id}`)}
                      className="card"
                      style={{ cursor: 'pointer' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 14,
                        }}
                      >
                        <span
                          style={{
                            background: `${color}22`,
                            color,
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {p.category}
                        </span>
                        <span
                          style={{
                            fontSize: 22,
                            fontWeight: 900,
                            color: 'var(--eth-purple)',
                          }}
                        >
                          ${p.price?.toFixed(2)}
                        </span>
                      </div>
                      <h3
                        style={{
                          fontSize: 17, fontWeight: 700, marginBottom: 8,
                          color: 'var(--text-main)',
                        }}
                      >
                        {p.title}
                      </h3>
                      <p
                        style={{
                          fontSize: 13, color: 'var(--text-muted)',
                          lineHeight: 1.6, marginBottom: 14,
                        }}
                      >
                        {p.description?.slice(0, 90)}...
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>
                          @{p.seller?.username}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            background: 'rgba(16, 185, 129, 0.07)',
                            color: 'var(--success-green)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}
                        >
                          🔐 Cert included
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ─── LIVE JOBS ─── */}
        {jobs.length > 0 && (
          <section
            style={{
              padding: '6rem 0',
              borderBottom: '1px solid var(--border-dim)',
            }}
          >
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 40,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 36, fontWeight: 700, marginBottom: 8,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    💼 Open Jobs
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                    Find your next freelance project on DevChain.
                  </p>
                </div>
                <Link
                  to="/jobs"
                  style={{
                    color: 'var(--success-green)',
                    fontWeight: 700,
                    fontSize: 15,
                    fontFamily: 'var(--font-mono)',
                    textDecoration: 'none',
                  }}
                >
                  View all →
                </Link>
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                {jobs.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => navigate(`/job/${j.id}`)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: 14,
                      padding: '20px 24px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16,
                      flexWrap: 'wrap',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-dim)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: 16, fontWeight: 700,
                          color: 'var(--text-main)', marginBottom: 6,
                        }}
                      >
                        {j.title}
                      </h3>
                      <div
                        style={{
                          display: 'flex', gap: 12, alignItems: 'center',
                        }}
                      >
                        <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>
                          @{j.client?.username}
                        </span>
                        <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>
                          ·
                        </span>
                        <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>
                          📋 {j.proposalCount || 0} proposals
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 18, fontWeight: 800,
                          color: 'var(--success-green)',
                        }}
                      >
                        ${j.budgetMin}–${j.budgetMax}
                      </span>
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.13)',
                          color: 'var(--success-green)',
                          padding: '4px 12px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Open
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── STATS ─── */}
        <section
          style={{
            padding: '6rem 0',
            borderBottom: '1px solid var(--border-dim)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 0,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <StatItem value={products.length} label="Products Listed" suffix="+" />
            <StatItem value={jobs.length} label="Open Jobs" suffix="+" />
            <StatItem value={100} label="SHA-256 Verified" suffix="%" />
          </div>
        </section>

        {/* ─── CERTIFICATE DEMO ─── */}
        <section
          style={{
            padding: '10rem 0',
            borderBottom: '1px solid var(--border-dim)',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 64,
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  color: 'var(--eth-purple)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 16,
                }}
              >
                Cryptographic Ownership
              </div>
              <h2
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  marginBottom: 20,
                  letterSpacing: '-0.04em',
                }}
              >
                Every purchase,<br />
                verified forever.
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: 'var(--text-muted)',
                  lineHeight: 1.8,
                  marginBottom: 28,
                }}
              >
                When you buy on DevChain, a unique SHA-256 certificate is
                generated and permanently linked to your account. No one can
                take it away. No expiry. No exceptions.
              </p>
              {[
                ['🔐', 'Cryptographic SHA-256 hash'],
                ['✅', 'Permanent verifiable record'],
                ['🔍', 'Publicly verifiable'],
                ['⚡', 'Instant generation'],
              ].map(([icon, text]) => (
                <div
                  key={text as string}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{icon as string}</span>
                  <span style={{ color: '#ccc', fontSize: 15 }}>
                    {text as string}
                  </span>
                </div>
              ))}
              <Link to="/marketplace" style={{ display: 'inline-block', marginTop: 24 }}>
                <button
                  className="btn-primary"
                  style={{ padding: '14px 28px', fontSize: 15 }}
                >
                  Get Your First Certificate →
                </button>
              </Link>
            </div>

            <div
              style={{
                opacity: certVisible ? 1 : 0,
                transform: certVisible
                  ? 'translateY(0) rotate(-1deg)'
                  : 'translateY(24px)',
                transition: 'all 0.8s ease',
              }}
            >
              <div
                style={{
                  background: '#0a0a12',
                  border: '1px solid rgba(98, 126, 234, 0.27)',
                  borderRadius: 20,
                  padding: 28,
                  boxShadow:
                    '0 0 80px rgba(98, 126, 234, 0.18), 0 0 0 1px rgba(98, 126, 234, 0.07)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      color: 'var(--eth-purple)',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 2,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    🔐 DEVCHAIN CERTIFICATE
                  </div>
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.13)',
                      color: 'var(--success-green)',
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        background: 'var(--success-green)',
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                    />
                    ✓ VERIFIED
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      color: 'var(--text-faint)',
                      fontSize: 10,
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}
                  >
                    PRODUCT
                  </div>
                  <div
                    style={{
                      color: 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    React Dashboard Template
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      color: 'var(--text-faint)',
                      fontSize: 10,
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}
                  >
                    OWNER
                  </div>
                  <div style={{ color: '#a78bfa', fontWeight: 700 }}>
                    @ravikumar
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      color: 'var(--text-faint)',
                      fontSize: 10,
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}
                  >
                    OWNERSHIP HASH
                  </div>
                  <div
                    style={{
                      background: 'var(--bg-void)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--eth-purple)',
                      wordBreak: 'break-all',
                      lineHeight: 1.8,
                    }}
                  >
                    sha256:a3f8c2d1e9b4f7a2c8d3e1f9b2a4c7d8e3f1a2b4c7d9e2f4a1b3c6d8e1f3a5b7
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  {[
                    ['Amount', '$29.99'],
                    ['Date', '2026-06-18'],
                    ['Block', '#8,847,291'],
                    ['Network', 'DevChain'],
                  ].map(([k, v]) => (
                    <div
                      key={k as string}
                      style={{
                        background: 'var(--bg-void)',
                        borderRadius: 8,
                        padding: '8px 12px',
                      }}
                    >
                      <div
                        style={{
                          color: 'var(--text-faint)',
                          fontSize: 10,
                          marginBottom: 3,
                        }}
                      >
                        {k as string}
                      </div>
                      <div
                        style={{
                          color: '#ccc',
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {v as string}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── ARCHITECTURE ─── */}
        <section className="section-architecture" id="architecture">
          <div className="arch-columns">
            <div className="arch-info">
              <h2>
                Full-Stack <br />
                <span className="text-purple">TypeScript.</span>
              </h2>
              <p>
                DevChain is engineered with end-to-end type safety, robust
                relational database modeling, and scalable cloud infrastructure.
                The backend API is rigorously protected by 183 integration tests
                across 14 distinct test suites.
              </p>

              <div className="tech-stack-card" style={{ marginTop: '4rem' }}>
                <h3>Infrastructure Stack</h3>
                <ul className="stack-list">
                  <li>
                    Frontend Web <span>React 19 + TypeScript + Vite</span>
                  </li>
                  <li>
                    Mobile Client <span>React Native + Expo</span>
                  </li>
                  <li>
                    Backend API Engine <span>Node.js + Express</span>
                  </li>
                  <li>
                    Relational Database <span>PostgreSQL + Prisma</span>
                  </li>
                  <li>
                    File Asset Storage <span>Supabase Storage</span>
                  </li>
                  <li>
                    Secure Auth <span>JWT + bcrypt</span>
                  </li>
                  <li>
                    Cloud Deployment <span>Vercel + Render</span>
                  </li>
                </ul>
              </div>
            </div>

            <ApiReference />
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section
          style={{
            padding: '10rem 0',
            borderBottom: '1px solid var(--border-dim)',
          }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 42,
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: 16,
                letterSpacing: '-0.04em',
              }}
            >
              How It Works
            </h2>
            <p
              style={{
                fontSize: 18,
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginBottom: 64,
              }}
            >
              Four steps to owning your code forever.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 24,
              }}
            >
              {[
                {
                  num: '01', icon: '🔍', title: 'Browse & Discover',
                  desc: 'Explore code templates, tools, and developer assets.',
                },
                {
                  num: '02', icon: '💳', title: 'Purchase Securely',
                  desc: 'Buy with confidence. Your payment is processed instantly via Stripe.',
                },
                {
                  num: '03', icon: '🔐', title: 'Get Your Certificate',
                  desc: 'Receive a unique SHA-256 cryptographic ownership certificate instantly.',
                },
                {
                  num: '04', icon: '♾️', title: 'Own It Forever',
                  desc: 'Your ownership is permanent, verifiable, and tamper-proof.',
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="card"
                  style={{
                    padding: 28,
                    cursor: 'default',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'var(--eth-purple)',
                      letterSpacing: 2,
                      fontFamily: 'var(--font-mono)',
                      marginBottom: 16,
                    }}
                  >
                    {step.num}
                  </div>
                  <div style={{ fontSize: 32, marginBottom: 14 }}>
                    {step.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: 18, fontWeight: 700, marginBottom: 10,
                      color: 'var(--text-main)',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7,
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA BAND ─── */}
        <CtaBand />

        {/* ─── FOOTER ─── */}
        <Footer />
      </div>
    </div>
  );
}
