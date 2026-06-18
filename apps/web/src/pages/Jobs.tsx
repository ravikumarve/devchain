import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface JobListItem {
  id: string; title: string; description: string; status: string;
  budgetMin: number; budgetMax: number; proposalCount: number;
  deadline?: string; skillsRequired?: string[];
  client?: { username: string; };
}

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

  return (
    <div style={{ paddingTop: 72, minHeight: '100vh', background: 'var(--bg-void)' }}>
      <div className="container" style={{ padding: '48px 2rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 32, flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <div style={{
              color: 'var(--eth-purple)', fontSize: 12, fontWeight: 700,
              letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8,
              fontFamily: 'var(--font-mono)',
            }}>
              Freelance Marketplace
            </div>
            <h1 style={{
              fontSize: 36, fontWeight: 700, color: 'var(--text-main)',
              letterSpacing: '-0.04em', marginBottom: 8,
            }}>
              Jobs
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              Find freelance work or hire DevChain developers
            </p>
          </div>
          {isAuthenticated && (
            <button className="btn-primary" onClick={() => navigate('/post-job')}
              style={{ padding: '12px 24px', fontSize: 14 }}>
              + Post a Job
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style={{
            position: 'relative', flex: 1, minWidth: 240, maxWidth: 400,
          }}>
            <input
              style={{
                width: '100%', padding: '10px 16px 10px 40px', borderRadius: 10,
                border: '1px solid var(--border-dim)', background: 'var(--bg-surface)',
                color: 'var(--text-main)', fontSize: 14, outline: 'none',
                fontFamily: 'var(--font-mono)', boxSizing: 'border-box',
              }}
              placeholder="Search jobs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-faint)', fontSize: 14,
            }}>
              🔍
            </span>
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-faint)',
                cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1,
              }}>
                ×
              </button>
            )}
          </div>

          {allSkills.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => setSkillFilter('')} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-dim)',
                background: !skillFilter ? 'var(--eth-purple)' : 'var(--bg-surface)',
                color: !skillFilter ? '#fff' : 'var(--text-muted)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}>
                All
              </button>
              {allSkills.slice(0, 12).map(s => (
                <button key={s} onClick={() => setSkillFilter(skillFilter === s ? '' : s)} style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border-dim)',
                  background: skillFilter === s ? 'var(--eth-purple)' : 'var(--bg-surface)',
                  color: skillFilter === s ? '#fff' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{
            color: 'var(--text-faint)', fontSize: 12, fontFamily: 'var(--font-mono)',
            marginBottom: 16, letterSpacing: 0.5,
          }}>
            {filtered.length} job{filtered.length !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13,
          }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>💼</div>
            <h3 style={{ color: 'var(--text-main)', fontSize: 20, marginBottom: 8 }}>
              {search || skillFilter ? 'No matching jobs' : 'No jobs posted yet'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {search || skillFilter ? 'Try different search terms or filters.' : ''}
            </p>
            {isAuthenticated && !search && !skillFilter && (
              <button className="btn-primary" onClick={() => navigate('/post-job')}
                style={{ marginTop: 16, padding: '12px 24px' }}>
                Post the first job →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(job => (
              <div key={job.id}
                onClick={() => navigate(`/job/${job.id}`)}
                className="card interactive"
                style={{
                  padding: '24px', cursor: 'pointer',
                  borderLeft: '3px solid var(--eth-purple)',
                }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: 16, marginBottom: 12,
                }}>
                  <div>
                    <div style={{
                      display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8,
                    }}>
                      <span style={{
                        background: '#10b98122', color: '#10b981',
                        padding: '2px 10px', borderRadius: 6,
                        fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                      }}>
                        {job.status.toUpperCase()}
                      </span>
                      <span style={{
                        color: 'var(--text-faint)',
                        fontSize: 12, fontFamily: 'var(--font-mono)',
                      }}>
                        📋 {job.proposalCount} {job.proposalCount === 1 ? 'proposal' : 'proposals'}
                      </span>
                    </div>
                    <h3 style={{
                      fontSize: 18, fontWeight: 700, color: 'var(--text-main)',
                      marginBottom: 6, letterSpacing: '-0.03em',
                    }}>
                      {job.title}
                    </h3>
                    <p style={{
                      color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6,
                      marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {job.description}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      fontSize: 22, fontWeight: 900,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      whiteSpace: 'nowrap',
                    }}>
                      ${job.budgetMin}–${job.budgetMax}
                    </div>
                    <div style={{
                      color: 'var(--text-faint)', fontSize: 11,
                      fontFamily: 'var(--font-mono)', marginTop: 2,
                    }}>
                      Budget
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {job.skillsRequired && job.skillsRequired.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {job.skillsRequired.slice(0, 6).map(s => (
                      <span key={s} style={{
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-dim)',
                        padding: '3px 10px', borderRadius: 6,
                        color: 'var(--text-faint)', fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {s}
                      </span>
                    ))}
                    {job.skillsRequired.length > 6 && (
                      <span style={{
                        color: 'var(--text-faint)', fontSize: 11,
                        fontFamily: 'var(--font-mono)', paddingTop: 4,
                      }}>
                        +{job.skillsRequired.length - 6} more
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div style={{
                  display: 'flex', gap: 20, marginTop: 14,
                  flexWrap: 'wrap', alignItems: 'center',
                }}>
                  <span style={{
                    color: 'var(--text-faint)', fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    👤 @{job.client?.username}
                  </span>
                  {job.deadline && (
                    <span style={{
                      color: 'var(--text-faint)', fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      🗓️ {new Date(job.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
