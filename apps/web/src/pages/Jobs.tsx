import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import EmptyState from '../components/EmptyState';

interface JobListItem {
  id: string; title: string; description: string; status: string;
  budgetMin: number; budgetMax: number; proposalCount: number;
  deadline?: string; skillsRequired?: string[];
  client?: { username: string; };
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
};

export default function Jobs() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    jobsAPI.getAll().then(res => setJobs(res.data.jobs)).finally(() => setLoading(false));
  }, []);

  const allSkills = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach(j => j.skillsRequired?.forEach(sk => s.add(sk)));
    return Array.from(s).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (skillFilter && !j.skillsRequired?.some(s => s.toLowerCase() === skillFilter.toLowerCase())) return false;
      return true;
    });
  }, [jobs, search, skillFilter]);

  const hasActiveFilters = !!(search || skillFilter);

  return (
    <div className="workspace">
      <div className="container">
        <div className="page-header">
          <div className="page-title">
            <h1>Jobs</h1>
            <p>Find freelance work or hire DevChain developers.</p>
          </div>
          {isAuthenticated && (
            <button className="btn btn-primary" onClick={() => navigate('/post-job')}>Post Job</button>
          )}
        </div>

        {/* Search + skill filter */}
        <div className="form-group" style={{ maxWidth: 460, marginBottom: '2rem' }}>
          <input
            className="form-control"
            placeholder="Search jobs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {allSkills.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button
              onClick={() => setSkillFilter('')}
              className={`skill-chip ${!skillFilter ? 'active' : ''}`}
              style={{
                padding: '6px 14px', borderRadius: 100,
                border: `1px solid ${!skillFilter ? 'var(--text-main)' : 'var(--border-solid)'}`,
                background: !skillFilter ? 'var(--text-main)' : 'transparent',
                color: !skillFilter ? 'var(--bg-void)' : 'var(--text-faint)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font-mono)', transition: 'all 0.2s',
              }}
            >
              All
            </button>
            {allSkills.slice(0, 12).map(s => (
              <button
                key={s}
                onClick={() => setSkillFilter(skillFilter === s ? '' : s)}
                style={{
                  padding: '6px 14px', borderRadius: 100,
                  border: `1px solid ${skillFilter === s ? 'var(--text-main)' : 'var(--border-solid)'}`,
                  background: skillFilter === s ? 'var(--text-main)' : 'transparent',
                  color: skillFilter === s ? 'var(--bg-void)' : 'var(--text-faint)',
                  fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', transition: 'all 0.2s',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '1px', marginBottom: '1.5rem',
          }}>
            {filtered.length} job{filtered.length !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="💼"
            title={hasActiveFilters ? 'No matching jobs' : 'No jobs posted yet'}
            description={hasActiveFilters
              ? 'Try different search terms or skill filters to find open positions.'
              : 'DevChain Jobs connects you with clients who need blockchain, full-stack, and AI talent. Post a job or browse open positions.'
            }
            skeleton={{ count: 3, type: 'list' }}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => { setSearch(''); setSkillFilter(''); }}
            actions={
              hasActiveFilters
                ? undefined
                : isAuthenticated
                  ? [{ label: 'Post a Job', onClick: () => navigate('/post-job') }]
                  : [{ label: 'Sign In to Post', onClick: () => navigate('/login'), variant: 'outline' as const }]
            }
            demos={hasActiveFilters ? undefined : [
              { title: 'Senior React Developer — DApp Frontend', description: 'Build a decentralized exchange interface with React, ethers.js, and Web3Modal. 3-month contract.', badge: 'FULL-TIME', meta: '$8K–$12K · by @defilabs' },
              { title: 'Rust Solidity Engineer — Smart Contract Audit', description: 'Audit 5 DeFi protocols for security vulnerabilities. Must have prior audit experience.', badge: 'CONTRACT', meta: '$5K–$15K · by @securechain' },
              { title: 'Full-Stack Python + Next.js Developer', description: 'Build an MVP for an AI-powered analytics platform. FastAPI backend, Next.js frontend, PostgreSQL.', badge: 'PART-TIME', meta: '$3K–$6K · by @aistartup' },
              { title: 'Mobile UI/UX Engineer — React Native', description: 'Design and implement cross-platform UI for a fintech app. 10+ screens, complex animations, gestures.', badge: 'FREELANCE', meta: '$4K–$8K · by @fintechapp' },
              { title: 'Go Backend Engineer — High-Throughput API', description: 'Build a real-time data ingestion API handling 100K+ req/s. Kafka, Redis, PostgreSQL sharding.', badge: 'FULL-TIME', meta: '$12K–$18K · by @datastream' },
              { title: 'DevOps Engineer — Kubernetes Migration', description: 'Migrate 12 microservices from Docker Compose to k8s on AWS EKS. Terraform, Helm, ArgoCD.', badge: 'CONTRACT', meta: '$10K–$20K · by @cloudnative' },
            ]}
            features={hasActiveFilters ? undefined : [
              { icon: '🔒', title: 'Escrow Protection', description: 'Funds held in escrow until work is verified and approved by both parties.' },
              { icon: '🌐', title: 'Global Talent Pool', description: 'Find developers from around the world specializing in blockchain, AI, full-stack, and mobile.' },
              { icon: '⚡', title: 'Quick Matching', description: 'Skill filters connect you with developers whose requirements match.' },
            ]}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map(job => (
              <div
                key={job.id}
                onClick={() => navigate(`/job/${job.id}`)}
                style={{
                  padding: '1.5rem 0',
                  borderBottom: '1px solid var(--border-faint)',
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
                  transition: 'color 0.2s',
                }}
              >
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                    <span className={`status-dot ${job.status}`}>
                      {STATUS_LABEL[job.status] || job.status}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                      {job.proposalCount} proposal{job.proposalCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                    {job.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 14, maxWidth: 640 }}>
                    {job.description}
                  </p>
                  {job.skillsRequired && job.skillsRequired.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {job.skillsRequired.slice(0, 6).map(s => (
                        <span key={s} style={{
                          fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                          color: 'var(--text-faint)', padding: '3px 10px',
                          border: '1px solid var(--border-solid)', borderRadius: 4,
                        }}>
                          {s}
                        </span>
                      ))}
                      {job.skillsRequired.length > 6 && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-faint)', paddingTop: 4 }}>
                          +{job.skillsRequired.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                      @{job.client?.username}
                    </span>
                    {job.deadline && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                        Due {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                    ${job.budgetMin}–${job.budgetMax}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 4 }}>
                    Budget
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
