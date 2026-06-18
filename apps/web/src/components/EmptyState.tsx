import type { ReactNode } from 'react';

interface Action {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'outline';
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface DemoItem {
  icon?: string;
  title: string;
  description: string;
  meta?: string;
  badge?: string;
}

interface SkeletonConfig {
  count: number;
  type: 'card' | 'list' | 'chart';
}

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string | ReactNode;
  actions?: Action[];
  features?: Feature[];
  demos?: DemoItem[];
  skeleton?: SkeletonConfig;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export default function EmptyState({
  icon, title, description, actions,
  features, demos, skeleton, hasActiveFilters, onClearFilters,
}: EmptyStateProps) {
  return (
    <div style={styles.wrapper}>
      {/* Skeleton placeholders (shown to hint at layout) */}
      {skeleton && (
        <div style={{ marginBottom: 32 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: skeleton.type === 'list'
              ? '1fr'
              : 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {Array.from({ length: skeleton.count }).map((_, i) => (
              <SkeletonCard key={i} type={skeleton.type} />
            ))}
          </div>
        </div>
      )}

      {/* Main empty message */}
      <div style={styles.main}>
        <div style={styles.iconWrap}>
          <span style={styles.icon}>{icon}</span>
        </div>
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.desc}>{description}</div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div style={styles.actions}>
            {actions.map((a, i) => (
              <button
                key={i}
                className={a.variant === 'outline' ? 'btn-outline' : 'btn-primary'}
                onClick={a.onClick}
                style={{
                  padding: '10px 22px',
                  fontSize: 13,
                  ...(a.variant === 'outline' ? { borderColor: 'var(--border-dim)' } : {}),
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {/* Clear filters */}
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={onClearFilters}
            style={{
              marginTop: 12, padding: '8px 18px', borderRadius: 8,
              background: 'transparent', border: '1px solid rgba(220,38,38,0.27)',
              color: '#DC2626', fontWeight: 600, cursor: 'pointer', fontSize: 13,
              fontFamily: 'var(--font-mono)',
            }}
          >
            ✕ Clear all filters
          </button>
        )}
      </div>

      {/* Feature education blocks */}
      {features && features.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h4 style={{
            textAlign: 'center', fontSize: 15, fontWeight: 700,
            color: 'var(--text-muted)', marginBottom: 20,
            fontFamily: 'var(--font-mono)', letterSpacing: 1,
            textTransform: 'uppercase',
          }}>
            ✦ What You Can Do
          </h4>
          <div className="feature-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-block">
                <span className="icon">{f.icon}</span>
                <h4>{f.title}</h4>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo preview cards */}
      {demos && demos.length > 0 && (
        <div style={{ marginTop: features ? 16 : 48 }}>
          <h4 style={{
            textAlign: 'center', fontSize: 13, fontWeight: 700,
            color: 'var(--text-faint)', marginBottom: 20,
            fontFamily: 'var(--font-mono)', letterSpacing: 1,
          }}>
            ── PREVIEW ──
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {demos.map((d, i) => (
              <div key={i} className="demo-card">
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 12,
                }}>
                  <span style={{
                    background: 'rgba(98,126,234,0.12)',
                    color: 'var(--eth-purple)',
                    padding: '4px 10px', borderRadius: 6,
                    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                  }}>
                    {d.badge || 'EXAMPLE'}
                  </span>
                  {d.icon && <span style={{ fontSize: 22 }}>{d.icon}</span>}
                </div>
                <h4 style={{
                  fontSize: 16, fontWeight: 700, color: 'var(--text-main)',
                  marginBottom: 6, letterSpacing: '-0.02em',
                }}>
                  {d.title}
                </h4>
                <p style={{
                  fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
                  marginBottom: 10,
                }}>
                  {d.description}
                </p>
                {d.meta && (
                  <div style={{
                    fontSize: 11, color: 'var(--text-faint)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {d.meta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonCard({ type }: { type: 'card' | 'list' | 'chart' }) {
  if (type === 'chart') {
    return (
      <div className="skeleton-card" style={{ padding: 24, minHeight: 200 }}>
        <div className="skeleton skeleton-block" style={{ width: '50%', height: 16, marginBottom: 20 }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, marginTop: 20 }}>
          {[50, 70, 85, 60, 90, 45, 75].map((h, i) => (
            <div key={i} className="skeleton" style={{
              flex: 1, height: `${h}%`,
              borderRadius: '4px 4px 0 0',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-block-sm" style={{ width: `${25 + i * 10}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="skeleton-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div className="skeleton skeleton-badge" />
              <div className="skeleton skeleton-badge" style={{ width: 60 }} />
            </div>
            <div className="skeleton skeleton-block" style={{ width: '70%', height: 18 }} />
            <div className="skeleton skeleton-block-sm" style={{ width: '45%' }} />
            <div className="skeleton skeleton-block-sm" style={{ width: '30%' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="skeleton skeleton-price" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{
              width: `${50 + i * 20}px`, height: 22, borderRadius: 6,
            }} />
          ))}
        </div>
      </div>
    );
  }

  // card
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="skeleton skeleton-badge" />
        <div className="skeleton skeleton-price" />
      </div>
      <div className="skeleton skeleton-block" style={{ width: '85%', height: 18 }} />
      <div className="skeleton skeleton-block" style={{ width: '100%', height: 14 }} />
      <div className="skeleton skeleton-block-sm" style={{ width: '60%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
        <div className="skeleton" style={{ width: 80, height: 14, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 60, height: 14, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{
            width: `${40 + i * 15}px`, height: 20, borderRadius: 4,
          }} />
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    padding: '40px 0',
  },
  main: {
    textAlign: 'center',
    maxWidth: 480,
    margin: '0 auto',
  },
  iconWrap: {
    fontSize: 56,
    marginBottom: 16,
    lineHeight: 1,
  },
  icon: {
    display: 'inline-block',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-main)',
    marginBottom: 12,
    letterSpacing: '-0.02em',
  },
  desc: {
    fontSize: 15,
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    marginBottom: 24,
  },
  actions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
};
