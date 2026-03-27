import { useNavigate } from 'react-router-dom';

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

export default function PurchaseCancel() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>😢</div>
        <h1 style={styles.title}>Purchase Cancelled</h1>
        <p style={styles.message}>
          Your purchase was not completed. No charges have been made to your account. Feel free to
          continue browsing our marketplace for other great products.
        </p>
        <button style={styles.button} onClick={() => navigate('/marketplace')}>
          Back to Marketplace
        </button>
      </div>
    </div>
  );
}
