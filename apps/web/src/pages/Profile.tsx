import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ownershipAPI, jobsAPI, productsAPI } from '../services/api';

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'purchases' | 'sales' | 'products' | 'jobs'>('purchases');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadTab(tab);
  }, [tab, isAuthenticated]);

  const loadTab = async (t: string) => {
    setLoading(true);
    try {
      if (t === 'purchases') {
        const res = await ownershipAPI.myPurchases();
        setPurchases(res.data.purchases || []);
      } else if (t === 'sales') {
        const res = await ownershipAPI.mySales();
        setSales(res.data.sales || []);
      } else if (t === 'products') {
        const res = await productsAPI.getMine();
        setProducts(res.data.products || []);
      } else if (t === 'jobs') {
        const res = await jobsAPI.myJobs();
        setJobs(res.data.jobs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  if (!isAuthenticated) return null;

  return (
    <div style={styles.container}>
      <div style={styles.inner}>

        {/* Profile Header */}
        <div style={styles.profileCard}>
          <div style={styles.avatarWrap}>
            <div style={styles.avatar}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div style={styles.onlineDot} />
          </div>
          <div style={styles.profileInfo}>
            <h1 style={styles.username}>@{user?.username}</h1>
            <p style={styles.email}>{user?.email}</p>
            <div style={styles.repBadge}>
              <span>⭐</span>
              <span>{user?.reputationScore} Reputation Score</span>
            </div>
          </div>
          <button
            className="btn-secondary"
            onClick={handleLogout}
            style={{ marginLeft: 'auto', padding: '10px 20px' }}
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {[
            { key: 'purchases', label: '🧾 My Purchases' },
            { key: 'sales', label: '💰 My Sales' },
            { key: 'products', label: '📦 My Products' },
            { key: 'jobs', label: '💼 My Jobs' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              style={{ ...styles.tab, ...(tab === t.key ? styles.tabActive : {}) }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : tab === 'purchases' ? (
            <PurchasesList purchases={purchases} />
          ) : tab === 'sales' ? (
            <SalesList sales={sales} />
          ) : tab === 'products' ? (
            <ProductsList products={products} />
          ) : (
            <JobsList jobs={jobs} navigate={navigate} />
          )}
        </div>

      </div>
    </div>
  );
}

function PurchasesList({ purchases }: { purchases: any[] }) {
  if (purchases.length === 0) return <Empty icon="🧾" text="No purchases yet" sub="Browse the marketplace to find something amazing" />;
  return (
    <div style={listStyles.list}>
      {purchases.map(p => (
        <div key={p.id} className="card" style={listStyles.item}>
          <div style={listStyles.itemTop}>
            <div>
              <h3 style={listStyles.itemTitle}>{p.product?.title}</h3>
              <p style={listStyles.itemSub}>by @{p.product?.seller?.username} · {new Date(p.purchasedAt).toLocaleDateString()}</p>
            </div>
            <span style={listStyles.amount}>${p.amountPaid?.toFixed(2)}</span>
          </div>
          {p.certificate?.ownershipHash && (
            <div style={listStyles.certBox}>
              <div style={listStyles.certLabel}>🔐 BLOCKCHAIN CERTIFICATE</div>
              <div style={listStyles.certHash}>{p.certificate.ownershipHash}</div>
              <div style={listStyles.certVerify}>
                <a href={`https://devchain.onrender.com${p.certificate.verifyUrl}`} target="_blank" rel="noreferrer" style={{ color: '#7C3AED', fontSize: 12 }}>
                  Verify on-chain →
                </a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SalesList({ sales }: { sales: any[] }) {
  if (!sales.length) return <Empty icon="💰" text="No sales yet" sub="List a product to start earning" />;
  const total = sales.reduce((sum: number, s: any) => sum + (s.amountPaid || 0), 0);
  return (
    <div>
      <div style={listStyles.totalBox}>
        <span style={listStyles.totalLabel}>Total Revenue</span>
        <span style={listStyles.totalValue}>${total.toFixed(2)}</span>
      </div>
      <div style={listStyles.list}>
        {sales.map((s: any) => (
          <div key={s.id} className="card" style={listStyles.item}>
            <div style={listStyles.itemTop}>
              <div>
                <h3 style={listStyles.itemTitle}>{s.product?.title}</h3>
                <p style={listStyles.itemSub}>bought by @{s.buyer?.username} · {new Date(s.purchasedAt).toLocaleDateString()}</p>
              </div>
              <span style={listStyles.amount}>+${s.amountPaid?.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsList({ products }: { products: any[] }) {
  if (!products.length) return <Empty icon="📦" text="No products listed" sub="Start selling your code on DevChain" />;
  return (
    <div style={listStyles.list}>
      {products.map((p: any) => (
        <div key={p.id} className="card" style={listStyles.item}>
          <div style={listStyles.itemTop}>
            <div>
              <h3 style={listStyles.itemTitle}>{p.title}</h3>
              <p style={listStyles.itemSub}>{p.category} · {p.downloadsCount} sales</p>
            </div>
            <span style={listStyles.amount}>${p.price?.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span style={{ ...listStyles.badge, background: p.isActive ? '#05966922' : '#DC262622', color: p.isActive ? '#059669' : '#DC2626' }}>
              {p.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function JobsList({ jobs, navigate }: { jobs: any[]; navigate: any }) {
  if (!jobs.length) return <Empty icon="💼" text="No jobs posted" sub="Post a job to hire DevChain developers" />;
  return (
    <div style={listStyles.list}>
      {jobs.map((j: any) => (
        <div key={j.id} className="card" style={{ ...listStyles.item, cursor: 'pointer' }} onClick={() => navigate(`/job/${j.id}`)}>
          <div style={listStyles.itemTop}>
            <div>
              <h3 style={listStyles.itemTitle}>{j.title}</h3>
              <p style={listStyles.itemSub}>${j.budgetMin}–${j.budgetMax} · {j.proposalCount} proposals</p>
            </div>
            <span style={{ ...listStyles.badge, background: '#05966922', color: '#059669' }}>{j.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ icon, text, sub }: { icon: string; text: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontSize: 20, marginBottom: 8 }}>{text}</h3>
      <p style={{ color: '#9898b0' }}>{sub}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { paddingTop: 64, minHeight: '100vh' },
  inner: { maxWidth: 900, margin: '0 auto', padding: '48px 24px' },
  profileCard: { background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 20, padding: 32, display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32, flexWrap: 'wrap' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #7C3AED, #9F67FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: '#059669', border: '2px solid #0d0d12' },
  profileInfo: { flex: 1 },
  username: { fontSize: 28, fontWeight: 800, marginBottom: 4 },
  email: { color: '#9898b0', fontSize: 15, marginBottom: 10 },
  repBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a1400', border: '1px solid #F59E0B44', borderRadius: 20, padding: '4px 12px', color: '#F59E0B', fontSize: 13, fontWeight: 600 },
  tabs: { display: 'flex', gap: 4, background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 12, padding: 4, marginBottom: 32, flexWrap: 'wrap' },
  tab: { flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: 'transparent', color: '#9898b0', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif', minWidth: 120 },
  tabActive: { background: '#7C3AED', color: '#fff' },
  content: { minHeight: 300 },
  loading: { textAlign: 'center', padding: '60px 0', color: '#9898b0' },
};

const listStyles: Record<string, React.CSSProperties> = {
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  item: { padding: 24 },
  itemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  itemTitle: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  itemSub: { fontSize: 13, color: '#9898b0' },
  amount: { fontSize: 22, fontWeight: 800, color: '#7C3AED', whiteSpace: 'nowrap' },
  certBox: { marginTop: 16, background: '#0a0a12', border: '1px solid #7C3AED33', borderRadius: 10, padding: 14 },
  certLabel: { fontSize: 10, fontWeight: 800, color: '#7C3AED', letterSpacing: 2, marginBottom: 8 },
  certHash: { fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#9F67FF', wordBreak: 'break-all', lineHeight: 1.6 },
  certVerify: { marginTop: 8 },
  totalBox: { background: 'linear-gradient(135deg, #1a0a2e, #0d0d12)', border: '1px solid #7C3AED44', borderRadius: 16, padding: 24, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, color: '#9898b0', fontWeight: 600 },
  totalValue: { fontSize: 40, fontWeight: 900, color: '#7C3AED' },
  badge: { padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 },
};
