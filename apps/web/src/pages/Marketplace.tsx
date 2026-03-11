import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const CATEGORIES = ['all', 'react-components', 'node-packages', 'python-scripts', 'mobile-templates', 'ui-kits', 'apis', 'tools', 'blockchain', 'other'];
const SORT_OPTIONS = [
  { value: 'newest', label: '🕐 Newest' },
  { value: 'oldest', label: '📅 Oldest' },
  { value: 'price_asc', label: '💰 Price: Low→High' },
  { value: 'price_desc', label: '💎 Price: High→Low' },
  { value: 'popular', label: '🔥 Most Popular' },
];

const catColors: Record<string, string> = {
  'react-components': '#7C3AED', 'node-packages': '#059669',
  'python-scripts': '#2563EB', 'mobile-templates': '#DC2626',
  'ui-kits': '#D97706', 'apis': '#0891B2', 'tools': '#7C3AED',
  'blockchain': '#F59E0B', 'other': '#6B7280',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => { fetchProducts(); }, [category, sort, debouncedSearch]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({
        search: debouncedSearch || undefined,
        category: category === 'all' ? undefined : category,
      });
      let results = res.data.products || [];

      // Client-side price filter
      if (priceMin) results = results.filter((p: any) => p.price >= parseFloat(priceMin));
      if (priceMax) results = results.filter((p: any) => p.price <= parseFloat(priceMax));

      // Client-side sort
      results = [...results].sort((a: any, b: any) => {
        if (sort === 'price_asc') return a.price - b.price;
        if (sort === 'price_desc') return b.price - a.price;
        if (sort === 'popular') return b.downloadsCount - a.downloadsCount;
        if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setProducts(results);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [category, sort, debouncedSearch, priceMin, priceMax]);

  const clearFilters = () => { setSearch(''); setCategory('all'); setSort('newest'); setPriceMin(''); setPriceMax(''); };
  const hasActiveFilters = search || category !== 'all' || sort !== 'newest' || priceMin || priceMax;

  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 8 }}>🛍️ Marketplace</h1>
            <p style={{ color: '#9898b0', fontSize: 16 }}>
              Discover and buy blockchain-verified code assets
              {!loading && <span style={{ color: '#7C3AED', fontWeight: 700, marginLeft: 8 }}>({products.length} results)</span>}
            </p>
          </div>
          {isAuthenticated && (
            <button className="btn-primary" onClick={() => navigate('/sell')}>+ List Product</button>
          )}
        </div>

        {/* Search row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#55556a', fontSize: 16 }}>🔍</span>
            <input
              placeholder="Search products, templates, tools..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 40, boxSizing: 'border-box', background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 10, padding: '12px 14px 12px 40px', color: '#fff', fontSize: 15, fontFamily: 'Inter, sans-serif', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#55556a', cursor: 'pointer', fontSize: 16 }}>×</button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, fontFamily: 'Inter, sans-serif', cursor: 'pointer', minWidth: 180 }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{ padding: '12px 18px', borderRadius: 10, background: showFilters ? '#7C3AED' : '#0d0d12', border: `1px solid ${showFilters ? '#7C3AED' : '#1e1e2e'}`, color: showFilters ? '#fff' : '#9898b0', fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
          >
            ⚙️ Filters {hasActiveFilters ? '●' : ''}
          </button>

          {/* View toggle */}
          <div style={{ display: 'flex', background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 10, overflow: 'hidden' }}>
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{ padding: '12px 14px', background: viewMode === v ? '#1e1e2e' : 'transparent', border: 'none', color: viewMode === v ? '#fff' : '#55556a', cursor: 'pointer', fontSize: 16 }}>
                {v === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>

        {/* Expandable price filter */}
        {showFilters && (
          <div style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 12, padding: '20px 24px', marginBottom: 16, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>💰 Price Range:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="number" placeholder="Min $" value={priceMin} onChange={e => setPriceMin(e.target.value)}
                style={{ width: 100, background: '#07070d', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, fontFamily: 'Inter, sans-serif' }} />
              <span style={{ color: '#55556a' }}>—</span>
              <input type="number" placeholder="Max $" value={priceMax} onChange={e => setPriceMax(e.target.value)}
                style={{ width: 100, background: '#07070d', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, fontFamily: 'Inter, sans-serif' }} />
              <button onClick={fetchProducts} style={{ padding: '8px 16px', borderRadius: 8, background: '#7C3AED', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>Apply</button>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid #DC262644', color: '#DC2626', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
                ✕ Clear All
              </button>
            )}
          </div>
        )}

        {/* Categories */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ background: category === cat ? '#7C3AED' : '#0d0d12', border: `1px solid ${category === cat ? '#7C3AED' : '#1e1e2e'}`, borderRadius: 20, padding: '6px 14px', color: category === cat ? '#fff' : '#9898b0', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #1e1e2e', borderTop: '3px solid #7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ color: '#9898b0', marginTop: 16 }}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 48 }}>📦</p>
            <h3 style={{ marginBottom: 8 }}>No products found</h3>
            <p style={{ color: '#9898b0', marginBottom: 20 }}>
              {hasActiveFilters ? 'Try adjusting your filters' : 'Be the first to list a product!'}
            </p>
            {hasActiveFilters && <button onClick={clearFilters} style={{ padding: '10px 20px', borderRadius: 10, background: '#7C3AED', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: 12 }}>Clear Filters</button>}
            {isAuthenticated && <div><button className="btn-primary" onClick={() => navigate('/sell')} style={{ marginTop: 8 }}>+ List Product</button></div>}
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
            {products.map(product => <ProductCard key={product.id} product={product} onClick={() => navigate(`/product/${product.id}`)} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {products.map(product => <ProductRow key={product.id} product={product} onClick={() => navigate(`/product/${product.id}`)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, onClick }: { product: any; onClick: () => void }) {
  const color = catColors[product.category] || '#7C3AED';
  return (
    <div className="card" onClick={onClick} style={{ cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#7C3AED44'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#1e1e2e'; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ background: color + '22', color, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{product.category}</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#7C3AED' }}>${product.price.toFixed(2)}</span>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, lineHeight: 1.4, color: '#fff' }}>{product.title}</h3>
      <p style={{ fontSize: 14, color: '#9898b0', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#55556a' }}>@{product.seller?.username}</span>
        <span style={{ fontSize: 13, color: '#55556a' }}>⬇️ {product.downloadsCount} sales</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {product.tags?.slice(0, 3).map((tag: string) => (
          <span key={tag} style={{ background: '#12121a', borderRadius: 4, padding: '3px 8px', fontSize: 12, color: '#55556a' }}>#{tag}</span>
        ))}
      </div>
    </div>
  );
}

function ProductRow({ product, onClick }: { product: any; onClick: () => void }) {
  const color = catColors[product.category] || '#7C3AED';
  return (
    <div onClick={onClick} style={{ background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 14, padding: '18px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#7C3AED44'; e.currentTarget.style.transform = 'translateX(4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e2e'; e.currentTarget.style.transform = 'translateX(0)'; }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ background: color + '22', color, padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>{product.category}</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{product.title}</h3>
        </div>
        <p style={{ fontSize: 13, color: '#9898b0', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {product.tags?.slice(0, 4).map((tag: string) => (
            <span key={tag} style={{ background: '#12121a', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: '#55556a' }}>#{tag}</span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: '#7C3AED' }}>${product.price.toFixed(2)}</span>
        <span style={{ fontSize: 12, color: '#55556a' }}>@{product.seller?.username} · ⬇️ {product.downloadsCount}</span>
        <span style={{ fontSize: 11, background: '#05966911', color: '#059669', border: '1px solid #05966933', padding: '2px 8px', borderRadius: 5 }}>🔐 Cert included</span>
      </div>
    </div>
  );
}
