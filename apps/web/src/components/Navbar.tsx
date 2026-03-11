import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>⛓️</span>
          <span style={styles.logoText}>DevChain</span>
        </Link>

        <div style={styles.links}>
          <Link to="/marketplace" style={styles.link}>Marketplace</Link>
          <Link to="/jobs" style={styles.link}>Jobs</Link>
        </div>

        <div style={styles.actions}>
          {isAuthenticated ? (
            <>
              <span style={styles.username}>@{user?.username}</span>
              <button className="btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: 14 }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 14 }}>Login</button>
              </Link>
              <Link to="/register">
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 14 }}>Sign Up</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(20px)',
    borderBottom: '1px solid #1e1e2e',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px',
    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
  logoIcon: { fontSize: 24 },
  logoText: { fontSize: 20, fontWeight: 800, color: '#7C3AED' },
  links: { display: 'flex', gap: 32 },
  link: { color: '#9898b0', fontWeight: 500, fontSize: 15, transition: 'color 0.2s', textDecoration: 'none' },
  actions: { display: 'flex', alignItems: 'center', gap: 12 },
  username: { color: '#9898b0', fontSize: 14, fontWeight: 500 },
};
