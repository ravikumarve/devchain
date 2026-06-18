import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, escrowAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface FreelancerInfo {
  id: string;
  username: string;
  avatarUrl?: string;
  reputationScore: number;
  bio?: string;
}

interface ProposalItem {
  id: string;
  coverLetter: string;
  proposedRate: number;
  deliveryDays: number | null;
  status: string;
  createdAt: string;
  freelancer: FreelancerInfo;
}

interface JobItem {
  id: string;
  title: string;
  description: string;
  status: string;
  budgetMin: number;
  budgetMax: number;
  createdAt: string;
  proposals: ProposalItem[];
  _count: { proposals: number };
}

export default function MyJobs() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [escrows, setEscrows] = useState<Record<string, { status: string; amount: number }>>({});
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    Promise.all([
      jobsAPI.myJobs(),
      escrowAPI.getMy().catch(() => ({ data: { escrows: [] } })),
    ])
      .then(([jobsRes, escrowRes]) => {
        setJobs(jobsRes.data.jobs || []);
        const escrowMap: Record<string, { status: string; amount: number }> = {};
        (escrowRes.data.escrows || []).forEach((e: { proposalId: string; status: string; amount: number }) => {
          escrowMap[e.proposalId] = { status: e.status, amount: e.amount };
        });
        setEscrows(escrowMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleAccept = async (proposalId: string) => {
    setActionLoading(proposalId);
    try {
      await jobsAPI.acceptProposal(proposalId);
      // Refresh jobs to reflect status changes
      const res = await jobsAPI.myJobs();
      setJobs(res.data.jobs || []);
    } catch (err: unknown) {
      alert('Failed to accept proposal: ' + ((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (proposalId: string) => {
    setActionLoading(proposalId);
    try {
      await jobsAPI.rejectProposal(proposalId);
      const res = await jobsAPI.myJobs();
      setJobs(res.data.jobs || []);
    } catch (err: unknown) {
      alert('Failed to reject proposal: ' + ((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleFund = async (proposalId: string) => {
    setActionLoading(proposalId);
    try {
      await escrowAPI.fund(proposalId);
      const [jobsRes, escrowRes] = await Promise.all([
        jobsAPI.myJobs(),
        escrowAPI.getMy().catch(() => ({ data: { escrows: [] } })),
      ]);
      setJobs(jobsRes.data.jobs || []);
      const escrowMap: Record<string, { status: string; amount: number }> = {};
      (escrowRes.data.escrows || []).forEach((e: { proposalId: string; status: string; amount: number }) => {
        escrowMap[e.proposalId] = { status: e.status, amount: e.amount };
      });
      setEscrows(escrowMap);
    } catch (err: unknown) {
      alert('Failed to fund escrow: ' + ((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRelease = async (proposalId: string) => {
    setActionLoading(proposalId);
    try {
      await escrowAPI.releasePayment(proposalId);
      const [jobsRes, escrowRes] = await Promise.all([
        jobsAPI.myJobs(),
        escrowAPI.getMy().catch(() => ({ data: { escrows: [] } })),
      ]);
      setJobs(jobsRes.data.jobs || []);
      const escrowMap: Record<string, { status: string; amount: number }> = {};
      (escrowRes.data.escrows || []).forEach((e: { proposalId: string; status: string; amount: number }) => {
        escrowMap[e.proposalId] = { status: e.status, amount: e.amount };
      });
      setEscrows(escrowMap);
    } catch (err: unknown) {
      alert('Failed to release payment: ' + ((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: '#10b98122; color: #10b981',
      in_progress: '#3b82f622; color: #3b82f6',
      closed: '#6b728033; color: #6b7280',
    };
    const c = colors[status] || '#6b728033; color: #6b7280';
    return <span style={{ background: c.split(';')[0], color: c.split(';')[1], padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>;
  };

  const proposalStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#f59e0b33; color: #f59e0b',
      accepted: '#10b98133; color: #10b981',
      rejected: '#ef444433; color: #ef4444',
    };
    const c = colors[status] || '#6b728033; color: #6b7280';
    return <span style={{ background: c.split(';')[0], color: c.split(';')[1], padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  if (loading) return (
    <div style={{ paddingTop: 72, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading jobs...</div>
  );

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent' }}>
      <div className="container" style={{ padding: '48px 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ color: 'var(--text-faint)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Client</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.04em' }}>My Posted Jobs</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
          </div>
          <button onClick={() => navigate('/post-job')} className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }}>+ Post a Job</button>
        </div>

        {jobs.length === 0 ? (
          <div className="card" style={{ padding: '48px 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💼</div>
            <h2 style={{ color: 'var(--text-main)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Jobs Posted Yet</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto 24px' }}>
              Post your first job and find the perfect freelancer for your project.
            </p>
            <button onClick={() => navigate('/post-job')} className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }}>Post a Job →</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {jobs.map(job => (
              <div key={job.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Job Header */}
                <div
                  style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: expandedJob === job.id ? '1px solid var(--border-dim)' : 'none' }}
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                >
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      {statusBadge(job.status)}
                      <span style={{ color: 'var(--text-faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>💰 ${job.budgetMin}–${job.budgetMax}</span>
                      <span style={{ color: 'var(--text-faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>· 📋 {job._count.proposals} proposal{job._count.proposals !== 1 ? 's' : ''}</span>
                      {job.status === 'open' && job._count.proposals > 0 && (
                        <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>⏳ Needs Review</span>
                      )}
                    </div>
                    <h3 style={{ color: 'var(--text-main)', fontSize: 16, fontWeight: 700 }}>{job.title}</h3>
                    <span style={{ color: 'var(--text-faint)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ color: 'var(--text-faint)', fontSize: 18 }}>
                    {expandedJob === job.id ? '▲' : '▼'}
                  </div>
                </div>

                {/* Proposals Section */}
                {expandedJob === job.id && (
                  <div style={{ padding: '20px 24px', background: 'var(--bg-panel)' }}>
                    <h4 style={{ color: 'var(--text-main)', fontSize: 14, fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                      Proposals ({job.proposals.length})
                    </h4>

                    {job.proposals.length === 0 ? (
                      <div style={{ color: 'var(--text-faint)', fontSize: 13, textAlign: 'center', padding: '24px' }}>
                        No proposals yet. Check back later.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {job.proposals.map(prop => (
                          <div key={prop.id} className="card" style={{ padding: '16px 20px', background: 'var(--bg-surface)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                              {/* Freelancer Info */}
                              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--eth-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                  {prop.freelancer?.username?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                                    <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-mono)' }}>@{prop.freelancer?.username}</span>
                                    {proposalStatusBadge(prop.status)}
                                    <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>⭐ {prop.freelancer?.reputationScore}</span>
                                  </div>
                                  <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
                                    {prop.coverLetter.length > 120 ? prop.coverLetter.slice(0, 120) + '...' : prop.coverLetter}
                                  </p>
                                  <div style={{ display: 'flex', gap: 16, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>
                                    <span>💰 Bid: <strong style={{ color: '#10b981' }}>${prop.proposedRate}</strong></span>
                                    {prop.deliveryDays && <span>📅 {prop.deliveryDays} day{prop.deliveryDays !== 1 ? 's' : ''}</span>}
                                    <span>Submitted {new Date(prop.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              {prop.status === 'pending' && job.status === 'open' && (
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleReject(prop.id); }}
                                    disabled={actionLoading === prop.id}
                                    className="btn-outline"
                                    style={{ padding: '8px 16px', fontSize: 12, color: '#ef4444', borderColor: '#ef444444' }}
                                  >✕ Reject</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleAccept(prop.id); }}
                                    disabled={actionLoading === prop.id}
                                    className="btn-primary"
                                    style={{ padding: '8px 16px', fontSize: 12, background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                  >✓ Accept</button>
                                </div>
                              )}
                              {prop.status === 'accepted' && escrows[prop.id] && (
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                                  {escrows[prop.id].status === 'funding_required' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleFund(prop.id); }}
                                      disabled={actionLoading === prop.id}
                                      className="btn-primary"
                                      style={{ padding: '8px 16px', fontSize: 12, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                                    >💰 Deposit ${escrows[prop.id].amount}</button>
                                  )}
                                  {escrows[prop.id].status === 'funded' && (
                                    <span style={{ color: '#3b82f6', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>⏳ Awaiting Delivery</span>
                                  )}
                                  {escrows[prop.id].status === 'pending_release' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleRelease(prop.id); }}
                                      disabled={actionLoading === prop.id}
                                      className="btn-primary"
                                      style={{ padding: '8px 16px', fontSize: 12, background: 'linear-gradient(135deg, #10b981, #059669)' }}
                                    >💵 Release ${escrows[prop.id].amount}</button>
                                  )}
                                  {escrows[prop.id].status === 'released' && (
                                    <span style={{ color: '#10b981', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>✅ Completed</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
