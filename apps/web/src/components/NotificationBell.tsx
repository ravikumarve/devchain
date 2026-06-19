import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await notificationsAPI.getMy();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent */ }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }

  async function handleMarkRead(id: string) {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }

  function handleNavigate(data?: Record<string, unknown>) {
    if (data?.jobId) navigate(`/job/${data.jobId}`);
    else if (data?.proposalId) navigate('/my-proposals');
    else if (data?.productId) navigate(`/product/${data.productId}`);
    setOpen(false);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  const typeIcons: Record<string, string> = {
    proposal_received: '📋',
    proposal_accepted: '✅',
    proposal_rejected: '❌',
    escrow_funded: '💰',
    release_requested: '🔔',
    payment_released: '💵',
    new_sale: '🛒',
    new_review: '⭐',
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="btn-outline"
        style={{ position: 'relative', padding: '8px 12px', fontSize: 16, minWidth: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff',
            fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', lineHeight: 1, padding: '0 4px',
            boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 360, maxHeight: 480, overflow: 'auto',
          background: 'var(--bg-panel)', border: '1px solid var(--border-dim)',
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>
              Notifications {unreadCount > 0 && <span style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: 12 }}>({unreadCount} new)</span>}
            </span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
              No notifications yet
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id}
                onClick={() => { handleMarkRead(n.id); handleNavigate(n.data as Record<string, unknown>); }}
                style={{
                  padding: '12px 18px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border-dim)',
                  background: n.isRead ? 'transparent' : 'rgba(59,130,246,0.05)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(59,130,246,0.05)')}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{typeIcons[n.type] || '📢'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>{n.title}</div>
                    {n.message && <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 4 }}>{n.message}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#3b82f6', flexShrink: 0, marginTop: 4 }} />}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
