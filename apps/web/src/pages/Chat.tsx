import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { chatAPI } from '../services/api';

interface UserRef {
  id: string;
  username: string;
  avatarUrl?: string;
}

interface LastMessage {
  content: string;
  createdAt: string;
  senderId: string;
}

interface Conversation {
  id: string;
  otherUser: UserRef;
  relatedJobId?: string;
  lastMessage: LastMessage | null;
  unreadCount: number;
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: UserRef;
}

export default function Chat() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedUserId = searchParams.get('userId');
  const preselectedJobId = searchParams.get('jobId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setLoadingConv(true);
      const res = await chatAPI.getConversations();
      const list: Conversation[] = res.data.conversations || [];
      setConversations(list);

      // If preselectedUserId, find or create conversation
      if (preselectedUserId && list.length > 0) {
        const existing = list.find(
          (c) => c.otherUser.id === preselectedUserId
        );
        if (existing) setSelectedConv(existing);
      }
    } catch {
      setError('Failed to load conversations');
    } finally {
      setLoadingConv(false);
    }
  }, [preselectedUserId]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadConversations();
  }, [isAuthenticated, navigate, loadConversations]);

  // Create conversation if preselectedUserId and no existing found
  useEffect(() => {
    if (!preselectedUserId || loadingConv) return;
    const exists = conversations.find((c) => c.otherUser.id === preselectedUserId);
    if (!exists && !selectedConv) {
      chatAPI
        .createOrGetConversation({
          participantId: preselectedUserId,
          relatedJobId: preselectedJobId || undefined,
        })
        .then((res) => {
          const conv: Conversation = res.data.conversation;
          setConversations((prev) => [conv, ...prev]);
          setSelectedConv(conv);
        })
        .catch(() => setError('Could not start conversation'));
    }
  }, [preselectedUserId, preselectedJobId, loadingConv, conversations, selectedConv]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedConv) { setMessages([]); return; }
    const load = async () => {
      try {
        setLoadingMsgs(true);
        const res = await chatAPI.getMessages(selectedConv.id);
        setMessages(res.data.messages || []);
      } catch {
        setError('Failed to load messages');
      } finally {
        setLoadingMsgs(false);
      }
    };
    load();
  }, [selectedConv?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedConv || sending) return;
    const content = input.trim();
    setInput('');

    // Optimistic message
    const optimistic: Message = {
      id: 'temp-' + Date.now(),
      conversationId: selectedConv.id,
      senderId: user?.id || '',
      content,
      createdAt: new Date().toISOString(),
      sender: { id: user?.id || '', username: user?.username || '' },
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      setSending(true);
      const res = await chatAPI.sendMessage(selectedConv.id, { content });
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? res.data.message : m))
      );
    } catch {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'now';
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    return d.toLocaleDateString();
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ paddingTop: 72, height: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      <div style={{ flex: 1, display: 'flex', maxWidth: 1200, width: '100%', margin: '0 auto', padding: '16px', gap: 16, overflow: 'hidden' }}>

        {/* Left panel — conversation list */}
        <div style={{ width: 320, minWidth: 280, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-dim)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-dim)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Messages</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConv ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No conversations yet. Start by sending a message from a job or product.
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedConv(c)}
                  style={{
                    padding: '14px 20px',
                    cursor: 'pointer',
                    background: selectedConv?.id === c.id ? 'var(--bg-panel)' : 'transparent',
                    borderBottom: '1px solid var(--border-dim)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (selectedConv?.id !== c.id) e.currentTarget.style.background = 'var(--bg-panel)'; }}
                  onMouseLeave={(e) => { if (selectedConv?.id !== c.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--eth-purple), #9F67FF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {c.otherUser.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
                          @{c.otherUser.username}
                        </span>
                        {c.lastMessage && (
                          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                            {formatTime(c.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.lastMessage
                          ? (c.lastMessage.senderId === user?.id ? 'You: ' : '') +
                            c.lastMessage.content.substring(0, 60)
                          : 'No messages yet'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel — message thread */}
        <div style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-dim)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedConv ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--eth-purple), #9F67FF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                }}>
                  {selectedConv.otherUser.username[0].toUpperCase()}
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)' }}>
                  @{selectedConv.otherUser.username}
                </span>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 13 }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 13 }}>
                    No messages yet. Say hello!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '75%', alignSelf: isOwn ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                          padding: '8px 14px',
                          borderRadius: 16,
                          background: isOwn ? 'var(--eth-purple)' : 'var(--bg-panel)',
                          color: isOwn ? '#fff' : 'var(--text-main)',
                          fontSize: 14,
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                          borderBottomRightRadius: isOwn ? 4 : 16,
                          borderBottomLeftRadius: isOwn ? 16 : 4,
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                          {msg.sender.username} · {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-dim)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    style={{
                      flex: 1,
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border-dim)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      color: 'var(--text-main)',
                      fontSize: 14,
                      fontFamily: 'var(--font-display)',
                      resize: 'none',
                      outline: 'none',
                      minHeight: 42,
                      maxHeight: 120,
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 10,
                      border: 'none',
                      background: input.trim() && !sending ? 'var(--eth-purple)' : 'var(--border-dim)',
                      color: input.trim() && !sending ? '#fff' : 'var(--text-faint)',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s',
                      fontFamily: 'var(--font-display)',
                      height: 42,
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, zIndex: 100 }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}
    </div>
  );
}
