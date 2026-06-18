import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '../../@/components/ui/button';
import { Input } from '../../@/components/ui/input';
import { Label } from '../../@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../@/components/ui/select';
import { Textarea } from '../../@/components/ui/textarea';

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
      <div
        style={{
          paddingTop: 64,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 12 }}>
            Product Listed!
          </h2>
          <p style={{ color: '#9898b0' }}>Redirecting to your product page...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <Button
          variant="ghost"
          onClick={() => navigate('/marketplace')}
          style={{ marginBottom: 32, padding: 0 }}
        >
          ← Back to Marketplace
        </Button>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
            List a Product
          </h1>
          <p style={{ color: '#9898b0', fontSize: 16 }}>
            Sell your code, templates, or tools on DevChain and get blockchain ownership
            certificates.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Title */}
          <div style={styles.field}>
            <Label htmlFor="title">Product Title *</Label>
            <Input
              id="title"
              placeholder="e.g. React Dashboard Template with Dark Mode"
              value={form.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('title', e.target.value)}
            />
          </div>

          {/* Description */}
          <div style={styles.field}>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what's included, key features, and why developers should buy it..."
              value={form.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                set('description', e.target.value)
              }
              style={{ height: 140 }}
            />
          </div>

          {/* Price + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={styles.field}>
              <Label htmlFor="price">Price (USD) *</Label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#7C3AED',
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  $
                </span>
                <Input
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
            <div style={styles.field}>
              <Label htmlFor="category">Category *</Label>
              <Select value={form.category} onValueChange={(v: string) => set('category', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview URL */}
          <div style={styles.field}>
            <Label htmlFor="previewUrl">
              Preview URL <span style={{ color: '#55556a', fontWeight: 400 }}>(optional)</span>
            </Label>
            <Input
              id="previewUrl"
              placeholder="https://github.com/you/repo or live demo link"
              value={form.previewUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                set('previewUrl', e.target.value)
              }
            />
          </div>

          {/* Tags */}
          <div style={styles.field}>
            <Label htmlFor="tags">
              Tags <span style={{ color: '#55556a', fontWeight: 400 }}>(up to 8)</span>
            </Label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                id="tags"
                placeholder="e.g. react, typescript, dashboard"
                value={tagInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  e.key === 'Enter' && (e.preventDefault(), addTag())
                }
              />
              <Button onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {form.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      background: '#12121a',
                      border: '1px solid #2a2a3e',
                      padding: '4px 12px',
                      borderRadius: 6,
                      color: '#9898b0',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    #{t}
                    <button
                      onClick={() => removeTag(t)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#55556a',
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

          {/* Blockchain info box */}
          <div
            style={{
              background: '#0d0a1a',
              border: '1px solid #7C3AED33',
              borderRadius: 14,
              padding: 20,
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 28 }}>🔐</span>
            <div>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                Blockchain Ownership on Every Sale
              </div>
              <div style={{ color: '#55556a', fontSize: 13, lineHeight: 1.7 }}>
                Every buyer receives a unique SHA-256 certificate permanently linked to their
                account. Your product is protected and verifiable forever on DevChain.
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: 14,
              fontSize: 17,
              fontWeight: 800,
            }}
          >
            {loading ? 'Listing...' : '🚀 List Product on DevChain'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
};
