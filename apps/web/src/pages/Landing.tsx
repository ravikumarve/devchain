import { Link } from 'react-router-dom';

const FEATURES = [
  {
    tag: '🛡️ Escrow Engine',
    col: 'col-8',
    title: 'Secure Job Contracts',
    desc: 'Post jobs, accept proposals, and lock funds securely in Stripe. The platform holds the money until the freelancer delivers the work, preventing disputes and building trust automatically.',
  },
  {
    tag: '🛍️ Commerce',
    col: 'col-4',
    title: 'Digital Products',
    desc: 'Sell templates, tools, and courses. Includes instant file delivery, verified reviews, and SHA-256 ownership certificates.',
  },
  {
    tag: '🗄️ Architecture',
    col: 'col-6',
    title: 'Dual-Mode Database',
    desc: 'Run locally with SQLite and local file storage for rapid offline dev. Flip a script to instantly use PostgreSQL (Supabase) and signed URLs for production.',
  },
  {
    tag: '💬 Communication',
    col: 'col-6',
    title: 'Real-Time Chat',
    desc: 'Integrated buyer/seller messaging. Includes optimistic UI updates, error recovery, unread badges, and non-blocking in-app notifications.',
  },
];

const STACK = [
  ['Frontend Client', 'React 19 + TypeScript'],
  ['Backend API', 'Node.js + Express'],
  ['Database ORM', 'Prisma (SQLite/Postgres)'],
  ['Payments & Escrow', 'Stripe (test-mode ready)'],
  ['Mobile App', 'React Native (Expo)'],
  ['Local Dev Mode', 'No Docker — Node only'],
];

const MAKER_STATS = [
  ['8', 'Products sold on the live demo'],
  ['6', 'Active jobs with escrow'],
  ['1', 'Production crash — fixed & shipped back'],
];

const CREDS = [
  ['Seller', 'demo-seller@devchain.dev', 'Demo1234'],
  ['Client', 'demo-client@devchain.dev', 'Demo1234'],
  ['Buyer', 'demo-buyer@devchain.dev', 'Demo1234'],
];

const STARTER_FEATURES = [
  'Web app + backend source code',
  'Escrow payments with Stripe webhooks',
  'In-app chat with auto-conversations',
  'Seller analytics dashboard',
  'SHA-256 ownership verification',
  'SQLite local mode + demo data',
  '187 automated tests',
  'Deployment guide (Supabase + Vercel + Render)',
  'Lifetime updates',
];

const PRO_FEATURES = [
  'Everything in Starter',
  'Expo mobile app — marketplace, chat, analytics, jobs',
  'Extended deployment + mobile build guide',
  'Priority email support',
  '30-day money-back guarantee',
];

const COMPARE_HEADERS = ['', 'DevChain', 'ShipFast Marketplace', 'MakerKit Marketplace', 'Fiverr Clone Scripts'];
const COMPARE_ROWS: Array<[string, string, string, string, string]> = [
  ['Price', '$149 1×', '$349 1×', '$299/yr', '$499–3,000 1×'],
  ['Stack', 'Express + React + Expo', 'Next.js', 'Next.js', 'PHP / CodeIgniter'],
  ['Escrow payments', '✅ Built', '❌ Not included', '⚠️ Manual only', '⚠️ Varies'],
  ['In-app chat', '✅ Built', '❌', '❌', '⚠️ Varies'],
  ['Seller analytics', '✅ Built', '❌', '❌', '❌'],
  ['Mobile app', '✅ Pro tier', '❌', '❌', 'Extra $'],
  ['Test suite', '✅ 187 tests', '❌', '❌', '❌'],
  ['Docker-free local dev', '✅ SQLite', '❌', '❌', '⚠️'],
  ['Source ownership', '✅ Yours', '✅', '⚠️ Subscription', '✅'],
];

