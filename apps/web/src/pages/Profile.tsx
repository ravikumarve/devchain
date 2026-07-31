import { useState, useEffect } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ownershipAPI, jobsAPI, productsAPI, authAPI } from '../services/api';
import EmptyState from '../components/EmptyState';

interface ProductData {
  id: string;
  title: string;
  category: string;
  downloadsCount: number;
  price: number;
  isActive: boolean;
  seller?: { username: string };
  tags?: string[];
  description?: string;
}
interface UserRef { id: string; username: string; reputationScore?: number; }
interface PurchaseData {
  id: string;
  product?: ProductData & { seller?: UserRef };
  purchasedAt: string;
  amountPaid: number;
  certificate?: { ownershipHash: string; verifyUrl: string; };
}
interface SaleData {
  id: string;
  product?: ProductData;
  buyer?: UserRef;
  soldAt?: string;
  purchasedAt?: string;
  amountPaid: number;
}
interface JobData {
  id: string;
  title: string;
  budgetMin: number;
  budgetMax: number;
  proposalCount: number;
  status: string;
  client?: UserRef;
}

type TabKey = 'purchases' | 'sales' | 'products' | 'jobs';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'purchases', label: '🧾 My Purchases' },
  { key: 'sales', label: '💰 My Sales' },
  { key: 'products', label: '📦 My Products' },
  { key: 'jobs', label: '💼 My Jobs' },
];

