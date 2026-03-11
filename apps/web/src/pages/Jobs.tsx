import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    jobsAPI.getAll().then(res => setJobs(res.data.jobs)).finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>💼 Job Board</h1>
            <p style={styles.subtitle}>Find freelance work or hire DevChain developers</p>
          </div>
          {isAuthenticated && (
            <button className="btn-primary" style={{ background: '#059669' }} onClick={() => navigate('/post-job')}>
              + Post a Job
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9898b0' }}>Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: 48 }}>💼</p>
            <h3>No jobs posted yet</h3>
            {isAuthenticated && (
              <button className="btn-primary" onClick={() => navigate('/post-job')} style={{ marginTop: 16 }}>
                Post the first job →
              </button>
            )}
          </div>
        ) : (
          <div style={styles.list}>
            {jobs.map(job => (
              <div key={job.id} className="card" style={styles.jobCard} onClick={() => navigate(`/job/${job.id}`)}>
                <div style={styles.jobTop}>
                  <span style={styles.openBadge}>{job.status.toUpperCase()}</span>
                  <span style={styles.budget}>${job.budgetMin} – ${job.budgetMax}</span>
                </div>
                <h3 style={styles.jobTitle}>{job.title}</h3>
                <p style={styles.jobDesc}>{job.description}</p>
                <div style={styles.skills}>
                  {job.skillsRequired?.slice(0, 5).map((s: string) => (
                    <span key={s} style={styles.skill}>{s}</span>
                  ))}
                </div>
                <div style={styles.jobFooter}>
                  <span style={styles.client}>👤 @{job.client?.username}</span>
                  <span style={styles.proposals}>📝 {job.proposalCount} proposals</span>
                  {job.deadline && <span style={styles.deadline}>🗓️ {new Date(job.deadline).toLocaleDateString()}</span>}
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
  inner: { maxWidth: 900, margin: '0 auto', padding: '48px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 40, fontWeight: 800, marginBottom: 8 },
  subtitle: { color: '#9898b0', fontSize: 16 },
  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  jobCard: { cursor: 'pointer' },
  jobTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  openBadge: { background: '#05966922', color: '#059669', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 },
  budget: { fontSize: 20, fontWeight: 800, color: '#7C3AED' },
  jobTitle: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
  jobDesc: { color: '#9898b0', fontSize: 14, lineHeight: 1.6, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  skills: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  skill: { background: '#1a0a2e', border: '1px solid #7C3AED44', color: '#7C3AED', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  jobFooter: { display: 'flex', gap: 20, flexWrap: 'wrap' },
  client: { fontSize: 13, color: '#55556a' },
  proposals: { fontSize: 13, color: '#55556a' },
  deadline: { fontSize: 13, color: '#F59E0B' },
  empty: { textAlign: 'center', padding: '80px 0' },
};
