import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PurchaseSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) { navigate('/marketplace'); return; }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); navigate('/marketplace'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate, searchParams]);

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ padding: 48, textAlign: 'center', maxWidth: 500, width: '100%', margin: '0 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)', marginBottom: 16, letterSpacing: '-0.03em' }}>Purchase Successful!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 32, fontFamily: 'var(--font-mono)' }}>
          Thank you for your purchase! Your order has been confirmed and the digital product is now available in your account. You will be redirected to the marketplace in <strong style={{ color: 'var(--eth-purple)' }}>{countdown}</strong> seconds.
        </p>
        <button className="btn-primary" onClick={() => navigate('/marketplace')} style={{ width: '100%', padding: '14px', fontSize: 15 }}>
          Go to Marketplace
        </button>
      </div>
    </div>
  );
}