function dateStr(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    completed: 'Completed',
    closed: 'Closed',
    pending: 'Pending',
    funded: 'Funded',
  };
  return map[status] || status;
}

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('purchases');
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [sales, setSales] = useState<SaleData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Defer past App's sync loadUser() so hard-navigations don't false-redirect
    const t = setTimeout(() => {
      if (!isAuthenticated) navigate('/login');
    }, 0);
    return () => clearTimeout(t);
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    const loaders: Record<TabKey, () => Promise<any>> = {
      purchases: () => ownershipAPI.myPurchases(),
      sales: () => ownershipAPI.mySales(),
      products: () => productsAPI.getMine(),
      jobs: () => jobsAPI.myJobs(),
    };
    loaders[tab]()
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        if (tab === 'purchases') setPurchases(data.purchases || []);
        else if (tab === 'sales') setSales(data.sales || []);
        else if (tab === 'products') setProducts(data.products || []);
        else if (tab === 'jobs') setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      })
      .catch((err) => {
        if (!cancelled) console.error('Profile load error:', err);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tab, isAuthenticated]);

  const handleLogout = () => { logout(); navigate('/'); };
  if (!isAuthenticated) return null;

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div className="dash-title">
          <h1>Profile</h1>
          <p>Your purchases, sales, products, and job listings.</p>
        </div>
        <div className="dash-actions">
          <button className="btn btn-outline" style={{ padding: '0.6rem 1.4rem', fontSize: '0.8rem' }} onClick={handleLogout}>
            Logout
          </button>
          <button className="btn btn-primary" style={{ padding: '0.6rem 1.4rem', fontSize: '0.8rem' }} onClick={() => { setBio(user?.bio || ''); setEditOpen(true); }}>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile header card */}
      <div className="dash-section" style={{ padding: '1.6rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-blue), #60a5fa)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            color: '#fff',
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: 'var(--success-green)', border: '2px solid var(--bg-surface)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>@{user?.username}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.35rem' }}>{user?.email}</p>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.82rem', fontStyle: 'italic', marginBottom: '0.6rem' }}>
            {user?.bio || 'No bio yet'}
          </p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-panel)', border: '1px solid var(--accent-glow)', borderRadius: 20, padding: '0.25rem 0.75rem', color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            ⭐ {user?.reputationScore ?? 0} Reputation Score
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`dash-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setEditOpen(false)}>
          <div className="dash-section" style={{ width: '100%', maxWidth: 480, padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>✏️ Edit Profile</h2>
            <div style={{ marginBottom: '1.1rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Bio</label>
              <textarea
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-solid)',
                  borderRadius: 10,
                  padding: '0.75rem 0.9rem',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  fontFamily: 'var(--font-display)',
                  height: 100,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                maxLength={500}
              />
              <div style={{ fontSize: '0.68rem', color: 'var(--text-faint)', textAlign: 'right', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>{bio.length}/500</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-outline" style={{ flex: 1, padding: '0.75rem', fontSize: '0.88rem' }} onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.88rem', opacity: saving ? 0.6 : 1 }}
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await authAPI.updateProfile({ bio });
                    setEditOpen(false);
                  } catch (err: unknown) {
                    alert('Failed: ' + ((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Unknown error'));
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ minHeight: 300 }}>
        {loading ? (
          <EmptyState icon="⚙️" title="Loading…" description={`Fetching your ${tab}.`} />
        ) : tab === 'purchases' ? (
          <PurchasesList purchases={purchases} />
        ) : tab === 'sales' ? (
          <SalesList sales={sales} />
        ) : tab === 'products' ? (
          <ProductsList products={products} navigate={navigate} />
        ) : (
          <JobsList jobs={jobs} navigate={navigate} />
        )}
      </div>
    </div>
  );
}

function PurchasesList({ purchases }: { purchases: PurchaseData[] }) {
  if (purchases.length === 0) {
    return <EmptyState icon="🧾" title="No purchases yet" description="Browse the marketplace to find something amazing." />;
  }
  return (
    <div className="dash-section">
      <div className="dash-section-title">My Purchases</div>
      <p className="dash-section-sub">Digital products you own, with SHA-256 ownership certificates</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {purchases.map((p) => (
          <div key={p.id} className="dash-section" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div className="item-primary" style={{ fontSize: '1.05rem' }}>{p.product?.title}</div>
                <div className="item-secondary" style={{ fontFamily: 'var(--font-sans)' }}>
                  by @{p.product?.seller?.username || 'Seller'} · {dateStr(p.purchasedAt)}
                </div>
              </div>
              <span className="val-mono" style={{ fontSize: '1.25rem' }}>${(p.amountPaid || 0).toFixed(2)}</span>
            </div>
            {p.certificate?.ownershipHash && (
              <div className="cert-block" style={{ marginTop: '1rem' }}>
                <div className="cert-label">🔐 SHA-256 CERTIFICATE</div>
                <div className="cert-hash">{p.certificate.ownershipHash}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  <a
                    href={`${window.location.origin}${p.certificate.verifyUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--accent-blue)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
                  >
                    Verify on-chain →
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesList({ sales }: { sales: SaleData[] }) {
  if (sales.length === 0) {
    return <EmptyState icon="💰" title="No sales yet" description="List a product to start earning on DevChain." />;
  }
  const total = sales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
  return (
    <div className="dash-section">
      <div className="dash-section-title">My Sales</div>
      <p className="dash-section-sub">Earnings from your digital products</p>
      <div className="kpi-row" style={{ marginTop: '1rem' }}>
        <div className="kpi-item">
          <span className="kpi-lbl">Total Revenue</span>
          <span className="kpi-val" style={{ color: 'var(--success-green)' }}>${total.toFixed(2)}</span>
          <span className="kpi-sub">{sales.length} sale{sales.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <table className="dash-table" style={{ marginTop: '1.25rem' }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Buyer</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id}>
              <td><span className="item-primary">{s.product?.title || 'Untitled product'}</span></td>
              <td className="item-secondary" style={{ fontFamily: 'var(--font-sans)' }}>@{s.buyer?.username || 'Buyer'}</td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-faint)' }}>{dateStr(s.soldAt || s.purchasedAt)}</td>
              <td className="val-mono" style={{ color: 'var(--success-green)' }}>+${(s.amountPaid || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductsList({ products, navigate }: { products: ProductData[]; navigate: NavigateFunction }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon="📦"
        title="No products listed"
        description="Start selling your code on DevChain."
        actions={[{ label: 'Create Product', onClick: () => navigate('/create-product') }]}
      />
    );
  }
  return (
    <div className="dash-section">
      <div className="dash-section-title">
        My Products
        <span className="dash-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/create-product')}>+ New Product</span>
      </div>
      <p className="dash-section-sub">Everything you're selling in the marketplace</p>
      <table className="dash-table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Sales</th>
            <th>Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/product/${p.id}`)}>
              <td>
                <span className="item-primary">{p.title}</span>
                <span className="item-secondary">{p.tags?.slice(0, 3).join(' · ') || ''}</span>
              </td>
              <td className="item-secondary" style={{ fontFamily: 'var(--font-sans)' }}>{p.category}</td>
              <td className="val-mono">{p.downloadsCount ?? 0}</td>
              <td className="val-mono">${(p.price || 0).toFixed(2)}</td>
              <td>
                <span className={`status-dot ${p.isActive ? 'active' : 'closed'}`}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobsList({ jobs, navigate }: { jobs: JobData[]; navigate: NavigateFunction }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon="💼"
        title="No jobs posted"
        description="Post a job to hire DevChain developers."
        actions={[{ label: 'Post a Job', onClick: () => navigate('/post-job') }]}
      />
    );
  }
  return (
    <div className="dash-section">
      <div className="dash-section-title">My Jobs</div>
      <p className="dash-section-sub">Jobs you've posted for hire</p>
      <table className="dash-table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Job</th>
            <th>Budget</th>
            <th>Proposals</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/job/${j.id}`)}>
              <td><span className="item-primary">{j.title}</span></td>
              <td className="val-mono">${j.budgetMin?.toLocaleString()}–${j.budgetMax?.toLocaleString()}</td>
              <td className="val-mono">{j.proposalCount ?? 0}</td>
              <td><span className={`status-dot ${j.status}`}>{statusBadge(j.status)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
