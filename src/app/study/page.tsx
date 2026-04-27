'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { StudySession, NoteSection, TocEntry } from '@/types';
import FlashcardsModal from '@/components/flashcards/FlashcardsModal';
import QuizModal from '@/components/quiz/QuizModal';
import FloatingToolbar from '@/components/study/FloatingToolbar';
import AIChatPanel from '@/components/study/AIChatPanel';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/* ── Helpers ── */
const slugify = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function buildToc(sections: NoteSection[]): TocEntry[] {
  const toc: TocEntry[] = [];
  sections.forEach(s => {
    const entry: TocEntry = {
      id: s.id,
      title: s.title,
      slug: s.slug || slugify(s.title),
      level: s.level || 1,
      children: [],
    };
    if (entry.level === 1 || toc.length === 0) {
      toc.push(entry);
    } else {
      const parent = toc[toc.length - 1];
      parent.children.push(entry);
    }
  });
  return toc;
}

/* ── Memoised markdown renderer with custom serif components ── */
const NotesRenderer = React.memo(({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[rehypeKatex]}
    components={{
      h1: ({ children }) => {
        const text = String(children);
        return (
          <h1
            id={slugify(text)}
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 26, fontWeight: 700, color: '#e8e8e8',
              lineHeight: 1.25, letterSpacing: '-0.01em',
              marginBottom: 20, paddingBottom: 16,
              borderBottom: '1px solid #2a2a2a',
            }}
          >{children}</h1>
        );
      },
      h2: ({ children }) => {
        const text = String(children);
        return (
          <h2
            id={slugify(text)}
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 18, fontWeight: 700, color: '#e8e8e8',
              lineHeight: 1.3, marginTop: 40, marginBottom: 14,
              position: 'relative', paddingLeft: 14,
            }}
          >
            <span style={{
              position: 'absolute', left: 0, top: 3, bottom: 3,
              width: 3, background: '#808080', borderRadius: 2,
            }} />
            {children}
          </h2>
        );
      },
      h3: ({ children }) => {
        const text = String(children);
        return (
          <h3
            id={slugify(text)}
            style={{
              fontFamily: "'Lora', Georgia, serif",
              fontSize: 15, fontWeight: 600, color: '#aaa',
              lineHeight: 1.4, marginTop: 24, marginBottom: 12,
              fontStyle: 'italic',
            }}
          >{children}</h3>
        );
      },
      p: ({ children }) => (
        <p style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 15, color: '#c0c0c0', lineHeight: 1.85,
          letterSpacing: '0.008em', marginBottom: 24,
          textAlign: 'justify', hyphens: 'auto', wordBreak: 'break-word',
        } as React.CSSProperties}>{children}</p>
      ),
      ul: ({ children }) => (
        <ul style={{ margin: '0 0 24px 0', padding: 0, listStyle: 'none' }}>{children}</ul>
      ),
      ol: ({ children }) => (
        <ol style={{ margin: '0 0 24px 0', paddingLeft: 20, color: '#c0c0c0' }}>{children}</ol>
      ),
      li: ({ children }) => (
        <li style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: 15, color: '#c0c0c0', lineHeight: 1.8,
          padding: '5px 0 5px 22px', position: 'relative',
          borderBottom: '1px solid rgba(255,255,255,0.025)',
          textAlign: 'justify', hyphens: 'auto',
        }}>
          <span style={{
            position: 'absolute', left: 0,
            color: '#808080', fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
          }}>—</span>
          {children}
        </li>
      ),
      strong: ({ children }) => (
        <strong style={{
          fontFamily: "'Lora', Georgia, serif",
          fontWeight: 700, color: '#e8e8e8',
        }}>{children}</strong>
      ),
      em: ({ children }) => (
        <em style={{ fontStyle: 'italic', color: '#aaa' }}>{children}</em>
      ),
      blockquote: ({ children }) => (
        <div style={{
          margin: '28px 0', padding: '18px 22px',
          background: '#111111', border: '1px solid #2a2a2a',
          borderLeft: '3px solid #808080',
          borderRadius: '0 4px 4px 0',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, color: '#808080', letterSpacing: '0.14em',
            textTransform: 'uppercase', marginBottom: 8,
          }}>Note</div>
          <div style={{
            fontFamily: "'Lora', Georgia, serif",
            fontSize: 14, color: '#aaa', lineHeight: 1.75, fontStyle: 'italic',
          }}>{children}</div>
        </div>
      ),
      table: ({ children }) => (
        <div style={{ overflowX: 'auto', margin: '24px 0', borderRadius: 4, border: '1px solid #2a2a2a' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>
        </div>
      ),
      th: ({ children }) => (
        <th style={{
          padding: '10px 14px', textAlign: 'left',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, color: '#808080', letterSpacing: '0.1em',
          textTransform: 'uppercase', background: '#111',
          borderBottom: '1px solid #2a2a2a',
        }}>{children}</th>
      ),
      td: ({ children }) => (
        <td style={{
          padding: '9px 14px', fontFamily: "'Lora', Georgia, serif",
          fontSize: 14, color: '#c0c0c0', lineHeight: 1.6,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>{children}</td>
      ),
      code: ({ children, className }) => {
        if (className) {
          return (
            <pre style={{
              background: '#111', border: '1px solid #2a2a2a', borderRadius: 4,
              padding: 16, overflowX: 'auto', margin: '16px 0',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#aaa',
            }}>
              <code>{children}</code>
            </pre>
          );
        }
        return (
          <code style={{
            background: '#1e1e1e', padding: '2px 6px', borderRadius: 3,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#aaa',
          }}>{children}</code>
        );
      },
    }}
  >
    {content}
  </ReactMarkdown>
));
NotesRenderer.displayName = 'NotesRenderer';

