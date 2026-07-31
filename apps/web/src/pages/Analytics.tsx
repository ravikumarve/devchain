import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { analyticsAPI, ownershipAPI, reviewsAPI } from '../services/api';
import EmptyState from '../components/EmptyState';

interface ProductMetric {
  id: string;
  title: string;
  price: number;
  category: string;
  isActive: boolean;
  salesCount: number;
  revenue: number;
  status: string;
}

interface Sale {
  id: string;
  amountPaid: number;
  soldAt: string;
  buyer?: { username?: string };
  product?: { id: string; title: string };
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  reviewer?: { username: string };
  product?: { title: string };
  createdAt: string;
}

function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    hot: 'Hot',
    stale: 'Stale',
    new: 'New',
    active: 'Active',
  };
  return map[status] || status;
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mini-bar">
      <div className="mb-head">
        <span className="mb-lbl">{label}</span>
        <span className="mb-val">${value.toLocaleString()}</span>
      </div>
      <div className="mb-track">
        <div className="mb-fill" style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [summary, setSummary] = useState({ totalRevenue: 0, totalSales: 0, totalProducts: 0, avgOrderValue: 0 });
  const [products, setProducts] = useState<ProductMetric[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingInfo, setRatingInfo] = useState({ averageRating: 0, totalReviews: 0, breakdown: { oneStar: 0, twoStar: 0, threeStar: 0, fourStar: 0, fiveStar: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Defer past App's sync loadUser() so hard-navigations don't false-redirect
    const t = setTimeout(() => {
      if (!isAuthenticated) navigate('/login');
    }, 0);
    return () => clearTimeout(t);
  }, [isAuthenticated, navigate]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setError(null);
    try {
      const [analyticsRes, salesRes, reviewsRes] = await Promise.allSettled([
        analyticsAPI.getSeller(),
        ownershipAPI.mySales(),
        user?.id ? reviewsAPI.getSellerReviews(user.id) : Promise.resolve({ data: { reviews: [] } }),
      ]);

      const a = analyticsRes.status === 'fulfilled' ? analyticsRes.value.data : null;
      if (a) {
        setSummary({
          totalRevenue: a.summary?.totalRevenue ?? 0,
          totalSales: a.summary?.totalSales ?? 0,
          totalProducts: a.summary?.totalProducts ?? 0,
          avgOrderValue: a.summary?.avgOrderValue ?? 0,
        });
        setProducts(Array.isArray(a.products) ? a.products : []);
        setRatingInfo({
          averageRating: a.reviews?.averageRating ?? 0,
          totalReviews: a.reviews?.totalReviews ?? 0,
          breakdown: a.reviews?.ratingBreakdown ?? { oneStar: 0, twoStar: 0, threeStar: 0, fourStar: 0, fiveStar: 0 },
        });
      }

      const sData = salesRes.status === 'fulfilled' ? salesRes.value.data : null;
      setSales(Array.isArray(sData?.sales) ? sData.sales : []);

      const rData = reviewsRes.status === 'fulfilled' ? reviewsRes.value.data : null;
      setReviews(Array.isArray(rData?.reviews) ? rData.reviews : []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="dash-page">
        <EmptyState icon="⚙️" title="Loading analytics…" description="Crunching your sales, revenue, and reviews." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-page">
        <EmptyState
          icon="⚠️"
          title="Couldn't load analytics"
          description={error}
          actions={[{ label: 'Retry', onClick: () => { setLoading(true); load(); } }]}
        />
      </div>
    );
  }

  const activeProducts = products.filter((p) => p.isActive).length;

  // ── 7-day revenue chart (from sales timestamps) ──
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const salesByDay: Record<string, number> = {};
  last7.forEach((d) => (salesByDay[d] = 0));
  sales.forEach((s) => {
    const d = s.soldAt ? new Date(s.soldAt).toISOString().slice(0, 10) : '';
    if (d && salesByDay[d] !== undefined) salesByDay[d] += s.amountPaid || 0;
  });
  const maxDay = Math.max(...Object.values(salesByDay), 1);

  // ── Product + category breakdown ──
  const productsByRevenue = [...products].sort((a, b) => b.revenue - a.revenue);
  const maxProductRevenue = productsByRevenue[0]?.revenue || 1;
  const revenueByCategory: Record<string, number> = {};
  products.forEach((p) => {
    const cat = p.category || 'other';
    revenueByCategory[cat] = (revenueByCategory[cat] || 0) + (p.revenue || 0);
  });
  const categoriesSorted = Object.entries(revenueByCategory).sort((a, b) => b[1] - a[1]);

  const ratingBreakdown = [
    { star: 5, count: ratingInfo.breakdown.fiveStar },
    { star: 4, count: ratingInfo.breakdown.fourStar },
    { star: 3, count: ratingInfo.breakdown.threeStar },
    { star: 2, count: ratingInfo.breakdown.twoStar },
    { star: 1, count: ratingInfo.breakdown.oneStar },
  ];

  const isCompletelyEmpty = summary.totalProducts === 0 && summary.totalSales === 0;

  return (
    <div className="workspace">
      <div className="container">
      <div className="page-header">
        <div className="page-title">
          <h1>Analytics</h1>
          <p>@{user?.username} · All-time performance across products, sales, and reviews.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => navigate('/profile')}>
            Profile
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/create-product')}>
            New Product
          </button>
        </div>
      </div>

      {isCompletelyEmpty ? (
        <EmptyState
          icon="📊"
          title="Your analytics dashboard is ready"
          description="List your first product to start tracking revenue, sales, and performance metrics. Your dashboard will populate automatically with real-time data."
          actions={[{ label: 'Create Your First Product', onClick: () => navigate('/create-product') }]}
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="kpi-row">
            <div className="kpi-item">
              <span className="kpi-lbl">Total Revenue</span>
              <span className="kpi-val">${summary.totalRevenue.toLocaleString()}</span>
              <span className="kpi-sub">All-time earnings</span>
            </div>
            <div className="kpi-item">
              <span className="kpi-lbl">Total Sales</span>
              <span className="kpi-val">{summary.totalSales}</span>
              <span className="kpi-sub">Orders completed</span>
            </div>
            <div className="kpi-item">
              <span className="kpi-lbl">Active Products</span>
              <span className="kpi-val">{activeProducts}</span>
              <span className="kpi-sub">of {summary.totalProducts} listed</span>
            </div>
            <div className="kpi-item">
              <span className="kpi-lbl">Avg Order Value</span>
              <span className="kpi-val">${summary.avgOrderValue.toLocaleString()}</span>
              <span className="kpi-sub">Per transaction</span>
            </div>
          </div>

          {/* Revenue last 7 days + Top products */}
          <div className="two-col">
            <div className="data-section">
              <div className="section-title">Revenue — Last 7 Days</div>
              <div className="chart-wrap" style={{ marginBottom: 0 }}>
              <div className="bar-chart" style={{ height: 220 }}>
                {last7.map((day) => {
                  const val = salesByDay[day] || 0;
                  const h = maxDay > 0 ? Math.round((val / maxDay) * 100) : 0;
                  const label = new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' });
                  return (
                    <div key={day} className="bar-col">
                      <div className="bar" style={{ height: `${Math.max(h, val > 0 ? 6 : 3)}%` }} />
                      <span className="bar-lbl">{label}</span>
                    </div>
                  );
                })}
              </div>
              </div>
            </div>

            <div className="data-section">
              <div className="section-title">Top Products</div>
              <div style={{ marginTop: '1rem' }}>
                {productsByRevenue.length === 0 ? (
                  <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>No sales yet.</p>
                ) : (
                  productsByRevenue.slice(0, 6).map((p) => (
                    <MiniBar key={p.id} label={p.title.slice(0, 30) + (p.title.length > 30 ? '…' : '')} value={p.revenue} max={maxProductRevenue} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Category + Product performance */}
          <div className="two-col" style={{ marginTop: '2.5rem' }}>
            <div className="data-section">
              <div className="section-title">Revenue by Category</div>
              <div style={{ marginTop: '1rem' }}>
                {categoriesSorted.length === 0 ? (
                  <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>No sales across categories yet.</p>
                ) : (
                  categoriesSorted.map(([cat, rev]) => (
                    <MiniBar key={cat} label={cat} value={rev} max={summary.totalRevenue} />
                  ))
                )}
              </div>
            </div>

            <div className="data-section">
              <div className="section-title">Product Performance</div>
              {products.length === 0 ? (
                <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem', marginTop: '1rem' }}>No products listed.</p>
              ) : (
                <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Sales</th>
                      <th>Revenue</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 8).map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="item-primary">{p.title.slice(0, 26)}{p.title.length > 26 ? '…' : ''}</span>
                          <span className="item-secondary">{p.category} · ${p.price}</span>
                        </td>
                        <td className="val-mono">{p.salesCount}</td>
                        <td className="val-mono" style={{ color: 'var(--success-green)' }}>${p.revenue.toLocaleString()}</td>
                        <td><span className={`status-dot ${p.status}`}>{statusLabel(p.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent sales */}
          <div className="data-section" style={{ marginTop: '2.5rem' }}>
            <div className="section-title">Recent Sales</div>
            {sales.length === 0 ? (
              <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem', marginTop: '0.6rem' }}>No sales yet. Your first transaction will appear here.</p>
            ) : (
              <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Buyer</th>
                    <th>Digital Product</th>
                    <th>Date</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 8).map((s) => (
                    <tr key={s.id}>
                      <td className="item-secondary" style={{ fontFamily: 'var(--font-display)' }}>@{s.buyer?.username || 'Buyer'}</td>
                      <td>
                        <span className="item-primary">{s.product?.title?.slice(0, 32) || 'Untitled product'}</span>
                        <span className="item-secondary">Ownership issued</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                        {timeAgo(s.soldAt)}
                      </td>
                      <td className="val-mono" style={{ color: 'var(--success-green)' }}>+${(s.amountPaid || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="data-section" style={{ marginTop: '2.5rem' }}>
            <div className="section-title">Reviews &amp; Ratings</div>

            {ratingInfo.totalReviews === 0 && reviews.length === 0 ? (
              <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem', marginTop: '0.6rem' }}>No reviews yet. Reviews from buyers will appear here.</p>
            ) : (
              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(180px, 300px) 1fr', gap: '2rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="kpi-val" style={{ fontSize: '3rem' }}>
                    {ratingInfo.averageRating ? ratingInfo.averageRating.toFixed(1) : '—'}
                  </div>
                  <div className="stars" style={{ fontSize: '1rem', marginTop: '0.25rem' }}>{'★'.repeat(5)}</div>
                  <div className="kpi-sub" style={{ marginTop: '0.25rem' }}>
                    {ratingInfo.totalReviews} review{ratingInfo.totalReviews !== 1 ? 's' : ''}
                  </div>
                </div>
                <div>
                  {ratingBreakdown.map(({ star, count }) => {
                    const pct = ratingInfo.totalReviews > 0 ? (count / ratingInfo.totalReviews) * 100 : 0;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '2rem', fontFamily: 'var(--font-mono)' }}>{star}★</span>
                        <div style={{ flex: 1, height: 8, background: 'var(--bg-panel)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--warning-amber)', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', minWidth: '1.5rem', textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {reviews.length > 0 && (
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {reviews.slice(0, 5).map((r) => (
                  <div key={r.id} style={{ border: '1px solid var(--border-faint)', borderRadius: 12, padding: '0.9rem 1.1rem', background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        @{r.reviewer?.username || 'Buyer'}
                        {r.product?.title && <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}> on {r.product.title.slice(0, 30)}{r.product.title.length > 30 ? '…' : ''}</span>}
                      </span>
                      <span className="stars" style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </span>
                    </div>
                    {r.comment && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 0.4rem' }}>{r.comment}</p>}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                      {timeAgo(r.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
