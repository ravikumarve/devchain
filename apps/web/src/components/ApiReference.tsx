const apiRoutes = [
  { cat: 'Product Operations', routes: [
    { method: 'GET', route: '/api/v1/products', auth: 'Public' },
    { method: 'GET', route: '/api/v1/products/:id', auth: 'Public' },
    { method: 'POST', route: '/api/v1/products', auth: 'Seller' },
    { method: 'GET', route: '/api/v1/products/seller/me', auth: 'Seller' },
  ]},
  { cat: 'Authentication & Users', routes: [
    { method: 'POST', route: '/api/v1/auth/register', auth: 'Public' },
    { method: 'POST', route: '/api/v1/auth/login', auth: 'Public' },
    { method: 'GET', route: '/api/v1/auth/me', auth: 'Authenticated' },
  ]},
];

const methodColor: Record<string, string> = {
  GET: '#3b82f6',
  POST: 'var(--success-green)',
  PUT: '#f59e0b',
  PATCH: '#f59e0b',
  DELETE: '#ef4444',
};

const authColor: Record<string, string> = {
  Public: 'var(--text-faint)',
  Seller: 'var(--eth-purple)',
  Authenticated: 'var(--text-main)',
};

function ApiMethod({ method }: { method: string }) {
  return (
    <span className="api-method" style={{ color: methodColor[method] || '#fff' }}>
      {method}
    </span>
  );
}

function ApiAuth({ auth }: { auth: string }) {
  return (
    <span
      className="api-auth"
      style={{
        color: authColor[auth] || 'var(--text-muted)',
        borderColor: auth === 'Public' ? 'var(--border-dim)' : 'var(--eth-purple-dim)',
        background: auth === 'Public' ? 'transparent' : 'rgba(98, 126, 234, 0.05)',
      }}
    >
      {auth}
    </span>
  );
}

export default function ApiReference() {
  return (
    <div className="api-block">
      <h3 style={{
        fontSize: '1.25rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-main)',
        marginBottom: '2rem',
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}>
        REST API Reference
      </h3>

      {apiRoutes.map((section) => (
        <div key={section.cat}>
          <div className="api-cat">{section.cat}</div>
          {section.routes.map((r) => (
            <div key={r.route} style={{ marginBottom: '1rem' }}>
              <ApiMethod method={r.method} />{' '}
              <span className="api-route">{r.route}</span>{' '}
              <ApiAuth auth={r.auth} />
            </div>
          ))}
        </div>
      ))}

      <div className="api-cat" style={{ marginTop: '3rem' }}>
        Example Request Payload
      </div>
      <div className="api-example">
        <span style={{ color: 'var(--text-faint)' }}>// POST /api/v1/products</span><br />
        {'{'}<br />
        &nbsp;&nbsp;<span style={{ color: 'var(--text-muted)' }}>"title"</span>:{' '}
        <span style={{ color: 'var(--success-green)' }}>"React Dashboard Template"</span>,<br />
        &nbsp;&nbsp;<span style={{ color: 'var(--text-muted)' }}>"price"</span>:{' '}
        <span style={{ color: 'var(--eth-purple)' }}>29.99</span>,<br />
        &nbsp;&nbsp;<span style={{ color: 'var(--text-muted)' }}>"category"</span>:{' '}
        <span style={{ color: 'var(--success-green)' }}>"templates"</span>,<br />
        &nbsp;&nbsp;<span style={{ color: 'var(--text-muted)' }}>"tags"</span>:{' '}
        [<span style={{ color: 'var(--success-green)' }}>"react"</span>,{' '}
        <span style={{ color: 'var(--success-green)' }}>"typescript"</span>]<br />
        {'}'}
      </div>
    </div>
  );
}
