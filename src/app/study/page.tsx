'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, Brain, Layers, Plus, ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { StudySession } from '@/types';
import FlashcardsModal from '@/components/flashcards/FlashcardsModal';
import QuizModal from '@/components/quiz/QuizModal';
import FloatingToolbar from '@/components/study/FloatingToolbar';
import AIChatPanel from '@/components/study/AIChatPanel';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Memoized renderer to prevent selection destruction on re-render
const NotesRenderer = React.memo(({ content }: { content: string, highlightText?: string }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-4xl font-bold mt-12 mb-8 text-white">{children}</h1>,
        h2: ({ children }) => <h2 className="text-3xl font-bold mt-10 mb-6 text-white">{children}</h2>,
        h3: ({ children }) => <h3 className="text-2xl font-bold mt-8 mb-4 text-white/90">{children}</h3>,
        p: ({ children }) => <p className="mb-6 leading-relaxed text-white/80 text-justify">{children}</p>,
        ul: ({ children }) => <ul className="mb-6 ml-6 list-disc text-white/80 space-y-2">{children}</ul>,
        ol: ({ children }) => <ol className="mb-6 ml-6 list-decimal text-white/80 space-y-2">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        strong: ({ children }) => <strong className="font-extrabold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-white/90">{children}</em>,
        table: ({ children }) => (
          <div className="my-10 overflow-x-auto rounded-2xl border border-white/10 bg-[#121217]">
            <table className="min-w-full border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-white/[0.04]">{children}</thead>,
        th: ({ children }) => <th className="border-b border-white/10 px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">{children}</th>,
        td: ({ children }) => <td className="border-t border-white/8 px-6 py-4 align-top text-[15px] text-white/72">{children}</td>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-white/20 pl-6 py-2 my-6 italic text-white/60 bg-white/[0.02] rounded-r-lg">{children}</blockquote>,
        code: ({ children }) => <code className="bg-white/10 px-1.5 py-0.5 rounded-md text-[14px] font-mono text-emerald-300">{children}</code>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

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
  const [expandedExplanation, setExpandedExplanation] = useState<{ text: string; position: string } | null>(null);
  const [aiHighlight, setAiHighlight] = useState('');

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const notesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (!timerRunning || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timeRemaining]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/session/${sessionId}`);
      const data = await res.json();
      if (res.ok && data.session) {
        setSession(data.session);
        if (data.session.timeline) {
          const totalMin = data.session.timeline.totalMinutes;
          setTotalTime(totalMin * 60);
          setTimeRemaining(totalMin * 60);
          setTimerRunning(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSelection = useCallback((e: MouseEvent) => {
    if ((e.target as Element)?.closest?.('.floating-toolbar')) return;

    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 2) {
      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
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

  const handleExplainMore = async (text: string, depth: number = 1) => {
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
      if (res.ok) {
        // Do NOT setToolbarPos(null). Keep toolbar open to show explanation!
        setExpandedExplanation({ text: data.explanation, position: text });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to explain more. Please check your API limits or try again later.');
    }
  };

  const handleQuickQuiz = () => {
    if (!selectedText) {
      alert("Please highlight/select some text from your notes first to generate a Quick Quiz!");
      return;
    }
    setQuizOpen(true);
  };

  const addTime = () => {
    setTimeRemaining(prev => prev + 600);
    setTotalTime(prev => prev + 600);
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timerProgress = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 100;
  const timerColor = timerProgress > 30 ? '' : timerProgress > 10 ? 'warning' : 'danger';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-8 h-8 text-[var(--accent-primary)]" />
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--text-secondary)]">Session not found</p>
        <button onClick={() => router.push('/upload')} className="btn-primary">Upload Materials</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <motion.header
        className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => router.push('/')}
                className="p-2 rounded-lg hover:bg-[var(--bg-card)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <h1 className="font-semibold">{session.title}</h1>
                <p className="text-xs text-[var(--text-muted)]">
                  {session.materials.length} file{session.materials.length > 1 ? 's' : ''} loaded
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="flex items-center gap-3">
                <Clock className={`w-4 h-4 ${timerColor === 'danger' ? 'text-red-400' : timerColor === 'warning' ? 'text-yellow-400' : 'text-[var(--accent-primary)]'}`} />
                <div className="w-48">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-mono font-semibold ${timerColor === 'danger' ? 'text-red-400' : ''}`}>
                      {formatTime(timeRemaining)}
                    </span>
                    <motion.button
                      onClick={addTime}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)] flex items-center gap-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Add 10 minutes"
                    >
                      <Plus className="w-3 h-3" /> 10m
                    </motion.button>
                  </div>
                  <div className="timer-bar">
                    <motion.div
                      className={`timer-bar-fill ${timerColor}`}
                      style={{ width: `${timerProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Quiz Mode */}
              <motion.button
                onClick={handleQuickQuiz}
                className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20"
                whileHover={{ scale: 1.03, borderColor: 'rgba(99, 102, 241, 0.5)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Brain className="w-4 h-4" />
                Quick Quiz
              </motion.button>

              {/* Final Exam */}
              <motion.button
                onClick={() => router.push(`/study/final-exam?sessionId=${session.id}`)}
                className="btn-primary flex items-center gap-2 py-2 px-4 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500/50"
                whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Brain className="w-4 h-4" />
                Final Exam
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center w-full min-h-[calc(100vh-140px)]">
        <motion.main
          className={`w-full max-w-4xl px-8 py-16 flex flex-col items-center ${chatOpen ? 'mr-96' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Notes */}
          <div ref={notesRef} className="study-prose w-full max-w-3xl text-justify text-lg pt-12 pb-32">
            {session.notes ? (
              <NotesRenderer content={session.notes.content} highlightText={aiHighlight} />
            ) : (
              <p className="text-[var(--text-muted)]">No notes generated yet.</p>
            )}

            {/* Inline Explanation rendering moved fully into FloatingToolbar! */}
          </div>
        </motion.main>

        {/* AI Chat Side Panel */}
        <AnimatePresence>
          {chatOpen && (
            <AIChatPanel
              context={session.notes?.content || ''}
              onClose={() => {
                setChatOpen(false);
                setAiHighlight('');
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar */}
      <motion.div
        className="sticky bottom-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-t border-[var(--border-subtle)]"
        initial={{ y: 60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <motion.button
            onClick={() => setFlashcardsOpen(true)}
            className="btn-primary flex items-center gap-2"
            whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(99, 102, 241, 0.3)' }}
            whileTap={{ scale: 0.97 }}
          >
            <Layers className="w-4 h-4" />
            Go to Flashcards
          </motion.button>

          <div className="flex gap-3">
            <motion.button
              onClick={() => setChatOpen(!chatOpen)}
              className={`btn-secondary flex items-center gap-2 py-2 px-4 text-sm ${chatOpen ? 'border-[var(--accent-primary)]' : ''}`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <MessageSquare className="w-4 h-4" />
              Ask AI
            </motion.button>

          </div>
        </div>
      </motion.div>

      {/* Floating Text Selection Toolbar */}
      <FloatingToolbar
        visible={!!toolbarPos && !!selectedText}
        position={toolbarPos || { x: 0, y: 0 }}
        expandedExplanation={expandedExplanation?.text}
        onExplainMore={() => handleExplainMore(selectedText)}
        onAskAI={() => {
          setAiHighlight(selectedText);
          setChatOpen(true);
          setToolbarPos(null);
        }}
        onQuiz={handleQuickQuiz}
      />

      {/* Flashcards Modal */}
      <AnimatePresence>
        {flashcardsOpen && session.flashcards.length > 0 && (
          <FlashcardsModal
            flashcards={session.flashcards}
            onClose={() => setFlashcardsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {quizOpen && (
          <QuizModal
            sessionId={session.id}
            selectedText={selectedText}
            onClose={() => setQuizOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-8 h-8 text-[var(--accent-primary)]" />
        </motion.div>
      </div>
    }>
      <StudyContent />
    </Suspense>
  );
}
