import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface JobDetailData {
  id: string; title: string; description: string; status: string;
  budgetMin: number; budgetMax: number; budgetType?: string;
  category?: string; proposalCount?: number; createdAt: string;
  client?: { id: string; username: string; reputationScore?: number; };
  skills?: string[];
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [job, setJob] = useState<JobDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProposal, setShowProposal] = useState(false);
  const [proposal, setProposal] = useState({ coverLetter: '', bidAmount: '', deliveryDays: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    jobsAPI.getOne(id!).then(res => setJob(res.data.job)).catch(() => navigate('/jobs')).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async () => {
    if (!proposal.coverLetter || !proposal.bidAmount || !proposal.deliveryDays) { alert('Please fill all fields.'); return; }
    setSubmitting(true);
    try {
      await jobsAPI.submitProposal(id!, { coverLetter: proposal.coverLetter, proposedRate: parseFloat(proposal.bidAmount), deliveryDays: parseInt(proposal.deliveryDays) });
      setSubmitted(true); setShowProposal(false);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to submit proposal.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading...</div>;
  if (!job) return null;

  const isOwner = job.client?.id === user?.id;

  return (
    <>
      <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent' }}>
        <div className="container" style={{ padding: '48px 2rem' }}>
          <button onClick={() => navigate('/jobs')} className="btn-outline" style={{ padding: '8px 18px', fontSize: 13, marginBottom: 32 }}>
            ← Back to Jobs
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
            {/* LEFT */}
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ background: '#10b98122', color: '#10b981', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {job.category || 'Development'}
                  </span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    {job.status}
                  </span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    · 📋 {job.proposalCount || 0} proposals
                  </span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.04em', marginBottom: 12, lineHeight: 1.2 }}>{job.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--eth-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                    {job.client?.username?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>@{job.client?.username}</span>
                  <span style={{ color: 'var(--text-faint)' }}>·</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="card" style={{ padding: 28, marginBottom: 24 }}>
                <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Job Description</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{job.description}</p>
              </div>

              {!!job.skills?.length && (
                <div className="card" style={{ padding: 28 }}>
                  <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Required Skills</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {job.skills.map((s: string) => (
                      <span key={s} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-dim)', color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — Sidebar */}
            <div style={{ position: 'sticky', top: 90 }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-dim)' }}>
                  <div style={{ color: 'var(--text-faint)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>Budget</div>
                  <div style={{ fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    ${job.budgetMin}–${job.budgetMax}
                  </div>
                  <div style={{ color: 'var(--text-faint)', fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    {job.budgetType === 'fixed' ? 'Fixed Price' : 'Flexible'}
                  </div>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {isOwner ? (
                    <div style={{ textAlign: 'center', padding: '14px', background: 'var(--eth-purple-dim)', borderRadius: 12, color: 'var(--eth-purple)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      ✅ Your Job Post
                    </div>
                  ) : submitted ? (
                    <div style={{ textAlign: 'center', padding: '14px', background: '#10b98122', borderRadius: 12, color: '#10b981', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                      ✅ Proposal Submitted!
                    </div>
                  ) : !isAuthenticated ? (
                    <button onClick={() => navigate('/login')} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15 }}>
                      Login to Apply
                    </button>
                  ) : (
                    <button onClick={() => setShowProposal(true)} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, boxShadow: '0 4px 20px rgba(16,185,129,0.3)', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                      📋 Submit Proposal
                    </button>
                  )}
                </div>

                <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-dim)' }}>
                  <div style={{ color: 'var(--text-faint)', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>Client</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--eth-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                      {job.client?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-mono)' }}>@{job.client?.username}</div>
                      <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>⭐ {job.client?.reputationScore} reputation</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Modal */}
      {showProposal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 540, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  📋 Submit Proposal
                </div>
                <div style={{ color: 'var(--text-main)', fontSize: 17, fontWeight: 700 }}>{job.title}</div>
              </div>
              <button onClick={() => setShowProposal(false)} className="btn-outline" style={{ padding: '6px 12px', fontSize: 16, minWidth: 32, height: 32 }}>×</button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 8 }}>Cover Letter *</label>
                <textarea style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 10, padding: '12px 14px', color: 'var(--text-main)', fontSize: 14, fontFamily: 'var(--font-display)', height: 120, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                  placeholder="Explain why you're the best fit for this job..." value={proposal.coverLetter}
                  onChange={e => setProposal(p => ({ ...p, coverLetter: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 8 }}>Your Bid (USD) *</label>
                  <input style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 10, padding: '12px 14px', color: 'var(--text-main)', fontSize: 14, fontFamily: 'var(--font-display)', boxSizing: 'border-box', outline: 'none' }}
                    type="number" placeholder="500" value={proposal.bidAmount}
                    onChange={e => setProposal(p => ({ ...p, bidAmount: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: 8 }}>Delivery (days) *</label>
                  <input style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 10, padding: '12px 14px', color: 'var(--text-main)', fontSize: 14, fontFamily: 'var(--font-display)', boxSizing: 'border-box', outline: 'none' }}
                    type="number" placeholder="7" value={proposal.deliveryDays}
                    onChange={e => setProposal(p => ({ ...p, deliveryDays: e.target.value }))} />
                </div>
              </div>
              <button onClick={handleSubmit} disabled={submitting}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: 15, opacity: submitting ? 0.6 : 1, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                {submitting ? 'Submitting...' : '🚀 Submit Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
