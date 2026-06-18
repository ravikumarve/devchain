import { Link } from 'react-router-dom';

export default function CtaBand() {
  return (
    <section style={{ padding: '2rem 0', border: 'none' }}>
      <div className="cta-band">
        <h2>Deploy the DevChain ecosystem.</h2>
        <p>
          Download the open-source repository, configure your environment
          variables, and launch the marketplace locally in under 3 minutes.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '1rem',
          }}
        >
          <a
            href="https://github.com/ravikumarve/devchain"
            className="btn btn-primary"
          >
            Clone Repository
          </a>
          <Link to="/marketplace" className="btn btn-outline">
            Explore Live Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
