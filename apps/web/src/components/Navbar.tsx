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

        <div className="nav-cta">
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
      </div>
    </nav>
  );
}
