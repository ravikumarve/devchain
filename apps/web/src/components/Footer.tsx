import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <>
      <footer className="deep-footer">
        <div className="footer-brand">
          <a href="/" className="logo">
            <div className="logo-diamond" />
            DevChain
          </a>
          <p>
            The cryptographic developer marketplace. Every transaction generates
            a verifiable SHA-256 ownership certificate. Where code meets
            commerce.
          </p>
        </div>
        <div className="footer-col">
          <h5>Platform Spec</h5>
          <ul>
            <li><Link to="/marketplace">Marketplace Engine</Link></li>
            <li><Link to="/sell">Seller Dashboard</Link></li>
            <li><Link to="/jobs">Job Board</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Development</h5>
          <ul>
            <li><a href="https://github.com/ravikumarve/devchain">GitHub Repository</a></li>
            <li><a href="https://devchain.onrender.com/api/v1">Live REST API</a></li>
            <li><a href="/docs/CONTRIBUTING.md">Contribution Guide</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>Ecosystem</h5>
          <ul>
            <li><a href="https://devchain-app.vercel.app">Web Application (React 19)</a></li>
            <li><a href="#">Mobile Application (Expo)</a></li>
            <li><a href="https://github.com/ravikumarve/devchain/blob/main/LICENSE">MIT License</a></li>
          </ul>
        </div>
      </footer>
      <div className="footer-bottom">
        <div>© 2026 DEVCHAIN. LICENSED UNDER MIT.</div>
        <div>
          <span style={{ color: 'var(--success-green)' }}>●</span> ALL SYSTEMS
          NOMINAL
        </div>
      </div>
    </>
  );
}
