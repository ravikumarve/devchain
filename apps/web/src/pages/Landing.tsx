import { Link } from 'react-router-dom';

const features = [
  { icon: '🔐', title: 'Blockchain Ownership', desc: 'Every purchase generates a SHA-256 certificate — permanent, tamper-proof proof of ownership.' },
  { icon: '🛍️', title: 'Code Marketplace', desc: 'Buy and sell templates, components, scripts, and APIs. Ship faster, earn more.' },
  { icon: '💼', title: 'Job Board', desc: 'Post jobs or find freelance work. Hire vetted developers from the DevChain community.' },
  { icon: '⭐', title: 'Reputation System', desc: 'Build your on-chain reputation with every transaction. Trust built on code, not promises.' },
  { icon: '🌍', title: 'Global & Decentralized', desc: 'No middlemen. Direct peer-to-peer transactions between developers worldwide.' },
  { icon: '⚡', title: 'Instant Delivery', desc: 'Get instant access to purchased products with your ownership certificate.' },
];

const stats = [
  { value: '3+', label: 'Products Listed' },
  { value: '2+', label: 'Developers' },
  { value: '3+', label: 'Transactions' },
  { value: '100%', label: 'On-Chain Verified' },
];

export default function Landing() {
  return (
    <div style={styles.container}>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroBadge}>
            <span style={{ color: '#7C3AED' }}>⛓️</span>
            <span>Blockchain-Powered Developer Marketplace</span>
          </div>

          <h1 style={styles.heroTitle}>
            Own Your Code.<br />
            <span style={styles.heroGradient}>Forever.</span>
          </h1>

          <p style={styles.heroDesc}>
            Buy and sell code templates, hire developers, and get blockchain ownership certificates
            for every transaction. The future of developer commerce is here.
          </p>

          <div style={styles.heroBtns}>
            <Link to="/marketplace">
              <button className="btn-primary" style={{ padding: '16px 32px', fontSize: 17, borderRadius: 12 }}>
                Browse Marketplace →
              </button>
            </Link>
            <Link to="/register">
              <button className="btn-secondary" style={{ padding: '16px 32px', fontSize: 17, borderRadius: 12 }}>
                Start Selling
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div style={styles.stats}>
            {stats.map(s => (
              <div key={s.label} style={styles.stat}>
                <div style={styles.statValue}>{s.value}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Glow */}
        <div style={styles.glow} />
      </section>

      {/* Features */}
      <section style={styles.section}>
        <div style={styles.sectionInner}>
          <h2 style={styles.sectionTitle}>Why DevChain?</h2>
          <p style={styles.sectionDesc}>Everything a developer marketplace needs, nothing it doesn't.</p>

          <div style={styles.featuresGrid}>
            {features.map(f => (
              <div key={f.title} className="card" style={styles.featureCard}>
                <div style={styles.featureIcon}>{f.icon}</div>
                <h3 style={styles.featureTitle}>{f.title}</h3>
                <p style={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <div style={styles.ctaInner}>
          <h2 style={styles.ctaTitle}>Ready to own your code?</h2>
          <p style={styles.ctaDesc}>Join DevChain today. Free to join, blockchain-verified forever.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register">
              <button className="btn-primary" style={{ padding: '16px 40px', fontSize: 17, borderRadius: 12 }}>
                Create Free Account
              </button>
            </Link>
            <Link to="/marketplace">
              <button className="btn-secondary" style={{ padding: '16px 40px', fontSize: 17, borderRadius: 12 }}>
                Browse Products
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <span style={{ color: '#7C3AED', fontWeight: 800 }}>⛓️ DevChain</span>
          <span style={{ color: '#55556a' }}>© 2026 DevChain. Own your code, forever.</span>
          <span style={{ color: '#55556a' }}>Built by @ravikumar</span>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh' },
  hero: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 64 },
  heroInner: { maxWidth: 800, margin: '0 auto', padding: '80px 24px', textAlign: 'center', position: 'relative', zIndex: 1 },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1a0a2e', border: '1px solid #7C3AED44', borderRadius: 20, padding: '6px 16px', fontSize: 13, color: '#9898b0', marginBottom: 32 },
  heroTitle: { fontSize: 72, fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing: -2 },
  heroGradient: { background: 'linear-gradient(135deg, #7C3AED, #9F67FF, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroDesc: { fontSize: 20, color: '#9898b0', lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' },
  heroBtns: { display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 },
  stats: { display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap', paddingTop: 48, borderTop: '1px solid #1e1e2e' },
  stat: { textAlign: 'center' },
  statValue: { fontSize: 36, fontWeight: 800, color: '#7C3AED' },
  statLabel: { fontSize: 14, color: '#55556a', marginTop: 4 },
  glow: { position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: 'radial-gradient(circle, #7C3AED22 0%, transparent 70%)', pointerEvents: 'none' },
  section: { padding: '100px 24px', background: '#07070d' },
  sectionInner: { maxWidth: 1200, margin: '0 auto' },
  sectionTitle: { fontSize: 42, fontWeight: 800, textAlign: 'center', marginBottom: 16 },
  sectionDesc: { fontSize: 18, color: '#9898b0', textAlign: 'center', marginBottom: 60 },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 },
  featureCard: { padding: 32 },
  featureIcon: { fontSize: 36, marginBottom: 16 },
  featureTitle: { fontSize: 20, fontWeight: 700, marginBottom: 10 },
  featureDesc: { fontSize: 15, color: '#9898b0', lineHeight: 1.7 },
  cta: { padding: '100px 24px', textAlign: 'center' },
  ctaInner: { maxWidth: 600, margin: '0 auto' },
  ctaTitle: { fontSize: 48, fontWeight: 800, marginBottom: 16 },
  ctaDesc: { fontSize: 18, color: '#9898b0', marginBottom: 40 },
  footer: { borderTop: '1px solid #1e1e2e', padding: '24px', background: '#07070d' },
  footerInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
};
