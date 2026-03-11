import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const CATEGORIES = ['frontend', 'backend', 'fullstack', 'mobile', 'blockchain', 'devops', 'design', 'other'];

export default function PostJob() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', budgetMin: '', budgetMax: '',
    category: 'fullstack', skills: [] as string[],
  });

  if (!isAuthenticated) { navigate('/login'); return null; }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 10) {
      set('skills', [...form.skills, s]);
      setSkillInput('');
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.budgetMin || !form.budgetMax) {
      alert('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await jobsAPI.create({
        title: form.title,
        description: form.description,
        budgetMin: parseFloat(form.budgetMin),
        budgetMax: parseFloat(form.budgetMax),
        category: form.category,
        skills: form.skills,
      });
      setSuccess(true);
      setTimeout(() => navigate(`/job/${res.data.job.id}`), 2000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post job.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ paddingTop: 64, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Job Posted!</h2>
        <p style={{ color: '#9898b0' }}>Redirecting to your job page...</p>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <button onClick={() => navigate('/jobs')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 32, padding: 0 }}>← Back to Jobs</button>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Post a Job</h1>
          <p style={{ color: '#9898b0', fontSize: 16 }}>Hire talented developers from the DevChain community.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={fld}>
            <label style={lbl}>Job Title *</label>
            <input style={inp} placeholder="e.g. Build a React Native app for my startup" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div style={fld}>
            <label style={lbl}>Description *</label>
            <textarea style={{ ...inp, height: 160, resize: 'vertical' }} placeholder="Describe the project in detail — what needs to be built, tech stack preferences, deliverables..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={fld}>
              <label style={lbl}>Min Budget ($) *</label>
              <input style={inp} type="number" placeholder="500" value={form.budgetMin} onChange={e => set('budgetMin', e.target.value)} />
            </div>
            <div style={fld}>
              <label style={lbl}>Max Budget ($) *</label>
              <input style={inp} type="number" placeholder="1500" value={form.budgetMax} onChange={e => set('budgetMax', e.target.value)} />
            </div>
            <div style={fld}>
              <label style={lbl}>Category *</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={fld}>
            <label style={lbl}>Required Skills <span style={{ color: '#55556a', fontWeight: 400 }}>(optional, up to 10)</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="e.g. React, Node.js, PostgreSQL" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
              <button onClick={addSkill} style={{ padding: '12px 20px', borderRadius: 10, background: '#1e1e2e', border: '1px solid #2a2a3e', color: '#7C3AED', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Add</button>
            </div>
            {form.skills.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {form.skills.map(s => (
                  <span key={s} style={{ background: '#12121a', border: '1px solid #2a2a3e', padding: '4px 12px', borderRadius: 6, color: '#9898b0', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {s}
                    <button onClick={() => set('skills', form.skills.filter(x => x !== s))} style={{ background: 'none', border: 'none', color: '#55556a', cursor: 'pointer', fontSize: 14, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#0d0a1a', border: '1px solid #7C3AED33', borderRadius: 14, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 28 }}>💼</span>
            <div>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Hire with Confidence</div>
              <div style={{ color: '#55556a', fontSize: 13, lineHeight: 1.7 }}>DevChain connects you with verified developers. All transactions are secured with blockchain certificates and escrow protection.</div>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '18px', borderRadius: 14, background: loading ? '#3a1a6e' : 'linear-gradient(135deg, #7C3AED, #9F67FF)', border: 'none', color: '#fff', fontSize: 17, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 24px rgba(124,58,237,0.35)' }}>
            {loading ? 'Posting...' : '💼 Post Job on DevChain'}
          </button>
        </div>
      </div>
    </div>
  );
}

const fld: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };
const lbl: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#e2e8f0', letterSpacing: 0.3 };
const inp: React.CSSProperties = { background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box' };
