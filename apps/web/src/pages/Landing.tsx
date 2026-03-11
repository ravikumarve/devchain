import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { productsAPI, jobsAPI } from '../services/api';

const features = [
  { icon: '🔐', title: 'Blockchain Ownership', desc: 'Every purchase generates a SHA-256 certificate — permanent, tamper-proof proof of ownership.' },
  { icon: '🛍️', title: 'Code Marketplace', desc: 'Buy and sell templates, components, scripts, and APIs. Ship faster, earn more.' },
  { icon: '💼', title: 'Developer Jobs', desc: 'Post jobs or find freelance work. Hire vetted developers from the DevChain community.' },
  { icon: '⭐', title: 'Reputation System', desc: 'Build your on-chain reputation with every transaction. Trust built on code, not promises.' },
  { icon: '🌍', title: 'Global & Open', desc: 'No middlemen. Direct peer-to-peer transactions between developers worldwide.' },
  { icon: '⚡', title: 'Instant Access', desc: 'Get instant access to purchased products the moment a transaction is confirmed.' },
];

const steps = [
  { num: '01', title: 'Browse & Discover', desc: 'Explore code templates, tools, and developer assets.', icon: '🔍' },
  { num: '02', title: 'Purchase Securely', desc: 'Buy with confidence. Your payment is processed instantly.', icon: '💳' },
  { num: '03', title: 'Get Your Certificate', desc: 'Receive a unique SHA-256 blockchain ownership certificate instantly.', icon: '🔐' },
  { num: '04', title: 'Own It Forever', desc: 'Your ownership is permanent, verifiable, and tamper-proof on DevChain.', icon: '♾️' },
];

const catColors: Record<string, string> = {
  'react-components': '#7C3AED', 'node-packages': '#059669',
  'python-scripts': '#2563EB', 'mobile-templates': '#DC2626',
  'ui-kits': '#D97706', 'apis': '#0891B2', 'tools': '#7C3AED',
  'blockchain': '#F59E0B', 'other': '#6B7280',
};

const TICKER_ITEMS = ['React', 'Node.js', 'Python', 'TypeScript', 'Solidity', 'FastAPI', 'Vue', 'Next.js', 'GraphQL', 'Docker', 'Rust', 'Go', 'Tailwind', 'Prisma', 'PostgreSQL', 'MongoDB'];

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

