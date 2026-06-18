import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const CATEGORIES = ['react-components', 'node-packages', 'python-scripts', 'mobile-templates', 'ui-kits', 'apis', 'tools', 'blockchain', 'other'];

export default function Sell() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState({ title: '', description: '', price: '', category: 'react-components', previewUrl: '', tags: [] as string[] });

  if (!isAuthenticated) { navigate('/login'); return null; }

  const set = (k: string, v: string | string[]) => setForm(f => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (t && !form.tags.includes(t) && form.tags.length < 8) { set('tags', [...form.tags, t]); setTagInput(''); }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.price) { alert('Please fill in title, description, and price.'); return; }
    setLoading(true);
    try {
      const res = await productsAPI.create({ title: form.title, description: form.description, price: parseFloat(form.price), category: form.category, previewUrl: form.previewUrl || null, tags: form.tags });
      setSuccess(true);
      setTimeout(() => navigate(`/product/${res.data.product.id}`), 2000);
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create product.');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)', marginBottom: 12 }}>Product Listed!</h2>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Redirecting to your product page...</p>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent' }}>
      <div className="container" style={{ padding: '48px 2rem' }}>
        <button onClick={() => navigate('/marketplace')} className="btn-outline" style={{ marginBottom: 32, padding: '8px 18px', fontSize: 13 }}>
          ← Back to Marketplace
        </button>

        <div className="card" style={{ padding: 32, maxWidth: 720 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ color: 'var(--eth-purple)', fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
              Sell
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.04em', marginBottom: 8 }}>List a Product</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sell your code, templates, or tools on DevChain and get blockchain ownership certificates.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={fld}>
              <label style={lbl}>Product Title *</label>
              <input style={inp} placeholder="e.g. React Dashboard Template with Dark Mode" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>

            <div style={fld}>
              <label style={lbl}>Description *</label>
              <textarea style={{ ...inp, height: 140, resize: 'vertical' }} placeholder="Describe what's included, key features, and why developers should buy it..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={fld}>
                <label style={lbl}>Price (USD) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--eth-purple)', fontWeight: 800, fontSize: 18 }}>$</span>
                  <input style={{ ...inp, paddingLeft: 32 }} type="number" min="1" step="0.01" placeholder="29.99" value={form.price} onChange={e => set('price', e.target.value)} />
                </div>
              </div>
              <div style={fld}>
                <label style={lbl}>Category *</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={fld}>
              <label style={lbl}>Preview URL <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span></label>
              <input style={inp} placeholder="https://github.com/you/repo or live demo link" value={form.previewUrl} onChange={e => set('previewUrl', e.target.value)} />
            </div>

            <div style={fld}>
              <label style={lbl}>Tags <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(up to 8)</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...inp, flex: 1 }} placeholder="e.g. react, typescript, dashboard" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <button onClick={addTag} className="btn-outline" style={{ padding: '10px 20px', fontSize: 13 }}>Add</button>
              </div>
              {form.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {form.tags.map(t => (
                    <span key={t} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-dim)', padding: '4px 12px', borderRadius: 6, color: 'var(--text-faint)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      #{t}
                      <button onClick={() => { set('tags', form.tags.filter(x => x !== t)); }} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: 'transparent', border: '1px solid var(--eth-purple-dim)', borderRadius: 14, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 28 }}>🔐</span>
              <div>
                <div style={{ color: 'var(--eth-purple)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Blockchain Ownership on Every Sale</div>
                <div style={{ color: 'var(--text-faint)', fontSize: 13, lineHeight: 1.7 }}>Every buyer receives a unique SHA-256 certificate permanently linked to their account. Your product is protected and verifiable forever on DevChain.</div>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '18px', borderRadius: 14, background: loading ? 'var(--eth-purple-dim)' : 'linear-gradient(135deg, var(--eth-purple), #9F67FF)', border: 'none', color: '#fff', fontSize: 17, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 24px rgba(98,126,234,0.35)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Listing...' : '🚀 List Product on DevChain'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const fld: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };
const lbl: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: 'var(--text-main)', letterSpacing: 0.3 };
const inp: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: 10, padding: '12px 16px', color: 'var(--text-main)', fontSize: 15, fontFamily: 'var(--font-display)', outline: 'none', width: '100%', boxSizing: 'border-box' };
