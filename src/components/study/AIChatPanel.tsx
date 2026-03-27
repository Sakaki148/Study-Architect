'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

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

  const parseMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);border-radius:4px;padding:1px 6px;font-size:13px;">$1</code>')
      .replace(/\n\n/g, '</p><p style="margin-top:8px;">')
      .replace(/\n/g, '<br/>');
  };

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
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="fixed inset-0 m-auto w-[92vw] max-w-[400px] h-[75vh] max-h-[640px] flex flex-col z-50 overflow-hidden"
        style={{ background: '#141414', borderRadius: 20 }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <ArrowLeft style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.7)' }} />
          </motion.button>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'white', flex: 1, textAlign: 'center', marginRight: 28 }}>Ask AI</span>
        </div>

        {/* Sub-header */}
        <div style={{ padding: '0 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: '#333333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles style={{ width: 12, height: 12, color: 'white' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Ask AI</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginLeft: 28 }}>Ask questions about your study material</p>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: 14, background: '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.5)' }} />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    fontSize: 14,
                    lineHeight: 1.6,
                    borderRadius: 16,
                    ...(msg.role === 'user'
                      ? { background: '#ffffff', color: '#000000', borderBottomRightRadius: 4 }
                      : { background: '#1a1a1a', color: 'rgba(255,255,255,0.85)', borderBottomLeftRadius: 4 }
                    ),
                  }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: '#222222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <div style={{ background: '#1a1a1a', padding: '10px 16px', borderRadius: 16, borderBottomLeftRadius: 4, display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    style={{ width: 6, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.3)' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
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
              border: 'none',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 14,
              color: 'white',
              outline: 'none',
            }}
          />
          <motion.button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: '#ffffff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: '#000000',
              cursor: 'pointer',
              opacity: loading || !input.trim() ? 0.4 : 1,
            }}
          >
            Send
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
