import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import EmptyState from '../components/EmptyState';

interface ProductData {
  id: string; title: string; description: string; price: number;
  category: string; downloadsCount: number; createdAt: string;
  seller?: { username: string }; tags?: string[];
}

const CATEGORIES = [
  'all', 'react-components', 'node-packages', 'python-scripts',
  'mobile-templates', 'ui-kits', 'apis', 'tools', 'blockchain', 'other',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Marketplace() {
  const [products, setProducts] = useState<ProductData[]>([]);
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

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({
        search: debouncedSearch || undefined,
        category: category === 'all' ? undefined : category,
      });
      let results = res.data.products || [];

      if (priceMin) results = results.filter((p: ProductData) => p.price >= parseFloat(priceMin));
      if (priceMax) results = results.filter((p: ProductData) => p.price <= parseFloat(priceMax));

      results = [...results].sort((a: ProductData, b: ProductData) => {
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

  useEffect(() => { fetchProducts(); }, [category, sort, debouncedSearch, fetchProducts]);

  const clearFilters = () => { setSearch(''); setCategory('all'); setSort('newest'); setPriceMin(''); setPriceMax(''); };
  const hasActiveFilters = !!(search || category !== 'all' || sort !== 'newest' || priceMin || priceMax);

  return (
    <div className="workspace">
      <div className="container">
        <div className="page-header">
          <div className="page-title">
            <h1>Marketplace</h1>
            <p>
              Discover and buy blockchain-verified code assets
              {!loading && (
                <span style={{ color: 'var(--text-faint)', fontWeight: 400, marginLeft: 8 }}>
                  · {products.length} result{products.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          {isAuthenticated && (
            <button className="btn btn-primary" onClick={() => navigate('/sell')}>List Product</button>
          )}
        </div>

        {/* Controls: search + sort + filter + view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px', minWidth: 200 }}>
            <input
              className="form-control"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="form-control"
              style={{ width: 180, padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', cursor: 'pointer', appearance: 'auto' }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <button
              onClick={() => setShowFilters(f => !f)}
              className="btn btn-outline"
              style={{ height: 42, padding: '0 14px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
            >
              Price{hasActiveFilters ? ' ·' : ''}
            </button>

            <div style={{
              display: 'flex', height: 42,
              border: '1px solid var(--border-solid)', borderRadius: 6, overflow: 'hidden',
            }}>
              {(['grid', 'list'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  style={{
                    padding: '0 12px',
                    background: viewMode === v ? 'var(--text-main)' : 'transparent',
                    border: 'none', color: viewMode === v ? 'var(--bg-void)' : 'var(--text-faint)',
                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    fontFamily: 'var(--font-mono)', transition: 'background 0.2s',
                  }}
                >
                  {v === 'grid' ? 'GRID' : 'LIST'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price filter panel */}
        {showFilters && (
          <div style={{
            border: '1px solid var(--border-solid)', borderRadius: 8,
            padding: '1rem 1.25rem', marginBottom: '1.5rem',
            display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Price range
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" placeholder="Min" value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                className="form-control"
                style={{ width: 90, height: 36, fontSize: '0.8rem' }} />
              <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>—</span>
              <input type="number" placeholder="Max" value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                className="form-control"
                style={{ width: 90, height: 36, fontSize: '0.8rem' }} />
              <button onClick={fetchProducts} className="btn btn-primary" style={{ height: 36, padding: '0 14px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                Apply
              </button>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-outline" style={{ marginLeft: 'auto', height: 36, padding: '0 14px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                Clear
              </button>
            )}
          </div>
        )}

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '2rem', overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0,
                padding: '6px 14px', borderRadius: 100,
                border: `1px solid ${category === cat ? 'var(--text-main)' : 'var(--border-solid)'}`,
                background: category === cat ? 'var(--text-main)' : 'transparent',
                color: category === cat ? 'var(--bg-void)' : 'var(--text-faint)',
                fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-mono)', transition: 'all 0.2s',
                whiteSpace: 'nowrap', lineHeight: 1.4,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: 40, height: 40, border: '3px solid var(--border-faint)',
              borderTop: '3px solid var(--text-main)', borderRadius: '50%',
              animation: 'spin 1s linear infinite', margin: '0 auto',
            }} />
            <p style={{ color: 'var(--text-muted)', marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              Loading products...
            </p>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon="📦"
            title={hasActiveFilters ? 'No matching products' : 'Your marketplace awaits'}
            description={hasActiveFilters
              ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
              : 'Be the first to list a blockchain-verified code asset. DevChain lets you sell code with SHA-256 authenticity certificates.'
            }
            actions={
              hasActiveFilters
                ? [{ label: 'Clear Filters', onClick: clearFilters }]
                : isAuthenticated
                  ? [{ label: 'List Your First Product', onClick: () => navigate('/sell') }]
                  : [{ label: 'Sign In to Start Selling', onClick: () => navigate('/login') }]
            }
          />
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 1, background: 'var(--border-faint)', border: '1px solid var(--border-faint)', borderRadius: 8, overflow: 'hidden' }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product}
                onClick={() => navigate(`/product/${product.id}`)} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {products.map(product => (
              <ProductRow key={product.id} product={product}
                onClick={() => navigate(`/product/${product.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Grid Card (borderless bento) ─── */
function ProductCard({ product, onClick }: { product: ProductData; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-void)',
        padding: '1.5rem 1.5rem',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        transition: 'background 0.3s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-void)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {product.category}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--text-main)' }}>
          ${product.price.toFixed(2)}
        </span>
      </div>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 10, lineHeight: 1.4, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
        {product.title}
      </h3>
      <p style={{
        fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden', flex: 1,
      }}>
        {product.description}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-faint)' }}>
          @{product.seller?.username}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-faint)' }}>
          {product.downloadsCount} sales
        </span>
      </div>
      {product.tags && product.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {product.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-faint)', border: '1px solid var(--border-solid)', borderRadius: 4, padding: '2px 8px' }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── List Row (borderless) ─── */
function ProductRow({ product, onClick }: { product: ProductData; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '1.5rem 0',
        borderBottom: '1px solid var(--border-faint)',
        cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 16, flexWrap: 'wrap',
        transition: 'color 0.2s',
      }}
    >
      <div style={{ flex: '1 1 320px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {product.category}
          </span>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {product.title}
          </h3>
        </div>
        <p style={{
          fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10,
          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', maxWidth: 640,
        }}>
          {product.description}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {product.tags?.slice(0, 4).map((tag: string) => (
            <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-faint)', border: '1px solid var(--border-solid)', borderRadius: 4, padding: '2px 8px' }}>
              #{tag}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--text-main)' }}>
          ${product.price.toFixed(2)}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-faint)' }}>
          @{product.seller?.username} · {product.downloadsCount} sales
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-faint)', border: '1px solid var(--border-solid)', borderRadius: 4, padding: '2px 8px' }}>
          SHA-256 cert
        </span>
      </div>
    </div>
  );
}
