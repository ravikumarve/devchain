import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const DEMO_ACCOUNTS = [
  { role: 'Seller', email: 'demo-seller@devchain.dev', password: 'Demo1234' },
  { role: 'Client', email: 'demo-client@devchain.dev', password: 'Demo1234' },
  { role: 'Buyer', email: 'demo-buyer@devchain.dev', password: 'Demo1234' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/marketplace');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.glow} />
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.diamond} />
          DevChain
        </div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to your DevChain account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@devchain.dev" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-primary" style={styles.submit} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={styles.demoBox}>
          <div style={styles.demoTitle}>Demo accounts — click to fill</div>
          <div style={styles.demoRow}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                className="btn btn-outline"
                style={styles.demoBtn}
                onClick={() => { setEmail(acc.email); setPassword(acc.password); setError(''); }}
              >
                {acc.role}
              </button>
            ))}
          </div>
          <div style={styles.demoHint}>{DEMO_ACCOUNTS[0].email} · {DEMO_ACCOUNTS[0].password}</div>
        </div>

        <p style={styles.switch}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 24, position: 'relative',
    background: 'transparent',
  },
  glow: {
    position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 500, height: 500,
    background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
    borderRadius: 20, padding: 48, width: '100%', maxWidth: 440,
    position: 'relative', zIndex: 1,
  },
  logo: {
    fontSize: 28, fontWeight: 800, color: 'var(--text-main)',
    textAlign: 'center', marginBottom: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    letterSpacing: '-0.5px',
  },
  diamond: {
    width: 18, height: 18, background: 'transparent',
    border: '2px solid var(--accent-blue)', transform: 'rotate(45deg)',
    boxShadow: '0 0 15px var(--accent-glow)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as React.CSSProperties,
  title: {
    fontSize: 28, fontWeight: 700, textAlign: 'center', marginBottom: 8,
    letterSpacing: '-0.04em',
  },
  subtitle: {
    color: 'var(--text-muted)', textAlign: 'center', marginBottom: 32, fontSize: 15,
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 10, padding: 12, color: 'var(--danger-red)', fontSize: 14,
    marginBottom: 20, textAlign: 'center',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  submit: { width: '100%', padding: '14px', fontSize: 16, marginTop: 8 },
  demoBox: {
    marginTop: 24,
    background: 'var(--bg-void)',
    border: '1px solid var(--accent-glow)',
    borderRadius: 12,
    padding: '14px 16px',
  },
  demoTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
    color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginBottom: 10,
  },
  demoRow: { display: 'flex', gap: 8 },
  demoBtn: {
    flex: 1, padding: '7px 10px', fontSize: 12, fontFamily: 'var(--font-mono)',
  },
  demoHint: {
    marginTop: 10, fontSize: 11, color: 'var(--text-faint)',
    fontFamily: 'var(--font-mono)', textAlign: 'center',
  },
  switch: {
    textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 14,
  },
};