const FAQS = [
  ['Do I need Docker?', 'No. Local mode uses SQLite + local file storage. Node.js 20+ is the only requirement — the entire stack boots on any laptop.'],
  ['Can I really run this in 5 minutes?', 'Yes. npm run setup:local installs dependencies, creates the database, seeds demo data, and prints the two commands to start backend + web. Then open http://localhost:5173.'],
  ['What about payments? Do I need a Stripe account?', 'Stripe test mode works out of the box — you can walk the full escrow flow with test cards. Live mode needs free Stripe keys, configured in .env.'],
  ['How do I deploy to production?', 'The included deployment guide walks you through Supabase (database + storage), Vercel (frontend), and Render (backend) — all free tiers. This exact pipeline has been tested end-to-end.'],
  ['Can I use this for client work?', 'Yes. Unlimited projects, one-time license. (You may not resell or redistribute the source as a competing boilerplate.)'],
  ['The code is Express, not Next.js — why?', 'The API/mobile/web separation is the architecture real products use. Your mobile app reuses the same API, and you\'re not locked into a single framework\'s ecosystem. If you\'re building on Next.js, this isn\'t for you.'],
  ['What if I get stuck?', 'Email support is included (Pro gets priority). The repo ships with AGENTS.md so AI coding tools can help you navigate and extend it.'],
];

function cellClass(idx: number, value: string): string {
  if (idx === 1) return 'cell-mf';
  if (value.startsWith('✅')) return 'cell-yes';
  if (value.startsWith('❌')) return 'cell-no';
  if (value.startsWith('⚠️')) return 'cell-warn';
  if (idx === 0 && /^\$/.test(value)) return 'cell-price';
  if (idx > 0 && /^\$/.test(value)) return 'cell-price';
  return '';
}

