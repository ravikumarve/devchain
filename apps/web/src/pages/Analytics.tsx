import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ownershipAPI, productsAPI, reviewsAPI } from '../services/api';
import EmptyState from '../components/EmptyState';

interface SaleData { id: string; amountPaid: number; purchasedAt?: string; createdAt?: string; buyer?: { username?: string; }; product?: { id: string; title: string; category?: string; }; }
interface ProductInfo { id: string; title: string; price: number; category: string; isActive: boolean; }

function StatCard({ icon, label, value, sub, color = 'var(--eth-purple)' }: { icon: string; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color, marginBottom: 4, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max, color, }: { label: string; value: number; max: number; color: string; }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${value.toFixed(2)}</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-panel)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)`, borderRadius: 3, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [sales, setSales] = useState<SaleData[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [reviews, setReviews] = useState<{ id: string; rating: number; comment?: string; reviewer: { username: string }; product?: { title: string }; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    Promise.all([
      ownershipAPI.mySales().catch(() => ({ data: { sales: [] } })),
      productsAPI.getMine().catch(() => ({ data: { products: [] } })),
      user?.id ? reviewsAPI.getSellerReviews(user.id).catch(() => ({ data: { reviews: [] } })) : Promise.resolve({ data: { reviews: [] } }),
    ])
      .then(([salesRes, productsRes, reviewsRes]) => {
        setSales(salesRes.data.sales || []);
        setProducts(productsRes.data.products || []);
        setReviews(reviewsRes.data.reviews || []);
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, user?.id]);

  if (loading) return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading...</div>
  );

  const totalRevenue = sales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
  const totalSales = sales.length;
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const activeProducts = products.filter((p) => p.isActive).length;

  const revenueByProduct: Record<string, { title: string; revenue: number; sales: number }> = {};
  sales.forEach((s) => {
    const prod = s.product;
    if (!prod?.id) return;
    if (!revenueByProduct[prod.id]) revenueByProduct[prod.id] = { title: prod.title, revenue: 0, sales: 0 };
    revenueByProduct[prod.id].revenue += s.amountPaid || 0;
    revenueByProduct[prod.id].sales += 1;
  });
  const productRevenue = Object.values(revenueByProduct).sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = productRevenue[0]?.revenue || 1;

  const revenueByCategory: Record<string, number> = {};
  sales.forEach((s) => { const cat = s.product?.category || 'other'; revenueByCategory[cat] = (revenueByCategory[cat] || 0) + (s.amountPaid || 0); });

  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10); });
  const salesByDay: Record<string, number> = {};
  last7.forEach((d) => (salesByDay[d] = 0));
  sales.forEach((s) => {
    const dateStr = s.purchasedAt ?? s.createdAt;
    const d = dateStr ? new Date(dateStr).toISOString().slice(0, 10) : '';
    if (d && salesByDay[d] !== undefined) salesByDay[d] += s.amountPaid || 0;
  });
  const maxDay = Math.max(...Object.values(salesByDay), 1);
  const recentSales = [...sales].slice(0, 5);

  const catColors: Record<string, string> = {
    'react-components': '#7C3AED', 'node-packages': '#059669', 'python-scripts': '#2563EB',
    blockchain: '#F59E0B', other: '#6B7280',
  };

  const isCompletelyEmpty = products.length === 0 && sales.length === 0;

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent' }}>
      <div className="container" style={{ padding: '48px 2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: 'var(--eth-purple)', fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
              Seller Dashboard
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.04em', marginBottom: 8 }}>Analytics</h1>
            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>@{user?.username} · All-time performance</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/create-product')} className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
              + List Product
            </button>
            <button onClick={() => navigate('/profile')} className="btn-outline" style={{ padding: '10px 20px', fontSize: 13 }}>
              ← Profile
            </button>
          </div>
        </div>

        {/* Comprehensive empty state when no products and no sales */}
        {isCompletelyEmpty ? (
          <EmptyState
            icon="📊"
            title="Your analytics dashboard is ready"
            description="List your first product to start tracking revenue, sales, and performance metrics. Your dashboard will populate automatically with real-time data."
            skeleton={{ count: 1, type: 'chart' }}
            actions={[
              { label: '+ Create Your First Product', onClick: () => navigate('/create-product') },
            ]}
            features={[
              { icon: '💰', title: 'Revenue Tracking', description: 'See daily, weekly, and monthly earnings with beautiful charts and trend analysis.' },
              { icon: '📦', title: 'Product Performance', description: 'Identify your best-selling products and categories to optimize your catalog.' },
              { icon: '🧾', title: 'Transaction History', description: 'Complete audit trail of every sale with buyer details, amounts, and timestamps.' },
              { icon: '📈', title: 'Growth Metrics', description: 'Track average order value, conversion rates, and month-over-month growth.' },
            ]}
          />
        ) : (<>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard icon="💰" label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} sub="All-time earnings" color="var(--eth-purple)" />
          <StatCard icon="🛍️" label="Total Sales" value={totalSales} sub="Orders completed" color="#10b981" />
          <StatCard icon="📦" label="Active Products" value={activeProducts} sub={`of ${products.length} listed`} color="#3b82f6" />
          <StatCard icon="📈" label="Avg Order Value" value={`$${avgOrderValue.toFixed(2)}`} sub="Per transaction" color="var(--crypto-gold)" />
        </div>

        {/* Revenue by Day + Top Products */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>📅 Revenue — Last 7 Days</h3>
            <p style={{ color: 'var(--text-faint)', fontSize: 13, fontFamily: 'var(--font-mono)', marginBottom: 24 }}>Daily earnings breakdown</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {last7.map((day) => {
                const val = salesByDay[day] || 0;
                const h = maxDay > 0 ? (val / maxDay) * 100 : 0;
                const label = new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 10, color: val > 0 ? 'var(--eth-purple)' : 'transparent', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>${val.toFixed(0)}</div>
                    <div style={{ width: '100%', height: `${Math.max(h, val > 0 ? 8 : 4)}%`, background: val > 0 ? 'linear-gradient(180deg, #9F67FF, var(--eth-purple))' : 'var(--bg-panel)', borderRadius: '4px 4px 0 0', minHeight: 4, transition: 'height 0.8s ease', boxShadow: val > 0 ? '0 0 10px rgba(98,126,234,0.4)' : 'none' }} />
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>🏆 Top Products</h3>
            <p style={{ color: 'var(--text-faint)', fontSize: 13, fontFamily: 'var(--font-mono)', marginBottom: 24 }}>Revenue by product</p>
            {productRevenue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>📈</div>
                <p style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 12 }}>No sales yet</p>
                <button onClick={() => navigate('/create-product')} className="btn-outline"
                  style={{ padding: '6px 14px', fontSize: 11, borderColor: 'var(--border-dim)' }}>
                  + List more products
                </button>
              </div>
            ) : (
              productRevenue.map((p) => <MiniBar key={p.title} label={p.title.slice(0, 28) + (p.title.length > 28 ? '...' : '')} value={p.revenue} max={maxRevenue} color="var(--eth-purple)" />)
            )}
          </div>
        </div>

        {/* Revenue by Category + Product Performance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>🗂️ Revenue by Category</h3>
            <p style={{ color: 'var(--text-faint)', fontSize: 13, fontFamily: 'var(--font-mono)', marginBottom: 24 }}>Sales distribution</p>
            {Object.keys(revenueByCategory).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>🗂️</div>
                <p style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>No sales across categories yet</p>
              </div>
            ) : (
              Object.entries(revenueByCategory).sort((a, b) => b[1] - a[1]).map(([cat, rev]) => (
                <MiniBar key={cat} label={cat} value={rev} max={totalRevenue} color={catColors[cat] || '#6B7280'} />
              ))
            )}
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>📦 Product Performance</h3>
            <p style={{ color: 'var(--text-faint)', fontSize: 13, fontFamily: 'var(--font-mono)', marginBottom: 20 }}>Your listed products</p>
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>📦</div>
                <p style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 12 }}>No products listed</p>
                <button onClick={() => navigate('/create-product')} className="btn-outline"
                  style={{ padding: '6px 14px', fontSize: 11, borderColor: 'var(--border-dim)' }}>
                  + Create product
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {products.map((p) => {
                  const prodSales = revenueByProduct[p.id];
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'transparent', borderRadius: 10, border: '1px solid var(--border-dim)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 2 }}>{p.title.slice(0, 24)}...</div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{p.category} · ${p.price}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--eth-purple)', fontFamily: 'var(--font-mono)' }}>${(prodSales?.revenue || 0).toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{prodSales?.sales || 0} sales</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>🧾 Recent Sales</h3>
          <p style={{ color: 'var(--text-faint)', fontSize: 13, fontFamily: 'var(--font-mono)', marginBottom: 20 }}>Latest transactions</p>
          {recentSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-faint)' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>💰</div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, marginBottom: 14, color: 'var(--text-faint)' }}>
                No sales yet. Your first transaction will appear here.
              </p>
              <button onClick={() => navigate('/create-product')} className="btn-outline"
                style={{ padding: '8px 16px', fontSize: 12, borderColor: 'var(--border-dim)' }}>
                + List a product to start earning
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentSales.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'transparent', borderRadius: 12, border: '1px solid var(--border-dim)', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--eth-purple), #9F67FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {s.buyer?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>@{s.buyer?.username}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>bought {s.product?.title?.slice(0, 30)}...</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>+${s.amountPaid?.toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{(s.purchasedAt ?? s.createdAt) ? new Date((s.purchasedAt ?? s.createdAt) as string).toLocaleDateString() : '—'}</div>
                    <span style={{ background: '#10b98122', color: '#10b981', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>✓ Paid</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="card" style={{ padding: 24, marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>⭐ Reviews & Ratings</h3>
          <p style={{ color: 'var(--text-faint)', fontSize: 13, fontFamily: 'var(--font-mono)', marginBottom: 20 }}>Buyer feedback on your products</p>

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-faint)' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>⭐</div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-faint)' }}>
                No reviews yet. Reviews from buyers will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Rating Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, marginBottom: 24, alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                  </div>
                  <div style={{ fontSize: 14, color: '#f59e0b', marginTop: 4 }}>
                    {'★'.repeat(5)}{' '}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviews.filter(r => r.rating === star).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 30, fontFamily: 'var(--font-mono)' }}>{star}★</span>
                        <div style={{ flex: 1, height: 8, background: 'var(--bg-panel)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 4, transition: 'width 1s ease' }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', minWidth: 24, textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Reviews */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Recent Reviews</h4>
                {reviews.slice(0, 5).map(r => (
                  <div key={r.id} style={{ padding: '14px 18px', background: 'transparent', borderRadius: 12, border: '1px solid var(--border-dim)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                        @{r.reviewer?.username}
                        {r.product?.title && <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}> on {r.product.title.slice(0, 30)}...</span>}
                      </div>
                      <div style={{ color: '#f59e0b', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </div>
                    </div>
                    {r.comment && <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>{r.comment}</p>}
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </>)}
    </div>
  </div>
  );
}
