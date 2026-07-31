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
  { value: 'newest', label: '🕐 Newest' },
  { value: 'oldest', label: '📅 Oldest' },
  { value: 'price_asc', label: '💰 Price: Low→High' },
  { value: 'price_desc', label: '💎 Price: High→Low' },
  { value: 'popular', label: '🔥 Most Popular' },
];

const catColors: Record<string, string> = {
  'react-components': '#3b82f6', 'node-packages': '#059669',
  'python-scripts': '#2563EB', 'mobile-templates': '#DC2626',
  'ui-kits': '#D97706', 'apis': '#0891B2', 'tools': '#3b82f6',
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
    <div className="dash-page">
      {/* ─── Header ─── */}
      <div className="dash-header">
        <div className="dash-title">
          <h1>Marketplace</h1>
          <p>
            Discover and buy blockchain-verified code assets
            {!loading && (
              <span style={{ color: 'var(--accent-blue)', fontWeight: 700, marginLeft: 8 }}>
                ({products.length} results)
              </span>
            )}
          </p>
        </div>
        <div className="dash-actions">
          {isAuthenticated && (
            <button className="btn btn-primary" style={{ padding: '0.6rem 1.4rem', fontSize: '0.8rem' }} onClick={() => navigate('/sell')}>
              + List Product
            </button>
          )}
        </div>
      </div>

      {/* ─── Controls Bar ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px', position: 'relative', minWidth: 200 }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-faint)', fontSize: 14, pointerEvents: 'none', lineHeight: 1,
          }}>🔍</span>
          <input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: 40, padding: '0 32px 0 34px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
              borderRadius: 8, color: 'var(--text-main)', fontSize: 14, outline: 'none',
              fontFamily: 'var(--font-display)', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-faint)',
              cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1,
            }}>×</button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              height: 40, padding: '0 28px 0 12px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
              borderRadius: 8, color: 'var(--text-main)',
              fontSize: 13, fontFamily: 'var(--font-mono)', cursor: 'pointer',
              minWidth: 120, outline: 'none', appearance: 'auto',
            }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              height: 40, padding: '0 14px', borderRadius: 8,
              background: showFilters ? 'var(--accent-blue)' : 'var(--bg-surface)',
              border: `1px solid ${showFilters ? 'var(--accent-blue)' : 'var(--border-faint)'}`,
              color: showFilters ? '#fff' : 'var(--text-muted)',
              fontWeight: 600, cursor: 'pointer', fontSize: 13,
              fontFamily: 'var(--font-mono)', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            ⚙️{hasActiveFilters ? ' ●' : ''}
          </button>

          <div style={{
            display: 'flex', height: 40,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-faint)', borderRadius: 8, overflow: 'hidden',
          }}>
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '0 12px',
                background: viewMode === v ? 'var(--bg-panel)' : 'transparent',
                border: 'none', color: viewMode === v ? 'var(--text-main)' : 'var(--text-faint)',
                cursor: 'pointer', fontSize: 16, transition: 'background 0.2s',
                display: 'flex', alignItems: 'center',
              }}>
                {v === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Expandable Price Filter ─── */}
      {showFilters && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
          borderRadius: 10, padding: '0.9rem 1.25rem', marginBottom: '0.9rem',
          display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span style={{
            fontWeight: 700, fontSize: 12, color: 'var(--text-main)',
            fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
          }}>💰 Price</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" placeholder="Min" value={priceMin}
              onChange={e => setPriceMin(e.target.value)}
              style={{
                width: 80, height: 34, background: 'transparent',
                border: '1px solid var(--border-faint)', borderRadius: 6,
                padding: '0 10px', color: 'var(--text-main)', fontSize: 13,
                fontFamily: 'var(--font-display)', outline: 'none',
              }} />
            <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>—</span>
            <input type="number" placeholder="Max" value={priceMax}
              onChange={e => setPriceMax(e.target.value)}
              style={{
                width: 80, height: 34, background: 'transparent',
                border: '1px solid var(--border-faint)', borderRadius: 6,
                padding: '0 10px', color: 'var(--text-main)', fontSize: 13,
                fontFamily: 'var(--font-display)', outline: 'none',
              }} />
            <button onClick={fetchProducts}
              style={{
                height: 34, padding: '0 14px', borderRadius: 6,
                background: 'var(--accent-blue)', border: 'none',
                color: '#fff', fontWeight: 600, cursor: 'pointer',
                fontSize: 12, fontFamily: 'var(--font-mono)',
              }}>
              Apply
            </button>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} style={{
              marginLeft: 'auto', height: 34, padding: '0 14px', borderRadius: 6,
              background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--danger-red)', fontWeight: 600, cursor: 'pointer', fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}>
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/* ─── Category Pills ─── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: '1.75rem',
        overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'thin', scrollbarColor: 'var(--border-faint) transparent',
        WebkitOverflowScrolling: 'touch',
      }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            style={{
              flexShrink: 0,
              background: category === cat ? 'var(--accent-blue)' : 'var(--bg-surface)',
              border: `1px solid ${category === cat ? 'var(--accent-blue)' : 'var(--border-faint)'}`,
              borderRadius: 100, padding: '5px 14px',
              color: category === cat ? '#fff' : 'var(--text-faint)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: 'var(--font-mono)',
              whiteSpace: 'nowrap', lineHeight: 1.4,
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* ─── Products ─── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid var(--border-faint)',
            borderTop: '3px solid var(--accent-blue)', borderRadius: '50%',
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
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 24,
        }}>
          {products.map(product => (
            <ProductCard key={product.id} product={product}
              onClick={() => navigate(`/product/${product.id}`)} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map(product => (
            <ProductRow key={product.id} product={product}
              onClick={() => navigate(`/product/${product.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Grid Card ─── */
function ProductCard({ product, onClick }: { product: ProductData; onClick: () => void }) {
  const color = catColors[product.category] || 'var(--accent-blue)';
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-faint)',
        borderRadius: 16,
        padding: '1.4rem 1.5rem',
        cursor: 'pointer',
        transition: 'border-color 0.3s, transform 0.3s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-solid)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-faint)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{
          background: `${color}22`, color, padding: '4px 10px', borderRadius: 6,
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
        }}>
          {product.category}
        </span>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
          ${product.price.toFixed(2)}
        </span>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, lineHeight: 1.4, color: 'var(--text-main)' }}>
        {product.title}
      </h3>
      <p style={{
        fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {product.description}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
          @{product.seller?.username}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>
          ⬇️ {product.downloadsCount} sales
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {product.tags?.slice(0, 3).map((tag: string) => (
          <span key={tag} style={{
            background: 'var(--bg-panel)', borderRadius: 4, padding: '3px 8px',
            fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)',
          }}>
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── List Row ─── */
function ProductRow({ product, onClick }: { product: ProductData; onClick: () => void }) {
  const color = catColors[product.category] || 'var(--accent-blue)';
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-faint)',
      borderRadius: 14, padding: '18px 24px', cursor: 'pointer',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: 16, flexWrap: 'wrap',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-solid)';
        e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-faint)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{
            background: `${color}22`, color, padding: '3px 8px', borderRadius: 5,
            fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
          }}>
            {product.category}
          </span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
            {product.title}
          </h3>
        </div>
        <p style={{
          fontSize: 13, color: 'var(--text-muted)', marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {product.description}
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          {product.tags?.slice(0, 4).map((tag: string) => (
            <span key={tag} style={{
              background: 'var(--bg-panel)', borderRadius: 4, padding: '2px 6px',
              fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)',
            }}>
              #{tag}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
          ${product.price.toFixed(2)}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          @{product.seller?.username} · ⬇️ {product.downloadsCount}
        </span>
        <span style={{
          fontSize: 11, background: 'rgba(16, 185, 129, 0.07)',
          color: 'var(--success-green)', border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '2px 8px', borderRadius: 5,
        }}>
          🔐 Cert included
        </span>
      </div>
    </div>
  );
}
