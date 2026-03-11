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
  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'react-components',
    previewUrl: '', tags: [] as string[],
  });

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (t && !form.tags.includes(t) && form.tags.length < 8) {
      set('tags', [...form.tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => set('tags', form.tags.filter(x => x !== t));

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.price) {
      alert('Please fill in title, description, and price.');
      return;
    }
    setLoading(true);
    try {
      const res = await productsAPI.create({
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        previewUrl: form.previewUrl || null,
        tags: form.tags,
      });
      setSuccess(true);
      setTimeout(() => navigate(`/product/${res.data.product.id}`), 2000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ paddingTop: 64, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Product Listed!</h2>
          <p style={{ color: '#9898b0' }}>Redirecting to your product page...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>

        <button onClick={() => navigate('/marketplace')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 32, padding: 0 }}>
          ← Back to Marketplace
        </button>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 8 }}>List a Product</h1>
          <p style={{ color: '#9898b0', fontSize: 16 }}>Sell your code, templates, or tools on DevChain and get blockchain ownership certificates.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Title */}
          <div style={styles.field}>
            <label style={styles.label}>Product Title *</label>
            <input
              style={styles.input}
              placeholder="e.g. React Dashboard Template with Dark Mode"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          {/* Description */}
          <div style={styles.field}>
            <label style={styles.label}>Description *</label>
            <textarea
              style={{ ...styles.input, height: 140, resize: 'vertical' }}
              placeholder="Describe what's included, key features, and why developers should buy it..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Price + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={styles.field}>
              <label style={styles.label}>Price (USD) *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#7C3AED', fontWeight: 800, fontSize: 18 }}>$</span>
                <input
                  style={{ ...styles.input, paddingLeft: 32 }}
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="29.99"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Category *</label>
              <select
                style={{ ...styles.input, cursor: 'pointer' }}
                value={form.category}
                onChange={e => set('category', e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Preview URL */}
          <div style={styles.field}>
            <label style={styles.label}>Preview URL <span style={{ color: '#55556a', fontWeight: 400 }}>(optional)</span></label>
            <input
              style={styles.input}
              placeholder="https://github.com/you/repo or live demo link"
              value={form.previewUrl}
              onChange={e => set('previewUrl', e.target.value)}
            />
          </div>

          {/* Tags */}
          <div style={styles.field}>
            <label style={styles.label}>Tags <span style={{ color: '#55556a', fontWeight: 400 }}>(up to 8)</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ ...styles.input, flex: 1 }}
                placeholder="e.g. react, typescript, dashboard"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button onClick={addTag} style={{ padding: '12px 20px', borderRadius: 10, background: '#1e1e2e', border: '1px solid #2a2a3e', color: '#7C3AED', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Add
              </button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {form.tags.map(t => (
                  <span key={t} style={{ background: '#12121a', border: '1px solid #2a2a3e', padding: '4px 12px', borderRadius: 6, color: '#9898b0', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    #{t}
                    <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', color: '#55556a', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Blockchain info box */}
          <div style={{ background: '#0d0a1a', border: '1px solid #7C3AED33', borderRadius: 14, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 28 }}>🔐</span>
            <div>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Blockchain Ownership on Every Sale</div>
              <div style={{ color: '#55556a', fontSize: 13, lineHeight: 1.7 }}>Every buyer receives a unique SHA-256 certificate permanently linked to their account. Your product is protected and verifiable forever on DevChain.</div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', padding: '18px', borderRadius: 14, background: loading ? '#3a1a6e' : 'linear-gradient(135deg, #7C3AED, #9F67FF)', border: 'none', color: '#fff', fontSize: 17, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 24px rgba(124,58,237,0.35)', transition: 'all 0.2s' }}
          >
            {loading ? 'Listing...' : '🚀 List Product on DevChain'}
          </button>

        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 14, fontWeight: 700, color: '#e2e8f0', letterSpacing: 0.3 },
  input: { background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%', boxSizing: 'border-box' },
};
