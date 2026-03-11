import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProposal, setShowProposal] = useState(false);
  const [proposal, setProposal] = useState({ coverLetter: '', bidAmount: '', deliveryDays: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    jobsAPI.getOne(id!).then(res => setJob(res.data.job)).catch(() => navigate('/jobs')).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    if (!proposal.coverLetter || !proposal.bidAmount || !proposal.deliveryDays) {
      alert('Please fill all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await jobsAPI.submitProposal(id!, {
        coverLetter: proposal.coverLetter,
        bidAmount: parseFloat(proposal.bidAmount),
        deliveryDays: parseInt(proposal.deliveryDays),
      });
      setSubmitted(true);
      setShowProposal(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ paddingTop: 64, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9898b0' }}>Loading...</div>;
  if (!job) return null;

  const isOwner = job.client?.id === user?.id;

  return (
    <>
      <div style={{ paddingTop: 64, minHeight: '100vh' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>

          <button onClick={() => navigate('/jobs')} style={{ background: 'none', border: 'none', color: '#059669', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 32, padding: 0 }}>← Back to Jobs</button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

            {/* LEFT */}
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ background: '#05966922', color: '#059669', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{job.category || 'Development'}</span>
                  <span style={{ background: '#1e1e2e', color: '#9898b0', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{job.status}</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>{job.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                    {job.client?.username?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ color: '#9898b0', fontSize: 14 }}>@{job.client?.username}</span>
                  <span style={{ color: '#55556a' }}>·</span>
                  <span style={{ color: '#55556a', fontSize: 14 }}>📋 {job.proposalCount || 0} proposals</span>
                  <span style={{ color: '#55556a' }}>·</span>
                  <span style={{ color: '#55556a', fontSize: 14 }}>{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Description */}
              <div style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 28, marginBottom: 24 }}>
                <h3 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Job Description</h3>
                <p style={{ color: '#ccc', fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-line' }}>{job.description}</p>
              </div>

              {/* Skills */}
              {job.skills?.length > 0 && (
                <div style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 16, padding: 28 }}>
                  <h3 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Required Skills</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {job.skills.map((s: string) => (
                      <span key={s} style={{ background: '#05966911', border: '1px solid #05966933', color: '#059669', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div style={{ position: 'sticky', top: 90 }}>
              <div style={{ background: '#0d0f17', border: '1px solid #1e2433', borderRadius: 20, overflow: 'hidden' }}>

                <div style={{ padding: '24px', borderBottom: '1px solid #1e2433' }}>
                  <div style={{ color: '#4b5563', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Budget</div>
                  <div style={{ fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    ${job.budgetMin}–${job.budgetMax}
                  </div>
                  <div style={{ color: '#55556a', fontSize: 13, marginTop: 4 }}>
                    {job.budgetType === 'fixed' ? 'Fixed Price' : 'Per Hour'}
                  </div>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {isOwner ? (
                    <div style={{ textAlign: 'center', padding: '14px', background: '#0a1a0a', borderRadius: 12, color: '#059669', fontWeight: 700 }}>✅ Your Job Post</div>
                  ) : submitted ? (
                    <div style={{ textAlign: 'center', padding: '14px', background: '#0a1a0a', borderRadius: 12, color: '#059669', fontWeight: 700 }}>✅ Proposal Submitted!</div>
                  ) : !isAuthenticated ? (
                    <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Login to Apply</button>
                  ) : (
                    <button onClick={() => setShowProposal(true)} style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(5,150,105,0.3)' }}>
                      📋 Submit Proposal
                    </button>
                  )}
                </div>

                <div style={{ padding: '0 24px 20px' }}>
                  <div style={{ color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Client</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>
                      {job.client?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#e2e8f0', fontWeight: 700 }}>@{job.client?.username}</div>
                      <div style={{ color: '#4b5563', fontSize: 12 }}>⭐ {job.client?.reputationScore} reputation</div>
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
          <div style={{ background: '#0f1117', border: '1px solid #1e2433', borderRadius: 20, width: '100%', maxWidth: 540, overflow: 'hidden' }}>
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #1e2433', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#059669', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>📋 Submit Proposal</div>
                <div style={{ color: '#f8fafc', fontSize: 17, fontWeight: 700 }}>{job.title}</div>
              </div>
              <button onClick={() => setShowProposal(false)} style={{ background: '#1e2433', border: 'none', color: '#94a3b8', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: 8 }}>Cover Letter *</label>
                <textarea
                  style={{ width: '100%', background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: 'Inter, sans-serif', height: 120, resize: 'vertical', boxSizing: 'border-box' }}
                  placeholder="Explain why you're the best fit for this job..."
                  value={proposal.coverLetter}
                  onChange={e => setProposal(p => ({ ...p, coverLetter: e.target.value }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: 8 }}>Your Bid (USD) *</label>
                  <input
                    style={{ width: '100%', background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
                    type="number" placeholder="500"
                    value={proposal.bidAmount}
                    onChange={e => setProposal(p => ({ ...p, bidAmount: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', display: 'block', marginBottom: 8 }}>Delivery (days) *</label>
                  <input
                    style={{ width: '100%', background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
                    type="number" placeholder="7"
                    value={proposal.deliveryDays}
                    onChange={e => setProposal(p => ({ ...p, deliveryDays: e.target.value }))}
                  />
                </div>
              </div>
              <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, #059669, #10b981)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : '🚀 Submit Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