function StatItem({ value, label, prefix = '', suffix = '' }: { value: number; label: string; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(value, 1800, started);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '0 40px', borderRight: '1px solid #1e1e2e' }}>
      <div style={{ fontSize: 38, fontWeight: 900, color: '#7C3AED', lineHeight: 1 }}>{prefix}{count}{suffix}</div>
      <div style={{ fontSize: 13, color: '#55556a', marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [certVisible, setCertVisible] = useState(false);

  useEffect(() => {
    productsAPI.getAll({ limit: 3 }).then(res => setProducts(res.data.products || [])).catch(() => {});
    jobsAPI.getAll({ limit: 3 }).then(res => setJobs(res.data.jobs || [])).catch(() => {});
    const t = setTimeout(() => setCertVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 64 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#1e1e2e22 1px, transparent 1px), linear-gradient(90deg, #1e1e2e22 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 800, background: 'radial-gradient(circle, #7C3AED1a 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, background: 'radial-gradient(circle, #9F67FF0d 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>

          {/* Animated badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a0a2e', border: '1px solid #7C3AED55', borderRadius: 20, padding: '6px 18px', fontSize: 13, color: '#9898b0', marginBottom: 36, animation: 'fadeDown 0.6s ease forwards' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, background: '#059669', borderRadius: '50%', boxShadow: '0 0 8px #059669' }} />
            <span>Blockchain-Powered Developer Marketplace</span>
            <span style={{ background: '#7C3AED', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>LIVE</span>
          </div>

          <h1 style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 900, lineHeight: 1.02, marginBottom: 28, letterSpacing: -3, animation: 'fadeUp 0.7s ease 0.1s both' }}>
            Own Your Code.<br />
            <span style={{ background: 'linear-gradient(135deg, #7C3AED, #9F67FF, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Forever.</span>
          </h1>

          <p style={{ fontSize: 20, color: '#9898b0', lineHeight: 1.75, marginBottom: 44, maxWidth: 620, margin: '0 auto 44px', animation: 'fadeUp 0.7s ease 0.2s both' }}>
            Buy and sell code templates, hire developers, and get <strong style={{ color: '#a78bfa' }}>blockchain ownership certificates</strong> for every transaction.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 72, animation: 'fadeUp 0.7s ease 0.3s both' }}>
            <Link to="/marketplace">
              <button className="btn-primary" style={{ padding: '16px 36px', fontSize: 17, borderRadius: 12, fontWeight: 800, boxShadow: '0 4px 32px rgba(124,58,237,0.4)' }}>
                Browse Marketplace →
              </button>
            </Link>
            <Link to="/sell">
              <button style={{ padding: '16px 36px', fontSize: 17, borderRadius: 12, background: 'transparent', border: '1px solid #2a2a3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#7C3AED')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a3e')}>
                Start Selling 💰
              </button>
            </Link>
          </div>

          {/* Stats with count-up */}
          <div style={{ display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap', paddingTop: 48, borderTop: '1px solid #1e1e2e' }}>
            <StatItem value={3} label="Products Listed" suffix="+" />
            <StatItem value={2} label="Developers" suffix="+" />
            <StatItem value={3} label="Transactions" suffix="+" />
            <StatItem value={100} label="On-Chain Verified" suffix="%" />
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ background: '#07070d', borderTop: '1px solid #1e1e2e', borderBottom: '1px solid #1e1e2e', padding: '14px 0', overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'flex', gap: 0, animation: 'ticker 30s linear infinite', width: 'max-content' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{ padding: '0 28px', color: '#55556a', fontSize: 13, fontWeight: 600, borderRight: '1px solid #1e1e2e', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#7C3AED', marginRight: 8 }}>◆</span>{item}
            </span>
          ))}
        </div>
      </div>

      {/* LIVE PRODUCTS */}
      {products.length > 0 && (
        <section style={{ padding: '80px 24px', background: '#07070d' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <div>
                <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>🔥 Live on DevChain</h2>
                <p style={{ color: '#9898b0', fontSize: 16 }}>Real products. Real ownership certificates.</p>
              </div>
              <Link to="/marketplace" style={{ color: '#7C3AED', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>View all →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {products.map(p => {
                const color = catColors[p.category] || '#7C3AED';
                return (
                  <div key={p.id} onClick={() => navigate(`/product/${p.id}`)}
                    style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED55'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ background: color + '22', color, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{p.category}</span>
                      <span style={{ fontSize: 22, fontWeight: 900, color: '#7C3AED' }}>${p.price?.toFixed(2)}</span>
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#fff' }}>{p.title}</h3>
                    <p style={{ fontSize: 13, color: '#9898b0', lineHeight: 1.6, marginBottom: 14 }}>{p.description?.slice(0, 90)}...</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#55556a' }}>@{p.seller?.username}</span>
                      <span style={{ fontSize: 12, background: '#05966911', color: '#059669', border: '1px solid #05966933', padding: '2px 8px', borderRadius: 6 }}>🔐 Cert included</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* LIVE JOBS */}
      {jobs.length > 0 && (
        <section style={{ padding: '80px 24px', background: '#030308' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <div>
                <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>💼 Open Jobs</h2>
                <p style={{ color: '#9898b0', fontSize: 16 }}>Find your next freelance project on DevChain.</p>
              </div>
              <Link to="/jobs" style={{ color: '#059669', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {jobs.map(j => (
                <div key={j.id} onClick={() => navigate(`/job/${j.id}`)}
                  style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 14, padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#05966933'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{j.title}</h3>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ color: '#55556a', fontSize: 13 }}>@{j.client?.username}</span>
                      <span style={{ color: '#55556a', fontSize: 13 }}>·</span>
                      <span style={{ color: '#55556a', fontSize: 13 }}>📋 {j.proposalCount || 0} proposals</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>${j.budgetMin}–${j.budgetMax}</span>
                    <span style={{ background: '#05966922', color: '#059669', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>Open</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CERTIFICATE DEMO */}
      <section style={{ padding: '100px 24px', background: '#07070d' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#7C3AED', fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Blockchain Ownership</div>
            <h2 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.2, marginBottom: 20 }}>Every purchase,<br />verified forever.</h2>
            <p style={{ fontSize: 16, color: '#9898b0', lineHeight: 1.8, marginBottom: 28 }}>
              When you buy on DevChain, a unique SHA-256 certificate is generated and permanently linked to your account. No one can take it away. No expiry. No exceptions.
            </p>
            {[['🔐', 'Cryptographic SHA-256 hash'], ['✅', 'Permanent on-chain record'], ['🔍', 'Publicly verifiable'], ['⚡', 'Instant generation']].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ color: '#ccc', fontSize: 15 }}>{text}</span>
              </div>
            ))}
            <Link to="/marketplace" style={{ display: 'inline-block', marginTop: 24 }}>
              <button className="btn-primary" style={{ padding: '14px 28px', fontSize: 15, borderRadius: 10 }}>
                Get Your First Certificate →
              </button>
            </Link>
          </div>

          <div style={{ opacity: certVisible ? 1 : 0, transform: certVisible ? 'translateY(0) rotate(-1deg)' : 'translateY(24px)', transition: 'all 0.8s ease' }}>
            <div style={{ background: '#0a0a12', border: '1px solid #7C3AED44', borderRadius: 20, padding: 28, boxShadow: '0 0 80px rgba(124,58,237,0.18), 0 0 0 1px #7C3AED11' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ color: '#7C3AED', fontSize: 11, fontWeight: 800, letterSpacing: 2 }}>🔐 DEVCHAIN CERTIFICATE</div>
                <div style={{ background: '#05966922', color: '#059669', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: '#059669', borderRadius: '50%', display: 'inline-block' }} />✓ VERIFIED
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: '#55556a', fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>PRODUCT</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>React Dashboard Template</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: '#55556a', fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>OWNER</div>
                <div style={{ color: '#a78bfa', fontWeight: 700 }}>@ravikumar</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#55556a', fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>OWNERSHIP HASH</div>
                <div style={{ background: '#07070d', border: '1px solid #1e1e2e', borderRadius: 10, padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7C3AED', wordBreak: 'break-all', lineHeight: 1.8 }}>
                  sha256:a3f8c2d1e9b4f7a2c8d3e1f9b2a4c7d8e3f1a2b4c7d9e2f4a1b3c6d8e1f3a5b7
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Amount', '$29.99'], ['Date', '2026-03-11'], ['Block', '#8,847,291'], ['Network', 'DevChain']].map(([k, v]) => (
                  <div key={k} style={{ background: '#07070d', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ color: '#55556a', fontSize: 10, marginBottom: 3 }}>{k}</div>
                    <div style={{ color: '#ccc', fontSize: 13, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '100px 24px', background: '#030308' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, textAlign: 'center', marginBottom: 16 }}>How It Works</h2>
          <p style={{ fontSize: 18, color: '#9898b0', textAlign: 'center', marginBottom: 64 }}>Four steps to owning your code forever.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {steps.map((step) => (
              <div key={step.num} style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 28, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED44'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', letterSpacing: 2, marginBottom: 16 }}>{step.num}</div>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{step.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#fff' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#9898b0', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '100px 24px', background: '#07070d' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, textAlign: 'center', marginBottom: 16 }}>Why DevChain?</h2>
          <p style={{ fontSize: 18, color: '#9898b0', textAlign: 'center', marginBottom: 64 }}>Everything a developer marketplace needs, nothing it doesn't.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {features.map(f => (
              <div key={f.title} style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 32, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED33'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: '#fff' }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: '#9898b0', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '120px 24px', textAlign: 'center', background: '#030308', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, #7C3AED18 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>🔐</div>
          <h2 style={{ fontSize: 52, fontWeight: 900, marginBottom: 20, lineHeight: 1.1, letterSpacing: -2 }}>Ready to own<br />your code?</h2>
          <p style={{ fontSize: 18, color: '#9898b0', marginBottom: 44, lineHeight: 1.7 }}>Join DevChain today. Free to join, blockchain-verified forever.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register">
              <button className="btn-primary" style={{ padding: '18px 44px', fontSize: 18, borderRadius: 14, fontWeight: 800, boxShadow: '0 4px 40px rgba(124,58,237,0.45)' }}>
                Create Free Account →
              </button>
            </Link>
            <Link to="/marketplace">
              <button style={{ padding: '18px 44px', fontSize: 18, borderRadius: 14, background: 'transparent', border: '1px solid #2a2a3e', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Browse Products
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1e1e2e', padding: '32px 24px', background: '#030308' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#7C3AED', fontWeight: 900, fontSize: 18 }}>⛓️ DevChain</span>
            <span style={{ color: '#55556a', fontSize: 13 }}>— Own your code, forever.</span>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            {[['Marketplace', '/marketplace'], ['Jobs', '/jobs'], ['Sell', '/sell'], ['Login', '/login']].map(([label, href]) => (
              <Link key={label} to={href} style={{ color: '#55556a', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>{label}</Link>
            ))}
          </div>
          <span style={{ color: '#55556a', fontSize: 13 }}>© 2026 DevChain</span>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}
