import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import NotificationBell from './NotificationBell';

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

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'DC';

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `nav-item ${isActive ? 'active' : ''}`;

  return (
    <header className="top-nav">
      <div className="nav-left">
        <Link to="/" className="brand">
          <span className="brand-icon">◆</span>
          DevChain
        </Link>

        <nav className="nav-links" aria-label="Workspace navigation">
          <NavLink to="/marketplace" className={navItemClass}>Marketplace</NavLink>
          <NavLink to="/jobs" className={navItemClass}>Jobs</NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" className={navItemClass} end>Overview</NavLink>
              <NavLink to="/profile" className={navItemClass}>Products</NavLink>
              <NavLink to="/my-jobs" className={navItemClass}>Active Jobs</NavLink>
              <NavLink to="/chat" className={navItemClass}>Messages</NavLink>
              <NavLink to="/analytics" className={navItemClass}>Analytics</NavLink>
            </>
          )}
        </nav>
      </div>

      <div className="nav-right">
        <span className="badge-mono">Local: SQLite</span>

        {isAuthenticated ? (
          <>
            <NotificationBell />
            <Link to="/profile" className="avatar" aria-label="Profile Settings">
              {initials}
            </Link>
            <button className="btn btn-outline nav-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </>
        )}

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
            {isAuthenticated && (
              <>
                <Link to="/dashboard" onClick={closeMobile}>Overview</Link>
                <Link to="/profile" onClick={closeMobile}>Products</Link>
                <Link to="/my-jobs" onClick={closeMobile}>Active Jobs</Link>
                <Link to="/chat" onClick={closeMobile}>Messages</Link>
                <Link to="/analytics" onClick={closeMobile}>Analytics</Link>
              </>
            )}
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
    </header>
  );
}
