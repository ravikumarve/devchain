import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ownershipAPI, productsAPI } from '../services/api';

function StatCard({ icon, label, value, sub, color = '#7C3AED' }: any) {
  return (
    <div style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24 }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#55556a' }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700 }}>${value.toFixed(2)}</span>
      </div>
      <div style={{ height: 6, background: '#1e1e2e', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: 3, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    Promise.all([
      ownershipAPI.mySales().catch(() => ({ data: { sales: [] } })),
      productsAPI.getMine().catch(() => ({ data: { products: [] } })),
    ]).then(([salesRes, productsRes]) => {
      setSales(salesRes.data.sales || []);
      setProducts(productsRes.data.products || []);
    }).finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (loading) return (
    <div style={{ paddingTop: 64, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9898b0' }}>
      Loading analytics...
    </div>
  );

  // Computed stats
  const totalRevenue = sales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
  const totalSales = sales.length;
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const activeProducts = products.filter(p => p.isActive).length;

  // Revenue by product
  const revenueByProduct: Record<string, { title: string; revenue: number; sales: number }> = {};
  sales.forEach(s => {
    const pid = s.product?.id;
    if (!pid) return;
    if (!revenueByProduct[pid]) revenueByProduct[pid] = { title: s.product.title, revenue: 0, sales: 0 };
    revenueByProduct[pid].revenue += s.amountPaid || 0;
    revenueByProduct[pid].sales += 1;
  });
  const productRevenue = Object.values(revenueByProduct).sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = productRevenue[0]?.revenue || 1;

  // Revenue by category
  const revenueByCategory: Record<string, number> = {};
  sales.forEach(s => {
    const cat = s.product?.category || 'other';
    revenueByCategory[cat] = (revenueByCategory[cat] || 0) + (s.amountPaid || 0);
  });

  // Sales over time (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const salesByDay: Record<string, number> = {};
  last7.forEach(d => salesByDay[d] = 0);
  sales.forEach(s => {
    const d = new Date(s.purchasedAt || s.createdAt).toISOString().slice(0, 10);
    if (salesByDay[d] !== undefined) salesByDay[d] += s.amountPaid || 0;
  });
  const maxDay = Math.max(...Object.values(salesByDay), 1);

  // Recent sales (last 5)
  const recentSales = [...sales].slice(0, 5);

  const catColors: Record<string, string> = {
    'react-components': '#7C3AED', 'node-packages': '#059669',
    'python-scripts': '#2563EB', 'blockchain': '#F59E0B', 'other': '#6B7280',
  };

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: '#7C3AED', fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Seller Dashboard</div>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 8 }}>📊 Analytics</h1>
            <p style={{ color: '#9898b0' }}>@{user?.username} · All-time performance</p>
          </div>
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: '1px solid #1e1e2e', borderRadius: 10, padding: '10px 20px', color: '#9898b0', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
            ← Back to Profile
          </button>
        </div>

        {/* Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard icon="💰" label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} sub="All-time earnings" color="#7C3AED" />
          <StatCard icon="🛍️" label="Total Sales" value={totalSales} sub="Orders completed" color="#059669" />
          <StatCard icon="📦" label="Active Products" value={activeProducts} sub={`of ${products.length} listed`} color="#2563EB" />
          <StatCard icon="📈" label="Avg Order Value" value={`$${avgOrderValue.toFixed(2)}`} sub="Per transaction" color="#F59E0B" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

          {/* Revenue by Day Chart */}
          <div style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📅 Revenue — Last 7 Days</h3>
            <p style={{ color: '#55556a', fontSize: 13, marginBottom: 24 }}>Daily earnings breakdown</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {last7.map(day => {
                const val = salesByDay[day] || 0;
                const h = maxDay > 0 ? (val / maxDay) * 100 : 0;
                const label = new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 10, color: val > 0 ? '#7C3AED' : 'transparent', fontWeight: 700 }}>${val.toFixed(0)}</div>
                    <div style={{ width: '100%', height: `${Math.max(h, val > 0 ? 8 : 4)}%`, background: val > 0 ? 'linear-gradient(180deg, #9F67FF, #7C3AED)' : '#1e1e2e', borderRadius: '4px 4px 0 0', minHeight: 4, transition: 'height 0.8s ease', boxShadow: val > 0 ? '0 0 10px rgba(124,58,237,0.4)' : 'none' }} />
                    <div style={{ fontSize: 10, color: '#55556a' }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue by Product */}
          <div style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🏆 Top Products</h3>
            <p style={{ color: '#55556a', fontSize: 13, marginBottom: 24 }}>Revenue by product</p>
            {productRevenue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#55556a' }}>No sales yet</div>
            ) : (
              productRevenue.map(p => (
                <MiniBar key={p.title} label={p.title.slice(0, 28) + (p.title.length > 28 ? '...' : '')} value={p.revenue} max={maxRevenue} color="#7C3AED" />
              ))
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

          {/* Revenue by Category */}
          <div style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🗂️ Revenue by Category</h3>
            <p style={{ color: '#55556a', fontSize: 13, marginBottom: 24 }}>Sales distribution</p>
            {Object.keys(revenueByCategory).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#55556a' }}>No sales yet</div>
            ) : (
              Object.entries(revenueByCategory).sort((a, b) => b[1] - a[1]).map(([cat, rev]) => (
                <MiniBar key={cat} label={cat} value={rev} max={totalRevenue} color={catColors[cat] || '#6B7280'} />
              ))
            )}
          </div>

          {/* Product Performance Table */}
          <div style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📦 Product Performance</h3>
            <p style={{ color: '#55556a', fontSize: 13, marginBottom: 20 }}>Your listed products</p>
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#55556a' }}>No products listed</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {products.map(p => {
                  const prodSales = revenueByProduct[p.id];
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#07070d', borderRadius: 10, border: '1px solid #1e1e2e' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{p.title.slice(0, 24)}...</div>
                        <div style={{ fontSize: 11, color: '#55556a' }}>{p.category} · ${p.price}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#7C3AED' }}>${(prodSales?.revenue || 0).toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: '#55556a' }}>{prodSales?.sales || 0} sales</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>🧾 Recent Sales</h3>
          <p style={{ color: '#55556a', fontSize: 13, marginBottom: 20 }}>Latest transactions</p>
          {recentSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#55556a' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
              <p>No sales yet. List a product to start earning!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentSales.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#07070d', borderRadius: 12, border: '1px solid #1e1e2e', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #9F67FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {s.buyer?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>@{s.buyer?.username}</div>
                      <div style={{ fontSize: 12, color: '#55556a' }}>bought {s.product?.title?.slice(0, 30)}...</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>+${s.amountPaid?.toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: '#55556a' }}>{new Date(s.purchasedAt || s.createdAt).toLocaleDateString()}</div>
                    <div style={{ background: '#05966922', color: '#059669', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>✓ Paid</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
