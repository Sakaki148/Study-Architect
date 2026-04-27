'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AIChatPanelProps {
  context: string;
  onClose: () => void;
}

export default function AIChatPanel({ context, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'Hello! What would you like to know about your study material?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          question: userMsg,
          context: context.substring(0, 3000),
          chatHistory: messages.slice(-6),
        }),
      });
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.ok ? data.answer : 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Bottom-right panel, sitting just above the 56px bottom bar */
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 68,          /* 56px bar + 12px gap */
        width: 380,
        height: 520,
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: 6,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #2a2a2a',
        background: '#111',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#808080' }}
          />
          <span style={{ fontSize: 11, fontWeight: 500, color: '#e8e8e8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Ask AI
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'grid', placeItems: 'center',
            color: '#555', padding: 4, borderRadius: 3,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e8e8e8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#555')}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 14px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end', gap: 8,
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: 22, height: 22, borderRadius: 3,
                  background: '#1e1e1e', border: '1px solid #2a2a2a',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <Sparkles size={11} color="#808080" />
                </div>
              )}
              <div style={{
                maxWidth: '78%',
                padding: '9px 13px',
                fontSize: 12, lineHeight: 1.65,
                borderRadius: 4,
                ...(msg.role === 'user'
                  ? { background: '#e8e8e8', color: '#111', borderBottomRightRadius: 1 }
                  : { background: '#171717', border: '1px solid #2a2a2a', color: '#c0c0c0', borderBottomLeftRadius: 1 }
                ),
              }}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      strong: ({ children }) => <strong style={{ fontWeight: 700, color: '#e8e8e8' }}>{children}</strong>,
                      p: ({ children }) => <p style={{ margin: '6px 0', whiteSpace: 'pre-wrap' }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ margin: '6px 0', paddingLeft: 16 }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: '6px 0', paddingLeft: 16 }}>{children}</ol>,
                      li: ({ children }) => <li style={{ margin: '3px 0' }}>{children}</li>,
                      code: ({ children }) => (
                        <code style={{
                          background: '#1e1e1e', padding: '2px 5px',
                          borderRadius: 2, fontSize: 11,
                          fontFamily: "'JetBrains Mono', monospace", color: '#aaa',
                        }}>{children}</code>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 3,
              background: '#1e1e1e', border: '1px solid #2a2a2a',
              display: 'grid', placeItems: 'center',
            }}>
              <Sparkles size={11} color="#808080" />
            </div>
            <div style={{
              background: '#171717', border: '1px solid #2a2a2a',
              padding: '9px 13px', borderRadius: 4, borderBottomLeftRadius: 1,
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: '#555' }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Input ── */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid #2a2a2a',
        display: 'flex', gap: 8, alignItems: 'center',
        background: '#111',
        flexShrink: 0,
      }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          disabled={loading}
          style={{
            flex: 1,
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: 3,
            padding: '9px 12px',
            fontSize: 11,
            color: '#e8e8e8',
            outline: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.03em',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#555')}
          onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            background: input.trim() && !loading ? '#2a2a2a' : '#141414',
            border: '1px solid #2a2a2a',
            borderRadius: 3,
            padding: '9px 12px',
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            display: 'grid', placeItems: 'center',
            opacity: input.trim() && !loading ? 1 : 0.35,
            transition: 'all 0.15s',
            color: '#e8e8e8',
          }}
          onMouseEnter={e => { if (input.trim() && !loading) (e.currentTarget.style.borderColor = '#555'); }}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
        >
          <Send size={13} />
        </button>
      </div>
    </motion.div>
  );
}
