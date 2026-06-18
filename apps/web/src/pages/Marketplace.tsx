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
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'transparent' }}>
      <div className="container" style={{ padding: '48px 2rem' }}>
        {/* ─── Header ─── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 32, flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <h1 style={{
              fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em',
              marginBottom: 8,
            }}>
              🛍️ Marketplace
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
              Discover and buy blockchain-verified code assets
              {!loading && (
                <span style={{ color: 'var(--eth-purple)', fontWeight: 700, marginLeft: 8 }}>
                  ({products.length} results)
                </span>
              )}
            </p>
          </div>
          {isAuthenticated && (
            <button className="btn-primary" onClick={() => navigate('/sell')}
              style={{ padding: '0.6rem 1.8rem', fontSize: 14 }}>
              + List Product
            </button>
          )}
        </div>

        {/* ─── Compact Controls Bar ─── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          flexWrap: 'wrap',
        }}>
          {/* Search — flexible width */}
          <div style={{ flex: '1 1 260px', position: 'relative', minWidth: 200 }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-faint)', fontSize: 14, pointerEvents: 'none', lineHeight: 1,
            }}>
              🔍
            </span>
            <input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: 40, padding: '0 32px 0 34px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
                borderRadius: 8, color: 'var(--text-main)', fontSize: 14, outline: 'none',
                fontFamily: 'var(--font-display)', boxSizing: 'border-box',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-faint)',
                cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1,
              }}>
                ×
              </button>
            )}
          </div>

          {/* Sort + Filter + View Toggle — grouped */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                height: 40, padding: '0 28px 0 12px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
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
                background: showFilters ? 'var(--eth-purple)' : 'var(--bg-surface)',
                border: `1px solid ${showFilters ? 'var(--eth-purple)' : 'var(--border-dim)'}`,
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
              border: '1px solid var(--border-dim)', borderRadius: 8, overflow: 'hidden',
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
            background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
            borderRadius: 10, padding: '14px 20px', marginBottom: 14,
            display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <span style={{
              fontWeight: 700, fontSize: 12, color: 'var(--text-main)',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
            }}>
              💰 Price
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="number" placeholder="Min" value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                style={{
                  width: 80, height: 34, background: 'transparent',
                  border: '1px solid var(--border-dim)', borderRadius: 6,
                  padding: '0 10px', color: 'var(--text-main)', fontSize: 13,
                  fontFamily: 'var(--font-display)', outline: 'none',
                }} />
              <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>—</span>
              <input type="number" placeholder="Max" value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                style={{
                  width: 80, height: 34, background: 'transparent',
                  border: '1px solid var(--border-dim)', borderRadius: 6,
                  padding: '0 10px', color: 'var(--text-main)', fontSize: 13,
                  fontFamily: 'var(--font-display)', outline: 'none',
                }} />
              <button onClick={fetchProducts}
                style={{
                  height: 34, padding: '0 14px', borderRadius: 6,
                  background: 'var(--eth-purple)', border: 'none',
                  color: '#fff', fontWeight: 600, cursor: 'pointer',
                  fontSize: 12, fontFamily: 'var(--font-mono)',
                }}>
                Apply
              </button>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{
                marginLeft: 'auto', height: 34, padding: '0 14px', borderRadius: 6,
                background: 'transparent', border: '1px solid rgba(220,38,38,0.27)',
                color: '#DC2626', fontWeight: 600, cursor: 'pointer', fontSize: 12,
                fontFamily: 'var(--font-mono)',
              }}>
                ✕ Clear
              </button>
            )}
          </div>
        )}

        {/* ─── Category Pills (compact scrollable row) ─── */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 28,
          overflowX: 'auto', paddingBottom: 4,
          scrollbarWidth: 'thin', scrollbarColor: 'var(--border-dim) transparent',
          WebkitOverflowScrolling: 'touch',
        }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0,
                background: category === cat ? 'var(--eth-purple)' : 'var(--bg-surface)',
                border: `1px solid ${category === cat ? 'var(--eth-purple)' : 'var(--border-dim)'}`,
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

        {/* ─── Products List ─── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              width: 40, height: 40, border: '3px solid var(--border-dim)',
              borderTop: '3px solid var(--eth-purple)', borderRadius: '50%',
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
            skeleton={{ count: hasActiveFilters ? 2 : 4, type: 'card' }}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            actions={
              hasActiveFilters
                ? undefined
                : [
                  ...(isAuthenticated
                    ? [{ label: '+ List Your First Product', onClick: () => navigate('/sell') }]
                    : [{ label: 'Sign In to Start Selling', onClick: () => navigate('/login'), variant: 'outline' as const }]
                  ),
                ]
            }
            demos={hasActiveFilters ? undefined : [
              { icon: '⚛️', title: 'React Component Library', description: 'A collection of 40+ accessible UI components built with TypeScript and Tailwind.', badge: 'UI KITS', meta: '$29 · by @componentlab' },
              { icon: '🐍', title: 'ML Pipeline Toolkit', description: 'End-to-end ML pipeline with data processing, training, and deployment scripts.', badge: 'PYTHON-SCRIPTS', meta: '$49 · by @mlengineer' },
              { icon: '📱', title: 'E-Commerce Mobile Template', description: 'React Native iOS/Android storefront with Stripe and admin dashboard.', badge: 'MOBILE-TEMPLATES', meta: '$39 · by @mobilepro' },
              { icon: '🔗', title: 'Solidity Smart Contract Pack', description: 'Audited ERC-721 + ERC-1155 contracts with Hardhat config and tests.', badge: 'BLOCKCHAIN', meta: '$149 · by @soliditydev' },
              { icon: '📦', title: 'Node.js API Boilerplate', description: 'Production-ready Express + Prisma + JWT auth scaffold. PostgreSQL, Redis caching, rate limiting.', badge: 'NODE-PACKAGES', meta: '$19 · by @backenddev' },
              { icon: '🎨', title: 'Tailwind Dashboard Kit', description: '70+ responsive dashboard components — charts, tables, kanban, settings pages. Dark mode included.', badge: 'REACT-COMPONENTS', meta: '$34 · by @uiartist' },
              { icon: '🤖', title: 'OpenAI Chat API Wrapper', description: 'TypeScript SDK for GPT-4o, DALL-E 3, and embeddings. Streaming, rate limits, error handling.', badge: 'APIS', meta: '$24 · by @aidev' },
              { icon: '🛠️', title: 'GitHub Action Workflows', description: '30 reusable CI/CD workflows — deploy, test, lint, security scan, Docker build across Node/Python/Go.', badge: 'TOOLS', meta: '$15 · by @devopspro' },
            ]}
            features={hasActiveFilters ? undefined : [
              { icon: '🔐', title: 'SHA-256 Certified', description: 'Every purchase includes a cryptographic proof of ownership signed on the blockchain.' },
              { icon: '💎', title: 'Set Your Price', description: 'From $1 to $10,000 — you decide the value of your work. No middleman markups.' },
              { icon: '📊', title: 'Analytics Dashboard', description: 'Track sales, revenue, and customer insights in real-time from your seller dashboard.' },
            ]}
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
    </div>
  );
}

/* ─── Grid Card ─── */
function ProductCard({ product, onClick }: { product: ProductData; onClick: () => void }) {
  const color = catColors[product.category] || 'var(--eth-purple)';
  return (
    <div className="card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
      }}>
        <span style={{
          background: `${color}22`, color, padding: '4px 10px', borderRadius: 6,
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
        }}>
          {product.category}
        </span>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--eth-purple)' }}>
          ${product.price.toFixed(2)}
        </span>
      </div>
      <h3 style={{
        fontSize: 18, fontWeight: 700, marginBottom: 8, lineHeight: 1.4,
        color: 'var(--text-main)',
      }}>
        {product.title}
      </h3>
      <p style={{
        fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {product.description}
      </p>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: 12,
      }}>
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
  const color = catColors[product.category] || 'var(--eth-purple)';
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-dim)',
      borderRadius: 14, padding: '18px 24px', cursor: 'pointer',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: 16, flexWrap: 'wrap',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-glow)';
        e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-dim)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
        }}>
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
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
      }}>
        <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--eth-purple)' }}>
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
