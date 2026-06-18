import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

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
              placeholder="ravi@devchain.app" required />
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

        <p style={styles.switch}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--eth-purple)', fontWeight: 600 }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 24, position: 'relative',
    background: 'var(--bg-void)',
  },
  glow: {
    position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 500, height: 500,
    background: 'radial-gradient(circle, rgba(98, 126, 234, 0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
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
    border: '2px solid var(--eth-purple)', transform: 'rotate(45deg)',
    boxShadow: '0 0 15px var(--eth-purple-dim)',
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
    background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)',
    borderRadius: 10, padding: 12, color: '#DC2626', fontSize: 14,
    marginBottom: 20, textAlign: 'center',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  submit: { width: '100%', padding: '14px', fontSize: 16, marginTop: 8 },
  switch: {
    textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: 14,
  },
};