/* ── TOC Item ── */
function TocItem({
  entry,
  activeSlug,
  depth = 0,
}: {
  entry: TocEntry;
  activeSlug: string;
  depth?: number;
}) {
  const isActive = activeSlug === entry.slug;
  const paddingLeft = 18 + depth * 12;

  return (
    <>
      <a
        href={`#${entry.slug}`}
        style={{
          display: 'block',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: depth === 0 ? 10 : 10,
          color: isActive ? '#e8e8e8' : depth === 0 ? '#555' : '#333',
          letterSpacing: '0.04em',
          padding: `7px ${paddingLeft}px`,
          textDecoration: 'none',
          borderLeft: `2px solid ${isActive ? '#808080' : 'transparent'}`,
          background: isActive ? '#171717' : 'transparent',
          transition: 'color 0.12s, background 0.12s, border-color 0.12s',
          lineHeight: 1.4,
        }}
        onMouseEnter={e => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = '#aaa';
            (e.currentTarget as HTMLElement).style.background = '#111111';
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.color = depth === 0 ? '#555' : '#333';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }
        }}
      >
        {entry.title}
      </a>
      {entry.children.map(child => (
        <TocItem key={child.id} entry={child} activeSlug={activeSlug} depth={depth + 1} />
      ))}
    </>
  );
}

