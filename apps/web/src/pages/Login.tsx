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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>⛓️ DevChain</div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to your DevChain account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ravi@devchain.app" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-primary" style={styles.submit} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={styles.switch}>
          Don't have an account? <Link to="/register" style={{ color: '#7C3AED', fontWeight: 600 }}>Sign Up</Link>
        </p>
      </div>
      <div style={styles.glow} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' },
  card: { background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 20, padding: 48, width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 },
  logo: { fontSize: 28, fontWeight: 800, color: '#7C3AED', textAlign: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#9898b0', textAlign: 'center', marginBottom: 32, fontSize: 15 },
  error: { background: '#1a0a0a', border: '1px solid #DC2626', borderRadius: 10, padding: 12, color: '#DC2626', fontSize: 14, marginBottom: 20, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: '#9898b0' },
  submit: { width: '100%', padding: '14px', fontSize: 16, marginTop: 8 },
  switch: { textAlign: 'center', marginTop: 24, color: '#9898b0', fontSize: 14 },
  glow: { position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, background: 'radial-gradient(circle, #7C3AED18 0%, transparent 70%)', pointerEvents: 'none' },
};
