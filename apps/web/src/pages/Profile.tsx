import { useState, useEffect } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ownershipAPI, jobsAPI, productsAPI, authAPI } from '../services/api';

interface ProductData { id: string; title: string; category: string; downloadsCount: number; price: number; isActive: boolean; seller?: { username: string }; tags?: string[]; description?: string; }
interface UserRef { id: string; username: string; reputationScore?: number; }
interface PurchaseData { id: string; product?: ProductData & { seller?: UserRef }; purchasedAt: string; amountPaid: number; certificate?: { ownershipHash: string; verifyUrl: string; }; }
interface SaleData { id: string; product?: ProductData; buyer?: UserRef; purchasedAt: string; amountPaid: number; }
interface JobData { id: string; title: string; budgetMin: number; budgetMax: number; proposalCount: number; status: string; client?: UserRef; }

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'purchases' | 'sales' | 'products' | 'jobs'>('purchases');
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [sales, setSales] = useState<SaleData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadTab(tab);
  }, [tab, isAuthenticated, navigate]);

  const loadTab = async (t: string) => {
    setLoading(true);
    try {
      if (t === 'purchases') { const res = await ownershipAPI.myPurchases(); setPurchases(res.data.purchases || []); }
      else if (t === 'sales') { const res = await ownershipAPI.mySales(); setSales(res.data.sales || []); }
      else if (t === 'products') { const res = await productsAPI.getMine(); setProducts(res.data.products || []); }
      else if (t === 'jobs') { const res = await jobsAPI.myJobs(); setJobs(res.data.jobs || []); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };
  if (!isAuthenticated) return null;

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent' }}>
      <div className="container" style={{ padding: '48px 2rem' }}>
        {/* Profile Header */}
        <div className="card" style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--eth-purple), #9F67FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: '#10b981', border: '2px solid var(--bg-surface)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', marginBottom: 4 }}>@{user?.username}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 6 }}>{user?.email}</p>
            <p style={{ color: 'var(--text-faint)', fontSize: 13, fontStyle: 'italic', marginBottom: 10 }}>
              {(user as Record<string, unknown>)?.bio || 'No bio yet'}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg-panel)', border: '1px solid var(--crypto-gold-dim)', borderRadius: 20, padding: '4px 12px', color: 'var(--crypto-gold)', fontSize: 13, fontWeight: 600 }}>
              ⭐ {user?.reputationScore} Reputation Score
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-outline" onClick={() => { setBio((user as Record<string, unknown>)?.bio as string || ''); setEditOpen(true); }} style={{ padding: '10px 20px', fontSize: 13 }}>
              ✏️ Edit Profile
            </button>
            <button className="btn-outline" onClick={handleLogout} style={{ padding: '10px 20px', fontSize: 13 }}>
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 12, padding: 4, marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { key: 'purchases', label: '🧾 My Purchases' },
            { key: 'sales', label: '💰 My Sales' },
            { key: 'products', label: '📦 My Products' },
            { key: 'jobs', label: '💼 My Jobs' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as 'purchases' | 'sales' | 'products' | 'jobs')}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: tab === t.key ? 'var(--eth-purple)' : 'transparent', color: tab === t.key ? '#fff' : 'var(--text-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-display)', minWidth: 120 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Edit Profile Modal */}
        {editOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setEditOpen(false)}>
            <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28 }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', marginBottom: 20 }}>✏️ Edit Profile</h2>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 8 }}>Bio</label>
                <textarea
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 10, padding: '12px 14px', color: 'var(--text-main)', fontSize: 14, fontFamily: 'var(--font-display)', height: 100, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                  value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell others about yourself..." maxLength={500}
                />
                <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'right', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{bio.length}/500</div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setEditOpen(false)} className="btn-outline" style={{ flex: 1, padding: '12px', fontSize: 14 }}>Cancel</button>
                <button onClick={async () => {
                  setSaving(true);
                  try {
                    const res = await authAPI.updateProfile({ bio });
                    setEditOpen(false);
                  } catch (err: unknown) {
                    alert('Failed: ' + ((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Unknown error'));
                  } finally { setSaving(false); }
                }} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '12px', fontSize: 14, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ minHeight: 300 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading...</div>
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

function PurchasesList({ purchases }: { purchases: PurchaseData[] }) {
  if (purchases.length === 0) return <Empty icon="🧾" text="No purchases yet" sub="Browse the marketplace to find something amazing" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {purchases.map(p => (
        <div key={p.id} className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{p.product?.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>by @{p.product?.seller?.username} · {new Date(p.purchasedAt).toLocaleDateString()}</p>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--eth-purple)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>${p.amountPaid?.toFixed(2)}</span>
          </div>
          {p.certificate?.ownershipHash && (
            <div style={{ marginTop: 16, background: 'transparent', border: '1px solid var(--eth-purple-dim)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--eth-purple)', letterSpacing: 2, marginBottom: 8, fontFamily: 'var(--font-mono)' }}>🔐 SHA-256 CERTIFICATE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#9F67FF', wordBreak: 'break-all', lineHeight: 1.6 }}>{p.certificate.ownershipHash}</div>
              <div style={{ marginTop: 8 }}>
                <a href={`https://devchain.onrender.com${p.certificate.verifyUrl}`} target="_blank" rel="noreferrer" style={{ color: 'var(--eth-purple)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
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

function SalesList({ sales }: { sales: SaleData[] }) {
  if (!sales.length) return <Empty icon="💰" text="No sales yet" sub="List a product to start earning" />;
  const total = sales.reduce((sum: number, s: SaleData) => sum + (s.amountPaid || 0), 0);
  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, var(--bg-void), var(--bg-surface))', border: '1px solid var(--eth-purple-dim)', borderRadius: 16, padding: 24, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>Total Revenue</span>
        <span style={{ fontSize: 40, fontWeight: 900, color: 'var(--eth-purple)', fontFamily: 'var(--font-mono)' }}>${total.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sales.map((s: SaleData) => (
          <div key={s.id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{s.product?.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>bought by @{s.buyer?.username} · {new Date(s.purchasedAt).toLocaleDateString()}</p>
              </div>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#10b981', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>+${s.amountPaid?.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsList({ products }: { products: ProductData[] }) {
  if (!products.length) return <Empty icon="📦" text="No products listed" sub="Start selling your code on DevChain" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {products.map((p: ProductData) => (
        <div key={p.id} className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{p.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.category} · {p.downloadsCount} sales</p>
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--eth-purple)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>${p.price?.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', background: p.isActive ? '#10b98122' : '#DC262622', color: p.isActive ? '#10b981' : '#DC2626' }}>
              {p.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function JobsList({ jobs, navigate }: { jobs: JobData[]; navigate: NavigateFunction }) {
  if (!jobs.length) return <Empty icon="💼" text="No jobs posted" sub="Post a job to hire DevChain developers" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {jobs.map((j: JobData) => (
        <div key={j.id} className="card interactive" style={{ padding: 24, cursor: 'pointer' }} onClick={() => navigate(`/job/${j.id}`)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{j.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>${j.budgetMin}–${j.budgetMax} · {j.proposalCount} proposals</p>
            </div>
            <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', background: '#10b98122', color: '#10b981' }}>
              {j.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ icon, text, sub }: { icon: string; text: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>{icon}</div>
      <h3 style={{ fontSize: 20, color: 'var(--text-main)', marginBottom: 8 }}>{text}</h3>
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{sub}</p>
    </div>
  );
}
