import { useNavigate } from 'react-router-dom';

export default function PurchaseCancel() {
  const navigate = useNavigate();

  return (
    <div className="workspace" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 500, width: '100%', margin: '0 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>😢</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-main)', marginBottom: 16, letterSpacing: '-0.02em' }}>Purchase Cancelled</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32, fontFamily: 'var(--font-mono)' }}>
          Your purchase was not completed. No charges have been made to your account. Feel free to continue browsing our marketplace for other great products.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/marketplace')} style={{ width: '100%', padding: '14px', fontSize: 15 }}>
          Back to Marketplace
        </button>
      </div>
    </div>
  );
}