export default function Landing() {
  return (
    <div className="landing-page">
      {/* ─── HERO ─── */}
      <section className="hero no-border">
        <div>
          <div className="hero-badge">
            <span className="ping" /> 187 Automated Tests Passing
          </div>
          <h1>
            The marketplace boilerplate <br />you actually own.
          </h1>
          <p>
            Sell digital products, run a job board with escrow, and let buyers
            &amp; sellers chat — all in your own code. Ship your platform this
            weekend without vendor lock-in.
          </p>
          <div className="hero-ctas">
            <Link to="/dashboard" className="btn-primary">Explore Dashboard</Link>
            <a
              href="https://github.com/ravikumarve/devchain"
              className="btn-outline"
            >
              View Source
            </a>
            <a href="#pricing" className="btn-accent">Get the Boilerplate</a>
          </div>
        </div>

        {/* CLI Mockup */}
        <div className="cli-mockup">
          <div className="cli-header">
            <span>Terminal ~ /devchain</span>
            <span>Local Mode Active</span>
          </div>
          <div className="cli-body">
            <div>$ <span className="c-cmd">npm run setup:local</span></div>
            <div className="c-sys">[Info] Migrating SQLite database...</div>
            <div className="c-sys">[Info] Seeding 8 products, 6 jobs...</div>
            <br />
            <div>$ <span className="c-cmd">npm run dev --prefix backend</span></div>
            <div><span className="c-ok">✔</span> Backend API live on localhost:10000</div>
            <br />
            <div>$ <span className="c-cmd">npm run dev --prefix apps/web</span></div>
            <div><span className="c-ok">✔</span> React 19 Web App live on localhost:5173</div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES BENTO ─── */}
      <section id="features">
        <div className="section-header">
          <h2>Production Ready.</h2>
          <p>
            DevChain ships with the hard parts of a two-sided marketplace
            already solved. Swap the DB mode to push to production instantly.
          </p>
        </div>

        <div className="bento-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className={`bento-card ${f.col}`}>
              <span className="bc-tag">{f.tag}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── STACK / ARCHITECTURE ─── */}
      <section id="stack" className="stack-section no-border">
        <div>
          <h2>
            Engineered for <br />scale.
          </h2>
          <p className="stack-lead">
            We stripped away the ephemeral hype stack. DevChain relies on
            standard, deeply-tested JavaScript and TypeScript patterns.
          </p>
          <div className="stack-stats">
            <div><span>187</span> Automated Tests</div>
            <div><span>14</span> Mobile Screens</div>
          </div>
        </div>

        <div>
          <ul className="stack-list">
            {STACK.map(([label, value]) => (
              <li key={label}>
                {label}
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── MAKER STRIP ─── */}
      <section className="maker-strip no-border">
        <div>
          <h2>
            Built in production.<br />Fixed in production.
          </h2>
          <p className="maker-lead">
            DevChain ran live as a real marketplace before it was packaged.
            Every feature you buy survived real users, real money, and a real
            production outage that went back into the code.
          </p>
        </div>
        <div className="stat-grid">
          {MAKER_STATS.map(([val, label]) => (
            <div key={label} className="stat">
              <span className="s-val">{val}</span>
              <span className="s-lbl">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── LIVE DEMO ─── */}
      <section id="demo" className="no-border">
        <div className="demo-box">
          <div className="section-header" style={{ marginBottom: '2rem' }}>
            <h2>Try it before you buy it.</h2>
            <p>
              Open the live dashboard and log in with any demo account. Chat,
              escrow, and analytics are fully working.
            </p>
          </div>
          <div className="demo-cred">
            {CREDS.map(([role, mail, pass]) => (
              <div key={mail} className="cred">
                <div className="c-role">{role}</div>
                <div className="c-mail">{mail}</div>
                <div className="c-pass">{pass}</div>
              </div>
            ))}
          </div>
          <div className="hero-ctas" style={{ marginTop: '2rem' }}>
            <Link to="/dashboard" className="btn-primary">Open Live Dashboard</Link>
            <a href="https://github.com/ravikumarve/devchain" className="btn-outline">
              Read the README
            </a>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing">
        <div className="section-header">
          <h2>One-time. Yours forever.</h2>
          <p>No subscriptions. No per-project licensing. Use it on unlimited projects.</p>
        </div>

        <div className="pricing-grid">
          {/* Starter */}
          <div className="price-card">
            <span className="p-tier">Starter</span>
            <div className="p-price">$149 <span className="p-per">one-time</span></div>
            <p className="p-desc">
              The full two-sided marketplace. Everything you need to launch
              your own platform.
            </p>
            <ul>
              {STARTER_FEATURES.map((f) => (
                <li key={f}><span className="p-check">✓</span>{f}</li>
              ))}
            </ul>
            <a href="https://devchain.gumroad.com" className="btn-primary buy-btn">
              Buy Starter — $149
            </a>
          </div>

          {/* Pro */}
          <div className="price-card featured">
            <span className="p-tier pro-tier">Pro — Most Popular</span>
            <div className="p-price">$249 <span className="p-per">one-time</span></div>
            <p className="p-desc">Everything in Starter, plus the Expo mobile app and extended support.</p>
            <ul>
              {PRO_FEATURES.map((f) => (
                <li key={f}><span className="p-check">✓</span>{f}</li>
              ))}
            </ul>
            <a href="https://devchain.gumroad.com" className="btn-accent buy-btn">
              Buy Pro — $249
            </a>
          </div>
        </div>
        <p className="price-note">
          FOUNDING OFFER: first 20 buyers get the Pro tier for $97 — then it goes up to $249.
        </p>
      </section>

      {/* ─── COMPARISON ─── */}
      <section id="compare" className="no-border">
        <div className="section-header">
          <h2>Why not just use ShipFast?</h2>
          <p>Because a marketplace is not a landing page. Compare what you actually get.</p>
        </div>

        <div className="compare-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                {COMPARE_HEADERS.map((h, i) => (
                  <th key={h || i}>
                    {h}
                    {h === 'DevChain' && <span className="tag-mf">YOU</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className={cellClass(c, cell)}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="no-border">
        <div className="section-header">
          <h2>Questions, answered.</h2>
          <p>The objections, handled before you ask.</p>
        </div>

        <div className="faq-list">
          {FAQS.map(([q, a]) => (
            <details key={q} className="faq-item">
              <summary>{q}</summary>
              <div className="faq-a">{a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bp-footer">
        <div className="f-brand">
          <a href="/" className="logo">
            <span className="logo-diamond" />
            DevChain
          </a>
          <p>
            The two-sided marketplace boilerplate you actually own. Build, ship,
            and scale without vendor lock-in.
          </p>
        </div>

        <div className="f-links">
          <div className="f-col">
            <h5>Product</h5>
            <ul>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/dashboard">Web Dashboard</Link></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div className="f-col">
            <h5>Resources</h5>
            <ul>
              <li><a href="https://github.com/ravikumarve/devchain">GitHub Repo</a></li>
              <li><a href="https://github.com/ravikumarve/devchain">Documentation</a></li>
              <li><a href="https://devchain.gumroad.com">Buy on Gumroad</a></li>
            </ul>
          </div>
        </div>
      </footer>

      <div className="f-bottom">
        <div>© 2026 DEVCHAIN. ONE-TIME LICENSE, UNLIMITED PROJECTS.</div>
        <div>STATUS: <span className="f-ok">ALL SYSTEMS NOMINAL</span></div>
      </div>
    </div>
  );
}
