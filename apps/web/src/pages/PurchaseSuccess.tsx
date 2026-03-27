import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const styles = {
  container: {
    minHeight: '100vh',
    paddingTop: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f1117 0%, #1a1d28 100%)',
  },
  card: {
    background: '#0d0f17',
    border: '1px solid #1e2433',
    borderRadius: 20,
    padding: '48px',
    textAlign: 'center' as const,
    maxWidth: 500,
    width: '100%',
    margin: '0 20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 900,
    marginBottom: 16,
  },
  message: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 1.6,
    marginBottom: 32,
  },
  button: {
    width: '100%',
    padding: '16px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #7C3AED, #9F67FF)',
    border: 'none',
    color: '#fff',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 24px rgba(124,58,237,0.35)',
  },
};

export default function PurchaseSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/marketplace');
      return;
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/marketplace');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, searchParams]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🎉</div>
        <h1 style={styles.title}>Purchase Successful!</h1>
        <p style={styles.message}>
          Thank you for your purchase! Your order has been confirmed and the digital product is now
          available in your account. You will be redirected to the marketplace in {countdown}{' '}
          seconds.
        </p>
        <button style={styles.button} onClick={() => navigate('/marketplace')}>
          Go to Marketplace
        </button>
      </div>
    </div>
  );
}
