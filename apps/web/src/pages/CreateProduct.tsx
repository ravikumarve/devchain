import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const CATEGORIES = [
  { value: 'templates', label: 'Templates' },
  { value: 'tools', label: 'Tools' },
  { value: 'courses', label: 'Courses' },
  { value: 'scripts', label: 'Scripts' },
  { value: 'design-assets', label: 'Design Assets' },
  { value: 'other', label: 'Other' },
];

export default function CreateProduct() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'templates',
    previewUrl: '',
    tags: [] as string[],
  });

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const set = (k: string, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    if (t && !form.tags.includes(t) && form.tags.length < 8) {
      set('tags', [...form.tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) =>
    set(
      'tags',
      form.tags.filter((x) => x !== t)
    );

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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error?.response?.data?.error || 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="workspace" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Product Listed!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            Redirecting to your product page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <div className="container" style={{ maxWidth: 720 }}>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/marketplace')}
          style={{ marginBottom: '2rem', padding: '8px 18px', fontSize: 13 }}
        >
          ← Back to Marketplace
        </button>

        <div className="page-header" style={{ marginBottom: '3rem' }}>
          <div className="page-title">
            <h1>List a Product</h1>
            <p>Sell your code, templates, or tools on DevChain and get blockchain ownership certificates.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 720 }}>
          <div className="form-group" style={{ maxWidth: 'none' }}>
            <label className="form-label" htmlFor="title">Product Title *</label>
            <input
              className="form-control"
              id="title"
              placeholder="e.g. React Dashboard Template with Dark Mode"
              value={form.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('title', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ maxWidth: 'none' }}>
            <label className="form-label" htmlFor="description">Description *</label>
            <textarea
              className="form-control"
              id="description"
              placeholder="Describe what's included, key features, and why developers should buy it..."
              value={form.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                set('description', e.target.value)
              }
              style={{ height: 140, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="form-group" style={{ maxWidth: 'none' }}>
              <label className="form-label" htmlFor="price">Price (USD) *</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: 16,
                  }}
                >
                  $
                </span>
                <input
                  className="form-control"
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="29.99"
                  value={form.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    set('price', e.target.value)
                  }
                  style={{ paddingLeft: 32 }}
                />
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: 'none' }}>
              <label className="form-label" htmlFor="category">Category *</label>
              <select
                className="form-control"
                id="category"
                value={form.category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => set('category', e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: 'none' }}>
            <label className="form-label" htmlFor="previewUrl">
              Preview URL <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              className="form-control"
              id="previewUrl"
              placeholder="https://github.com/you/repo or live demo link"
              value={form.previewUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                set('previewUrl', e.target.value)
              }
            />
          </div>

          <div className="form-group" style={{ maxWidth: 'none' }}>
            <label className="form-label" htmlFor="tags">
              Tags <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(up to 8)</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-control"
                id="tags"
                placeholder="e.g. react, typescript, dashboard"
                value={tagInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  e.key === 'Enter' && (e.preventDefault(), addTag())
                }
              />
              <button onClick={addTag} className="btn btn-outline" style={{ padding: '0 20px', fontSize: 13 }}>
                Add
              </button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {form.tags.map((t) => (
                  <span
                    key={t}
                    className="status-dot"
                    style={{ gap: 6, fontSize: 13, color: 'var(--text-muted)' }}
                  >
                    #{t}
                    <button
                      onClick={() => removeTag(t)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-faint)',
                        cursor: 'pointer',
                        fontSize: 14,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ border: '1px solid var(--border-faint)', borderRadius: 6, padding: '1.25rem 1.5rem', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 28 }}>🔐</span>
            <div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                Blockchain Ownership on Every Sale
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7 }}>
                Every buyer receives a unique SHA-256 certificate permanently linked to their
                account. Your product is protected and verifiable forever on DevChain.
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '18px', fontSize: 17, fontWeight: 700 }}
          >
            {loading ? 'Listing...' : '🚀 List Product on DevChain'}
          </button>
        </div>
      </div>
    </div>
  );
}
