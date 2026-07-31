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
    <div className="workspace" style={{ padding: '3rem 0 0' }}>
      <div className="container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-title">
          <h1>Messages</h1>
          <p>Real-time chat with buyers and freelancers.</p>
        </div>
        <button className="btn btn-primary">New Message</button>
      </div>

      <div className="msg-layout" style={{ height: 'calc(100vh - 240px)' }}>

        {/* Left panel — conversation list */}
        <div className="msg-list">
          <div style={{ padding: '0 0 0.75rem' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Inbox</h2>
          </div>
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
                className={`msg-item${selectedConv?.id === c.id ? ' active-chat' : ''}`}
              >
                <div className="m-header">
                  <span className="m-name">@{c.otherUser.username}</span>
                  {c.lastMessage && (
                    <span className="m-time">{formatTime(c.lastMessage.createdAt)}</span>
                  )}
                </div>
                <div className="m-snippet">
                  {c.lastMessage
                    ? (c.lastMessage.senderId === user?.id ? 'You: ' : '') +
                      c.lastMessage.content.substring(0, 60)
                    : 'No messages yet'}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right panel — message thread */}
        <div className="chat-window">
          {!selectedConv ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="chat-header">
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>@{selectedConv.otherUser.username}</h3>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--success-green)' }}>● Online</span>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-history">
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
                      <div key={msg.id} className={`bubble ${isOwn ? 'bubble-me' : 'bubble-them'}`}>
                        {msg.content}
                        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                          {msg.sender.username} · {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chat-input">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  rows={1}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--border-solid)',
                    borderRadius: 6,
                    padding: '0.75rem 1rem',
                    color: 'var(--text-main)',
                    fontSize: 14,
                    fontFamily: 'var(--font-display)',
                    resize: 'none',
                    outline: 'none',
                    minHeight: 42,
                    maxHeight: 120,
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.5rem', height: 'auto', opacity: input.trim() && !sending ? 1 : 0.5, cursor: input.trim() && !sending ? 'pointer' : 'not-allowed' }}
                >
                  Send
                </button>
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
    </div>
  );
}
