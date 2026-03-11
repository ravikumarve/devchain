import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const CATEGORIES = ['all', 'react-components', 'node-packages', 'python-scripts', 'mobile-templates', 'ui-kits', 'apis', 'tools', 'blockchain', 'other'];

const catColors: Record<string, string> = {
  'react-components': '#7C3AED', 'node-packages': '#059669',
  'python-scripts': '#2563EB', 'mobile-templates': '#DC2626',
  'ui-kits': '#D97706', 'apis': '#0891B2', 'tools': '#7C3AED',
  'blockchain': '#F59E0B', 'other': '#6B7280',
};

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({
        search: search || undefined,
        category: category === 'all' ? undefined : category,
      });
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.inner}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>🛍️ Marketplace</h1>
            <p style={styles.subtitle}>Discover and buy blockchain-verified code assets</p>
          </div>
          {isAuthenticated && (
            <button className="btn-primary" onClick={() => navigate('/sell')}>
              + List Product
            </button>
          )}
        </div>

        {/* Search */}
        <div style={styles.searchRow}>
          <input
            placeholder="Search products, templates, tools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchProducts()}
            style={styles.searchInput}
          />
          <button className="btn-primary" onClick={fetchProducts}>Search</button>
        </div>

        {/* Categories */}
        <div style={styles.cats}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                ...styles.catBtn,
                ...(category === cat ? styles.catBtnActive : {}),
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <p style={{ color: '#9898b0', marginTop: 16 }}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: 48 }}>📦</p>
            <h3>No products found</h3>
            <p style={{ color: '#9898b0' }}>Be the first to list a product!</p>
            {isAuthenticated && (
              <button className="btn-primary" onClick={() => navigate('/sell')} style={{ marginTop: 16 }}>
                + List Product
              </button>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {products.map(product => (
              <div
                key={product.id}
                className="card"
                style={styles.productCard}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div style={styles.cardTop}>
                  <span style={{ ...styles.catBadge, background: (catColors[product.category] || '#7C3AED') + '22', color: catColors[product.category] || '#7C3AED' }}>
                    {product.category}
                  </span>
                  <span style={styles.price}>${product.price.toFixed(2)}</span>
                </div>

                <h3 style={styles.productTitle}>{product.title}</h3>
                <p style={styles.productDesc}>{product.description}</p>

                <div style={styles.cardFooter}>
                  <span style={styles.seller}>@{product.seller?.username}</span>
                  <span style={styles.downloads}>⬇️ {product.downloadsCount} sales</span>
                </div>

                <div style={styles.tags}>
                  {product.tags?.slice(0, 3).map((tag: string) => (
                    <span key={tag} style={styles.tag}>#{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { paddingTop: 64, minHeight: '100vh' },
  inner: { maxWidth: 1200, margin: '0 auto', padding: '48px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 40, fontWeight: 800, marginBottom: 8 },
  subtitle: { color: '#9898b0', fontSize: 16 },
  searchRow: { display: 'flex', gap: 12, marginBottom: 24 },
  searchInput: { flex: 1 },
  cats: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 },
  catBtn: { background: '#0d0d12', border: '1px solid #1e1e2e', borderRadius: 20, padding: '6px 14px', color: '#9898b0', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' },
  catBtnActive: { background: '#7C3AED', borderColor: '#7C3AED', color: '#fff' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 },
  productCard: { cursor: 'pointer' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  catBadge: { padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 },
  price: { fontSize: 22, fontWeight: 800, color: '#7C3AED' },
  productTitle: { fontSize: 18, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 },
  productDesc: { fontSize: 14, color: '#9898b0', lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 },
  seller: { fontSize: 13, color: '#55556a' },
  downloads: { fontSize: 13, color: '#55556a' },
  tags: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tag: { background: '#12121a', borderRadius: 4, padding: '3px 8px', fontSize: 12, color: '#55556a' },
  loading: { textAlign: 'center', padding: '80px 0' },
  spinner: { width: 40, height: 40, border: '3px solid #1e1e2e', borderTop: '3px solid #7C3AED', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' },
  empty: { textAlign: 'center', padding: '80px 0' },
};
