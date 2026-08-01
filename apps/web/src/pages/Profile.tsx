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
  { key: 'purchases', label: 'My Purchases' },
  { key: 'sales', label: 'My Sales' },
  { key: 'products', label: 'My Products' },
  { key: 'jobs', label: 'My Jobs' },
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
    const loaders: Record<TabKey, () => Promise<{ data?: Record<string, unknown> }>> = {
      purchases: () => ownershipAPI.myPurchases(),
      sales: () => ownershipAPI.mySales(),
      products: () => productsAPI.getMine(),
      jobs: () => jobsAPI.myJobs(),
    };
    loaders[tab]()
      .then((res) => {
        if (cancelled) return;
        const data = res.data as Record<string, unknown>;
        if (tab === 'purchases') setPurchases((data.purchases as PurchaseData[]) || []);
        else if (tab === 'sales') setSales((data.sales as SaleData[]) || []);
        else if (tab === 'products') setProducts((data.products as ProductData[]) || []);
        else if (tab === 'jobs') setJobs(Array.isArray(data.jobs) ? (data.jobs as JobData[]) : []);
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
    <div className="workspace">
      <div className="container">
      <div className="page-header">
        <div className="page-title">
          <h1>Profile</h1>
          <p>Your purchases, sales, products, and job listings.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
          <button className="btn btn-primary" onClick={() => { setBio(user?.bio || ''); setEditOpen(true); }}>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile header card (borderless, theme tokens only) */}
      <div className="data-section" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-faint)' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-solid)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            fontFamily: 'var(--font-mono)',
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ position: 'absolute', bottom: 4, right: 4, width: 12, height: 12, borderRadius: '50%', background: 'var(--success-green)', border: '2px solid var(--bg-void)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>@{user?.username}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.35rem' }}>{user?.email}</p>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.82rem', fontStyle: 'italic', marginBottom: '0.6rem' }}>
            {user?.bio || 'No bio yet'}
          </p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--border-solid)', borderRadius: 4, padding: '0.25rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
            {user?.reputationScore ?? 0} Reputation Score
          </span>
        </div>
      </div>

      {/* Tabs — workspace mono underline style */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border-faint)', overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '0.7rem 1.1rem',
              border: 'none',
              background: 'transparent',
              color: tab === t.key ? 'var(--text-main)' : 'var(--text-faint)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              borderBottom: tab === t.key ? '2px solid var(--text-main)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setEditOpen(false)}>
          <div className="data-section" style={{ width: '100%', maxWidth: 480, padding: '1.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-solid)', borderRadius: 8 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>Edit Profile</h2>
            <div style={{ marginBottom: '1.1rem' }}>
              <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Bio</label>
              <textarea
                style={{
                  width: '100%',
                  background: 'var(--bg-void)',
                  border: '1px solid var(--border-solid)',
                  borderRadius: 4,
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
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: 40, height: 40, border: '3px solid var(--border-faint)',
              borderTop: '3px solid var(--text-main)', borderRadius: '50%',
              animation: 'spin 1s linear infinite', margin: '0 auto',
            }} />
            <p style={{ color: 'var(--text-muted)', marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              Loading {tab.replace(/_/g, ' ')}...
            </p>
          </div>
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
    </div>
  );
}

function PurchasesList({ purchases }: { purchases: PurchaseData[] }) {
  if (purchases.length === 0) {
    return <EmptyState icon="◆" title="No purchases yet" description="Browse the marketplace to find something amazing." />;
  }
  return (
    <div className="data-section">
      <div className="section-title">My Purchases</div>
      <p className="dash-section-sub">Digital products you own, with SHA-256 ownership certificates</p>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '1rem' }}>
        {purchases.map((p) => (
          <div key={p.id} style={{ padding: '1.25rem 0', borderBottom: '1px solid var(--border-faint)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div className="item-primary" style={{ fontSize: '1.05rem' }}>{p.product?.title}</div>
                <div className="item-secondary">
                  by @{p.product?.seller?.username || 'Seller'} · {dateStr(p.purchasedAt)}
                </div>
              </div>
              <span className="val-mono" style={{ fontSize: '1.25rem' }}>${(p.amountPaid || 0).toFixed(2)}</span>
            </div>
            {p.certificate?.ownershipHash && (
              <div style={{ marginTop: '1rem', border: '1px solid var(--border-solid)', borderRadius: 4, padding: '0.9rem 1rem' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: 2, color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                  SHA-256 CERTIFICATE
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-faint)', wordBreak: 'break-all', lineHeight: 1.6 }}>
                  {p.certificate.ownershipHash}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <a
                    href={`${window.location.origin}${p.certificate.verifyUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}
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
    return <EmptyState icon="◆" title="No sales yet" description="List a product to start earning on DevChain." />;
  }
  const total = sales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
  return (
    <div className="data-section">
      <div className="section-title">My Sales</div>
      <p className="dash-section-sub">Earnings from your digital products</p>
      <div className="kpi-row" style={{ marginTop: '1rem', marginBottom: '2.5rem' }}>
        <div className="kpi-item">
          <span className="kpi-lbl">Total Revenue</span>
          <span className="kpi-val" style={{ color: 'var(--success-green)' }}>${total.toFixed(2)}</span>
          <span className="kpi-sub">{sales.length} sale{sales.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
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
                <td className="item-secondary">@{s.buyer?.username || 'Buyer'}</td>
                <td className="val-mono" style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>{dateStr(s.soldAt || s.purchasedAt)}</td>
                <td className="val-mono" style={{ color: 'var(--success-green)' }}>+${(s.amountPaid || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsList({ products, navigate }: { products: ProductData[]; navigate: NavigateFunction }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon="◆"
        title="No products listed"
        description="Start selling your code on DevChain."
        actions={[{ label: 'Create Product', onClick: () => navigate('/create-product') }]}
      />
    );
  }
  return (
    <div className="data-section">
      <div className="section-title">
        My Products
        <span className="dash-link" style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => navigate('/create-product')}>+ New Product</span>
      </div>
      <p className="dash-section-sub">Everything you're selling in the marketplace</p>
      <div className="table-wrap">
        <table className="data-table" style={{ marginTop: '1rem' }}>
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
                  {p.tags && p.tags.length > 0 && (
                    <span className="item-secondary">#{p.tags.slice(0, 3).join(' #')}</span>
                  )}
                </td>
                <td className="item-secondary">{p.category}</td>
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
    </div>
  );
}

function JobsList({ jobs, navigate }: { jobs: JobData[]; navigate: NavigateFunction }) {
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon="◆"
        title="No jobs posted"
        description="Post a job to hire DevChain developers."
        actions={[{ label: 'Post a Job', onClick: () => navigate('/post-job') }]}
      />
    );
  }
  return (
    <div className="data-section">
      <div className="section-title">My Jobs</div>
      <p className="dash-section-sub">Jobs you've posted for hire</p>
      <div className="table-wrap">
        <table className="data-table" style={{ marginTop: '1rem' }}>
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
    </div>
  );
}