/* ══════════════════════════════════════════ */
/*  Main study content                        */
/* ══════════════════════════════════════════ */
function StudyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashcardsOpen, setFlashcardsOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);
  const [expandedExplanation, setExpandedExplanation] = useState<{ text: string } | null>(null);
  const [aiHighlight, setAiHighlight] = useState('');
  const [activeSlug, setActiveSlug] = useState('');
  const [readPct, setReadPct] = useState(0);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const notesRef = useRef<HTMLDivElement>(null);
  const toc = session?.notes?.sections ? buildToc(session.notes.sections) : [];

  /* ── Fetch session ── */
  useEffect(() => { if (sessionId) fetchSession(); }, [sessionId]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/session/${sessionId}`);
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        if (data.session.timeline) {
          const mins = data.session.timeline.totalMinutes;
          setTotalTime(mins * 60);
          setTimeRemaining(mins * 60);
          setTimerRunning(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Countdown timer ── */
  useEffect(() => {
    if (!timerRunning || timeRemaining <= 0) return;
    const t = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) { setTimerRunning(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timerRunning, timeRemaining]);

  /* ── Scroll-spy: TOC active + reading progress ── */
  useEffect(() => {
    const onScroll = () => {
      // Reading %
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setReadPct(maxScroll > 0 ? Math.min(100, Math.round((window.scrollY / maxScroll) * 100)) : 0);

      // Active heading
      const headings = document.querySelectorAll<HTMLElement>('[id]');
      let current = '';
      headings.forEach(h => {
        if (window.scrollY >= h.offsetTop - 90) current = h.id;
      });
      setActiveSlug(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [session]);

  /* ── Text selection ── */
  const handleTextSelection = useCallback((e: MouseEvent) => {
    if ((e.target as Element)?.closest?.('.floating-toolbar')) return;
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 2) {
      const text = sel.toString().trim();
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setSelectedText(text);
      setToolbarPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    } else {
      setToolbarPos(null);
      setSelectedText('');
      setExpandedExplanation(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection);
    return () => document.removeEventListener('mouseup', handleTextSelection);
  }, [handleTextSelection]);

  /* ── Explain more ── */
  const handleExplainMore = async (text: string, depth = 1) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'explain',
          text,
          context: session?.notes?.content?.substring(0, 2000) || '',
          depth,
        }),
      });
      const data = await res.json();
      if (res.ok) setExpandedExplanation({ text: data.explanation });
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickQuiz = () => {
    if (!selectedText) { alert('Highlight some text first!'); return; }
    setQuizOpen(true);
  };

  const addTime = () => {
    setTimeRemaining(prev => prev + 600);
    setTotalTime(prev => prev + 600);
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const timerProgress = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 100;
  const timerColor = timerProgress > 30 ? '#808080' : timerProgress > 10 ? '#f59e0b' : '#ef4444';

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #2a2a2a', borderTopColor: '#808080' }}
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#0a0a0a' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#555' }}>Session not found</p>
        <button
          onClick={() => router.push('/upload')}
          style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            background: '#1e1e1e', border: '1px solid #2a2a2a', color: '#aaa',
            padding: '8px 18px', borderRadius: 4, cursor: 'pointer',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}
        >
          Upload Materials
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── Scan lines ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
        background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.006) 3px,rgba(255,255,255,0.006) 4px)',
      }} />

      {/* ── Topbar ── */}
      <motion.header
        initial={{ y: -48 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 48, zIndex: 200,
          background: 'rgba(10,10,10,0.97)', borderBottom: '1px solid #2a2a2a',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
          backdropFilter: 'blur(8px)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {/* Back */}
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 10, color: '#808080', textTransform: 'uppercase',
            letterSpacing: '0.1em', background: 'none', border: 'none',
            cursor: 'pointer', padding: '5px 0', flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#e8e8e8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#808080')}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
            <path d="M10 3L5 8l5 5" />
          </svg>
          Back
        </button>

        <div style={{ width: 1, height: 18, background: '#2a2a2a', flexShrink: 0 }} />

        {/* Session info */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#aaa', letterSpacing: '0.04em' }}>
            {session.title}
          </div>
          <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 1 }}>
            {session.materials.length} file{session.materials.length > 1 ? 's' : ''} loaded
          </div>
        </div>

        {/* Timer — centred */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 auto' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={timerColor} strokeWidth="1.5" width="14" height="14">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
          </svg>
          <span style={{
            fontSize: 16, fontWeight: 600, color: '#e8e8e8',
            letterSpacing: '0.08em', fontVariantNumeric: 'tabular-nums',
          }}>
            {formatTime(timeRemaining)}
          </span>
          <button
            onClick={addTime}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: '#555',
              letterSpacing: '0.06em', border: '1px solid #2a2a2a',
              padding: '3px 8px', borderRadius: 3, cursor: 'pointer',
              background: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget.style.color = '#e8e8e8'); (e.currentTarget.style.borderColor = '#383838'); }}
            onMouseLeave={e => { (e.currentTarget.style.color = '#555'); (e.currentTarget.style.borderColor = '#2a2a2a'); }}
          >
            + 10m
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          <TopbarBtn onClick={handleQuickQuiz} variant="ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" />
            </svg>
            Quick Quiz
          </TopbarBtn>
          <TopbarBtn onClick={() => router.push(`/study/final-exam?sessionId=${session.id}`)} variant="solid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" />
            </svg>
            Final Exam
          </TopbarBtn>
        </div>
      </motion.header>

      {/* ── Layout ── */}
      <div style={{ display: 'flex', marginTop: 48, minHeight: 'calc(100vh - 104px)' }}>

        {/* ── Sidebar TOC (fixed) ── */}
        <motion.nav
          initial={{ x: -220, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          style={{
            width: 220, flexShrink: 0,
            position: 'fixed', top: 48, left: 0, bottom: 56,
            background: '#0d0d0d', borderRight: '1px solid #2a2a2a',
            paddingTop: 24, overflowY: 'auto', zIndex: 100,
          }}
        >
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, color: '#333', letterSpacing: '0.14em',
            textTransform: 'uppercase', padding: '0 18px 12px',
            borderBottom: '1px solid #2a2a2a', marginBottom: 10,
          }}>
            <span style={{ color: '#2a2a2a' }}>// </span>Contents
          </div>

          {toc.length > 0 ? (
            toc.map(entry => (
              <TocItem key={entry.id} entry={entry} activeSlug={activeSlug} />
            ))
          ) : (
            <div style={{
              padding: '0 18px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, color: '#333',
            }}>
              No sections
            </div>
          )}
        </motion.nav>

        {/* In-flow spacer — pushes main past the fixed sidebar */}
        <div style={{ width: 220, flexShrink: 0 }} />

        {/* ── Notes main area ── */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          ref={notesRef}
          style={{
            flex: 1,
            minWidth: 0,           /* prevents flex child from overflowing */
            maxWidth: 980,
            margin: '0 auto',
            padding: '56px 64px 120px',
          }}
        >
          {session.notes ? (
            <>
              {session.notes.subject && (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12, color: '#808080',
                  textTransform: 'uppercase', letterSpacing: '0.15em',
                  marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ width: 12, height: 1, background: '#383838' }} />
                  {session.notes.subject}
                </div>
              )}
              <NotesRenderer content={session.notes.content} />
            </>
          ) : (
            <p style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, color: '#555',
            }}>No notes generated yet.</p>
          )}
        </motion.main>
      </div>

      {/* ── Bottom bar ── */}
      <motion.footer
        initial={{ y: 56 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.35, delay: 0.25, ease: 'easeOut' }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 56, zIndex: 200,
          background: 'rgba(10,10,10,0.97)', borderTop: '1px solid #2a2a2a',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12,
          backdropFilter: 'blur(8px)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 4, background: '#1e1e1e',
            border: '1px solid #383838', display: 'grid', placeItems: 'center',
            fontSize: 10, fontWeight: 600, color: '#808080',
          }}>N</div>

          <BottomBtn onClick={() => setFlashcardsOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
              <rect x="2" y="6" width="16" height="11" rx="1" />
              <path d="M6 6V4a1 1 0 011-1h14a1 1 0 011 1v11a1 1 0 01-1 1h-2" />
            </svg>
            Go to Flashcards
          </BottomBtn>
        </div>

        {/* Reading progress — centre */}
        <div style={{
          maxWidth: 160, display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Reading</span>
            <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.06em' }}>{readPct}%</span>
          </div>
          <div style={{ height: 2, background: '#1e1e1e', borderRadius: 1 }}>
            <motion.div
              animate={{ width: `${readPct}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ height: '100%', background: '#808080', borderRadius: 1 }}
            />
          </div>
        </div>

        {/* Ask AI — right */}
        <button
          onClick={() => setChatOpen(prev => !prev)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
            fontWeight: 500, cursor: 'pointer',
            background: chatOpen ? '#2a2a2a' : '#1e1e1e',
            border: `1px solid ${chatOpen ? '#c0c0c0' : '#383838'}`,
            color: chatOpen ? '#fff' : '#e8e8e8',
            padding: '0 18px', height: 32, borderRadius: 4,
            transition: 'all 0.18s ease',
            marginLeft: 'auto',
          }}
        >
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#808080' }}
          />
          Ask AI
        </button>
      </motion.footer>

      {/* ── AI Chat Side Panel ── */}
      <AnimatePresence>
        {chatOpen && (
          <AIChatPanel
            context={session.notes?.content || ''}
            onClose={() => { setChatOpen(false); setAiHighlight(''); }}
          />
        )}
      </AnimatePresence>

      {/* ── Floating Text Toolbar ── */}
      <FloatingToolbar
        visible={!!toolbarPos && !!selectedText}
        position={toolbarPos || { x: 0, y: 0 }}
        expandedExplanation={expandedExplanation?.text}
        onExplainMore={() => handleExplainMore(selectedText)}
        onAskAI={() => { setAiHighlight(selectedText); setChatOpen(true); setToolbarPos(null); }}
        onQuiz={handleQuickQuiz}
      />

      {/* ── Flashcards Modal ── */}
      <AnimatePresence>
        {flashcardsOpen && session.flashcards.length > 0 && (
          <FlashcardsModal
            flashcards={session.flashcards}
            onClose={() => setFlashcardsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Quiz Modal ── */}
      <AnimatePresence>
        {quizOpen && (
          <QuizModal
            sessionId={session.id}
            selectedText={selectedText}
            onClose={() => setQuizOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Small reusable button atoms ── */
function TopbarBtn({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: 'ghost' | 'solid';
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, fontWeight: 500,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '0 14px', height: 30, borderRadius: 4,
    border: 'none', cursor: 'pointer',
    transition: 'all 0.18s ease', whiteSpace: 'nowrap',
  };
  const ghost: React.CSSProperties = {
    ...base, background: '#171717', border: '1px solid #2a2a2a', color: '#808080',
  };
  const solid: React.CSSProperties = {
    ...base, background: '#262626', border: '1px solid #383838', color: '#e8e8e8',
  };

  return (
    <button
      onClick={onClick}
      style={variant === 'ghost' ? ghost : solid}
      onMouseEnter={e => {
        (e.currentTarget.style.transform = 'translateY(-1px)');
        (e.currentTarget.style.color = '#e8e8e8');
        (e.currentTarget.style.borderColor = '#555');
      }}
      onMouseLeave={e => {
        (e.currentTarget.style.transform = 'translateY(0)');
        (e.currentTarget.style.color = variant === 'ghost' ? '#808080' : '#e8e8e8');
        (e.currentTarget.style.borderColor = variant === 'ghost' ? '#2a2a2a' : '#383838');
      }}
    >
      {children}
    </button>
  );
}

function BottomBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, fontWeight: 500,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        padding: '0 14px', height: 30, borderRadius: 4,
        background: '#171717', border: '1px solid #2a2a2a',
        color: '#808080', cursor: 'pointer', transition: 'all 0.18s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget.style.background = '#1e1e1e');
        (e.currentTarget.style.borderColor = '#383838');
        (e.currentTarget.style.color = '#aaa');
        (e.currentTarget.style.transform = 'translateY(-1px)');
      }}
      onMouseLeave={e => {
        (e.currentTarget.style.background = '#171717');
        (e.currentTarget.style.borderColor = '#2a2a2a');
        (e.currentTarget.style.color = '#808080');
        (e.currentTarget.style.transform = 'translateY(0)');
      }}
    >
      {children}
    </button>
  );
}

/* ── Page export ── */
export default function StudyPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #2a2a2a', borderTopColor: '#808080' }}
          />
        </div>
      }
    >
      <StudyContent />
    </Suspense>
  );
}
