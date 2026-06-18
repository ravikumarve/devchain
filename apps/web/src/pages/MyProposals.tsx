import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, escrowAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface ProposalData {
  id: string;
  coverLetter: string;
  proposedRate: number;
  deliveryDays: number | null;
  status: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    status: string;
    budgetMin: number;
    budgetMax: number;
    client: { id: string; username: string; avatarUrl?: string; reputationScore: number };
    _count: { proposals: number };
  };
}

export default function MyProposals() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [escrows, setEscrows] = useState<Record<string, { status: string; amount: number }>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    Promise.all([
      jobsAPI.myProposals(),
      escrowAPI.getMy().catch(() => ({ data: { escrows: [] } })),
    ])
      .then(([propsRes, escrowRes]) => {
        setProposals(propsRes.data.proposals || []);
        const escrowMap: Record<string, { status: string; amount: number }> = {};
        (escrowRes.data.escrows || []).forEach((e: { proposalId: string; status: string; amount: number }) => {
          escrowMap[e.proposalId] = { status: e.status, amount: e.amount };
        });
        setEscrows(escrowMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleRequestRelease = async (proposalId: string) => {
    setActionLoading(proposalId);
    try {
      await escrowAPI.requestRelease(proposalId);
      alert('Release requested! The client will review and release payment.');
      // Refetch
      const res = await escrowAPI.getMy().catch(() => ({ data: { escrows: [] } }));
      const escrowMap: Record<string, { status: string; amount: number }> = {};
      (res.data.escrows || []).forEach((e: { proposalId: string; status: string; amount: number }) => {
        escrowMap[e.proposalId] = { status: e.status, amount: e.amount };
      });
      setEscrows(escrowMap);
    } catch (err: unknown) {
      alert('Failed: ' + ((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b33; color: #f59e0b',
      accepted: '#10b98133; color: #10b981',
      rejected: '#ef444433; color: #ef4444',
    };
    const c = colors[status] || '#6b728033; color: #6b7280';
    return <span style={{ background: c.split(';')[0], color: c.split(';')[1], padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  if (loading) return (
    <div style={{ paddingTop: 72, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading proposals...</div>
  );

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent' }}>
      <div className="container" style={{ padding: '48px 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: 'var(--text-faint)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Freelancer</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.04em' }}>My Proposals</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>{proposals.length} proposal{proposals.length !== 1 ? 's' : ''} submitted</p>
          </div>
          <button onClick={() => navigate('/jobs')} className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }}>Browse Jobs →</button>
        </div>

        {proposals.length === 0 ? (
          <div className="card" style={{ padding: '48px 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <h2 style={{ color: 'var(--text-main)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Proposals Yet</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto 24px' }}>
              Browse open jobs and submit your first proposal to start freelancing.
            </p>
            <button onClick={() => navigate('/jobs')} className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }}>Find Work →</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {proposals.map(p => (
              <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      {statusBadge(p.status)}
                      <span style={{ color: 'var(--text-faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{p.job.status === 'open' ? '🟢 Open' : '🔴 ' + p.job.status}</span>
                    </div>
                    <h3
                      onClick={() => navigate(`/job/${p.job.id}`)}
                      style={{ color: 'var(--text-main)', fontSize: 18, fontWeight: 700, cursor: 'pointer', marginBottom: 4 }}
                    >{p.job.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>@{p.job.client?.username}</span>
                      <span style={{ color: 'var(--text-faint)' }}>·</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>💰 ${p.job.budgetMin}–${p.job.budgetMax}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                      {p.coverLetter.length > 150 ? p.coverLetter.slice(0, 150) + '...' : p.coverLetter}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 140 }}>
                    <div style={{ color: 'var(--text-faint)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>Your Bid</div>
                    <div style={{ fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      ${p.proposedRate}
                    </div>
                    {p.deliveryDays && (
                      <div style={{ color: 'var(--text-faint)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                        {p.deliveryDays} day{p.deliveryDays !== 1 ? 's' : ''}
                      </div>
                    )}
                    <div style={{ color: 'var(--text-faint)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 12 }}>
                      Submitted {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                    {/* Escrow status for accepted proposals */}
                    {p.status === 'accepted' && escrows[p.id] && (
                      <div style={{ marginTop: 12 }}>
                        {escrows[p.id].status === 'funded' && (
                          <button
                            onClick={() => handleRequestRelease(p.id)}
                            disabled={actionLoading === p.id}
                            className="btn-primary"
                            style={{ width: '100%', padding: '8px 12px', fontSize: 11, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                          >📦 Mark Complete & Request Release</button>
                        )}
                        {escrows[p.id].status === 'pending_release' && (
                          <span style={{ color: '#f59e0b', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>⏳ Awaiting Client Approval</span>
                        )}
                        {escrows[p.id].status === 'released' && (
                          <span style={{ color: '#10b981', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>✅ Payment Released</span>
                        )}
                        {escrows[p.id].status === 'funding_required' && (
                          <span style={{ color: '#f59e0b', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>⏳ Awaiting Client Deposit</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
