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
  const [form, setForm] = useState({ title: '', description: '', budgetMin: '', budgetMax: '', category: 'fullstack', skills: [] as string[] });

  if (!isAuthenticated) { navigate('/login'); return null; }

  const set = (k: string, v: string | string[]) => setForm(f => ({ ...f, [k]: v }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 10) { set('skills', [...form.skills, s]); setSkillInput(''); }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.budgetMin || !form.budgetMax) { alert('Please fill in all required fields.'); return; }
    setLoading(true);
    try {
      const res = await jobsAPI.create({ title: form.title, description: form.description, budgetMin: parseFloat(form.budgetMin), budgetMax: parseFloat(form.budgetMax), category: form.category, skills: form.skills });
      setSuccess(true);
      setTimeout(() => navigate(`/job/${res.data.job.id}`), 2000);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to post job.');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="workspace" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, letterSpacing: '-0.02em' }}>Job Posted!</h2>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Redirecting to your job page...</p>
      </div>
    </div>
  );

  return (
    <div className="workspace">
      <div className="container" style={{ maxWidth: 720 }}>
        <button onClick={() => navigate('/jobs')} className="btn btn-outline" style={{ marginBottom: '2rem', padding: '8px 18px', fontSize: 13 }}>
          ← Back to Jobs
        </button>

        <div className="page-header" style={{ marginBottom: '3rem' }}>
          <div className="page-title">
            <h1>Post a Job</h1>
            <p>Hire talented developers from the DevChain community.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 720 }}>
          <div className="form-group" style={{ maxWidth: 'none' }}>
            <label className="form-label" htmlFor="title">Job Title *</label>
            <input className="form-control" id="title" placeholder="e.g. Build a React Native app for my startup" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div className="form-group" style={{ maxWidth: 'none' }}>
            <label className="form-label" htmlFor="description">Description *</label>
            <textarea className="form-control" id="description" style={{ height: 160, resize: 'vertical' }} placeholder="Describe the project in detail — what needs to be built, tech stack preferences, deliverables..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
            <div className="form-group" style={{ maxWidth: 'none' }}>
              <label className="form-label" htmlFor="budgetMin">Min Budget ($) *</label>
              <input className="form-control" id="budgetMin" type="number" placeholder="500" value={form.budgetMin} onChange={e => set('budgetMin', e.target.value)} />
            </div>
            <div className="form-group" style={{ maxWidth: 'none' }}>
              <label className="form-label" htmlFor="budgetMax">Max Budget ($) *</label>
              <input className="form-control" id="budgetMax" type="number" placeholder="1500" value={form.budgetMax} onChange={e => set('budgetMax', e.target.value)} />
            </div>
            <div className="form-group" style={{ maxWidth: 'none' }}>
              <label className="form-label" htmlFor="category">Category *</label>
              <select className="form-control" id="category" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: 'none' }}>
            <label className="form-label" htmlFor="skills">
              Required Skills <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional, up to 10)</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-control" id="skills" placeholder="e.g. React, Node.js, PostgreSQL" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
              <button onClick={addSkill} className="btn btn-outline" style={{ padding: '0 20px', fontSize: 13 }}>Add</button>
            </div>
            {form.skills.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {form.skills.map(s => (
                  <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                    {s}
                    <button onClick={() => set('skills', form.skills.filter(x => x !== s))} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 14, padding: 0 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ border: '1px solid var(--border-faint)', borderRadius: 6, padding: '1.25rem 1.5rem', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 28 }}>💼</span>
            <div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Hire with Confidence</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>DevChain connects you with verified developers. All transactions are secured with blockchain certificates and escrow protection.</div>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="btn btn-primary" style={{ padding: '18px', fontSize: 17, fontWeight: 700 }}>
            {loading ? 'Posting...' : '💼 Post Job on DevChain'}
          </button>
        </div>
      </div>
    </div>
  );
}
