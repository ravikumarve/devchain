import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="app-nav">
      <div className="nav-inner">
        <Link to="/" className="logo">
          <div className="logo-diamond" />
          DevChain
        </Link>

        <div className="nav-links">
          <Link to="/marketplace">Marketplace</Link>
          <Link to="/jobs">Jobs</Link>
          {isAuthenticated && <Link to="/profile">Profile</Link>}
        </div>

        <div className="nav-cta desktop-only">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="nav-username">
                @{user?.username}
              </Link>
              <button className="btn-outline" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline">Sign In</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`hamburger ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={closeMobile}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            <Link to="/marketplace" onClick={closeMobile}>Marketplace</Link>
            <Link to="/jobs" onClick={closeMobile}>Jobs</Link>
            {isAuthenticated && <Link to="/profile" onClick={closeMobile}>Profile</Link>}
            <div className="mobile-menu-divider" />
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="mobile-user" onClick={closeMobile}>
                  @{user?.username}
                </Link>
                <button className="btn-outline" onClick={handleLogout} style={{ width: '100%', padding: '14px', fontSize: 14 }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline" onClick={closeMobile} style={{ width: '100%', padding: '14px', fontSize: 14, textAlign: 'center' }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary" onClick={closeMobile} style={{ width: '100%', padding: '14px', fontSize: 14, textAlign: 'center' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
