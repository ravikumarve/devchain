import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { analyticsAPI, jobsAPI, chatAPI, ownershipAPI } from '../services/api';
import EmptyState from '../components/EmptyState';

interface Sale {
  id: string;
  productTitle: string;
  buyerName: string;
  amountPaid: number;
  createdAt: string;
}

interface Contract {
  id: string;
  title: string;
  clientName: string;
  budget: number;
  status: string;
}

interface Message {
  id: string;
  name: string;
  content: string;
  time: string;
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
    open: 'Open',
    in_progress: 'In Progress',
    completed: 'Completed',
    closed: 'Closed',
    pending: 'Pending Funding',
    funded: 'Funded',
    delivered: 'Delivered',
    released: 'Released',
    accepted: 'Accepted',
    rejected: 'Rejected',
  };
  return map[status] || status;
}

export default function Overview() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState({
    balance: 0,
    escrowed: 0,
    sales: 0,
    rating: 0,
    loading: true,
  });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Defer past App's sync loadUser() so hard-navigations don't false-redirect
    const t = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        navigate('/login');
      }
    }, 0);
    return () => clearTimeout(t);
  }, [isLoading, isAuthenticated, navigate]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setError(null);
    try {
      const [analyticsRes, jobsRes, chatRes, salesRes] = await Promise.allSettled([
        analyticsAPI.getSeller(),
        jobsAPI.myJobs(),
        chatAPI.getConversations(),
        ownershipAPI.mySales(),
      ]);

      // ── KPIs ──
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value.data : null;
      const allTimeRevenue =
        analytics?.products?.reduce((sum: number, p: { revenue?: number }) => sum + (p.revenue || 0), 0) ?? 0;
      const salesCount =
        analytics?.products?.reduce((sum: number, p: { salesCount?: number }) => sum + (p.salesCount || 0), 0) ?? 0;
      const avgRating = analytics?.reviews?.averageRating ?? 0;

      // ── Active Contracts (escrow funded / in-progress jobs) ──
      const jobsData = jobsRes.status === 'fulfilled' ? jobsRes.value.data : null;
      const jobsList = Array.isArray(jobsData?.jobs) ? jobsData.jobs : Array.isArray(jobsData) ? jobsData : [];
      const activeJobs = jobsList.filter(
        (j: { status?: string }) => j.status === 'in_progress' || j.status === 'open'
      );
      const escrowed = activeJobs.reduce(
        (sum: number, j: { budgetMin?: number; budget?: number }) => sum + (j.budgetMin || j.budget || 0),
        0
      );
      setContracts(
        activeJobs.slice(0, 5).map((j: any) => ({
          id: j.id,
          title: j.title,
          clientName: j.client?.username || 'Client',
          budget: j.budgetMin || j.budget || 0,
          status: statusLabel(j.status),
        }))
      );

      // ── Recent Messages ──
      const chatData = chatRes.status === 'fulfilled' ? chatRes.value.data : null;
      const convos = Array.isArray(chatData?.conversations) ? chatData.conversations : [];
      setMessages(
        convos.slice(0, 5).map((c: any) => ({
          id: c.id,
          name: c.otherUser?.username || 'User',
          content: c.lastMessage?.content || 'No messages yet',
          time: timeAgo(c.lastMessage?.createdAt || c.createdAt),
        }))
      );

      // ── Recent Product Sales ──
      const salesData = salesRes.status === 'fulfilled' ? salesRes.value.data : null;
      const orders = Array.isArray(salesData?.sales) ? salesData.sales : [];
      setSales(
        orders.slice(0, 6).map((o: any) => ({
          id: o.id,
          productTitle: o.product?.title || 'Untitled product',
          buyerName: o.buyer?.username || 'Buyer',
          amountPaid: o.amountPaid || 0,
          createdAt: o.createdAt,
        }))
      );

      setKpis({
        balance: allTimeRevenue,
        escrowed,
        sales: salesCount,
        rating: avgRating,
        loading: false,
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load dashboard');
      setKpis((k) => ({ ...k, loading: false }));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <div className="dash-page">
        <EmptyState icon="⚙️" title="Loading workspace…" description="Fetching your contracts, sales, and messages." />
      </div>
    );
  }

  if (error && kpis.loading) {
    return (
      <div className="dash-page">
        <EmptyState
          icon="⚠️"
          title="Couldn't load dashboard"
          description={error}
          actions={[{ label: 'Retry', onClick: () => { setKpis((k) => ({ ...k, loading: true })); load(); } }]}
        />
      </div>
    );
  }

  const hasData = kpis.sales > 0 || contracts.length > 0 || messages.length > 0 || sales.length > 0;

  return (
    <div className="dash-page">
      <div className="dash-header">
        <div className="dash-title">
          <h1>Overview</h1>
          <p>Track your digital sales, active job escrows, and proposals.</p>
        </div>
        <div className="dash-actions">
          <Link to="/post-job" className="btn btn-outline" style={{ padding: '0.6rem 1.4rem', fontSize: '0.8rem' }}>Post Job</Link>
          <Link to="/create-product" className="btn btn-primary" style={{ padding: '0.6rem 1.4rem', fontSize: '0.8rem' }}>New Product</Link>
        </div>
      </div>

      {/* Raw KPIs */}
      <div className="kpi-row">
        <div className="kpi-item">
          <span className="kpi-lbl">Available Balance</span>
          <span className="kpi-val">${kpis.balance.toFixed(2)}</span>
          <span className="kpi-sub">All-time revenue</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-lbl">Escrowed Funds</span>
          <span className="kpi-val" style={{ color: 'var(--success-green)' }}>${kpis.escrowed.toFixed(2)}</span>
          <span className="kpi-sub">Locked in {contracts.length} active jobs</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-lbl">Product Sales</span>
          <span className="kpi-val">{kpis.sales}</span>
          <span className="kpi-sub">Lifetime downloads</span>
        </div>
        <div className="kpi-item">
          <span className="kpi-lbl">Avg Rating</span>
          <span className="kpi-val">{kpis.rating ? kpis.rating.toFixed(1) : '—'}</span>
          <span className="kpi-sub">From customer reviews</span>
        </div>
      </div>

      {!hasData && !error ? (
        <EmptyState
          icon="📦"
          title="Your marketplace awaits"
          description="List your first digital product or post a job to start building your dashboard."
          actions={[{ label: 'Create Product', onClick: () => navigate('/create-product') }]}
        />
      ) : (
        <>
          <div className="dash-grid">
            {/* Active Contracts */}
            <div className="dash-section">
              <div className="dash-section-title">
                Active Contracts
                <Link to="/my-jobs" className="dash-link">View All ↗</Link>
              </div>
              {contracts.length === 0 ? (
                <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>No active contracts yet.</p>
              ) : (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span className="item-primary">{c.title}</span>
                          <span className="item-secondary">{c.clientName}</span>
                        </td>
                        <td className="val-mono">${c.budget.toLocaleString()}</td>
                        <td><span className={`status-dot ${c.status.toLowerCase().replace(/ /g, '_')}`}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent Messages */}
            <div className="dash-section">
              <div className="dash-section-title">
                Recent Messages
                <Link to="/chat" className="dash-link">Inbox ↗</Link>
              </div>
              {messages.length === 0 ? (
                <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>No conversations yet.</p>
              ) : (
                <div className="msg-list">
                  {messages.map((m) => (
                    <div key={m.id} className="msg-item" onClick={() => navigate('/chat')}>
                      <div className="m-header">
                        <span className="m-name">{m.name}</span>
                        <span className="m-time">{m.time}</span>
                      </div>
                      <div className="m-text">{m.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Product Sales (full width) */}
          <div className="dash-section" style={{ marginTop: '2.5rem' }}>
            <div className="dash-section-title">
              Recent Product Sales
              <Link to="/analytics" className="dash-link">Analytics ↗</Link>
            </div>
            {sales.length === 0 ? (
              <p style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>No sales yet. Share your product links to get started.</p>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Digital Product</th>
                    <th>Buyer</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="item-primary">{s.productTitle}</span>
                        <span className="item-secondary">${s.amountPaid.toFixed(2)}</span>
                      </td>
                      <td className="item-secondary" style={{ fontFamily: 'var(--font-sans)' }}>{s.buyerName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                        {timeAgo(s.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
