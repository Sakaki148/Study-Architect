'use client';

import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';

/* ─── Types ─── */
type StepStatus = 'pending' | 'active' | 'done' | 'error';

interface StepDef {
  id: string;
  name: string;
  detail: string;
  duration: number;
  logs: { text: string; bright?: boolean }[];
}

interface StepState extends StepDef {
  status: StepStatus;
  elapsed?: string;
}

/* ─── Step definitions (UI simulation — real work happens in notes step) ─── */
const STEP_DEFS: StepDef[] = [
  {
    id: 'parse',
    name: 'Parsing documents',
    detail: 'Extracting text and structure',
    duration: 1800,
    logs: [
      { text: 'Reading uploaded files...' },
      { text: 'Detected content, analyzing pages' },
      { text: 'Structure parsed successfully', bright: true },
    ],
  },
  {
    id: 'structure',
    name: 'Structuring content',
    detail: 'Building knowledge graph',
    duration: 1600,
    logs: [
      { text: 'Mapping section dependencies...' },
      { text: 'Core topics identified' },
      { text: 'Cross-references linked', bright: true },
    ],
  },
  {
    id: 'notes',
    name: 'Generating notes',
    detail: 'Synthesizing key concepts via AI',
    duration: 0, // real API call
    logs: [
      { text: 'Running comprehension model...' },
      { text: 'Generating study notes' },
      { text: 'Highlights extracted', bright: true },
    ],
  },
  {
    id: 'timeline',
    name: 'Building smart timeline',
    detail: 'Sequencing your study plan',
    duration: 1200,
    logs: [
      { text: 'Estimating topic complexity...' },
      { text: 'Scheduling study session' },
      { text: 'Timeline ready', bright: true },
    ],
  },
  {
    id: 'flashcards',
    name: 'Creating flashcards',
    detail: 'Generating spaced-repetition deck',
    duration: 1400,
    logs: [
      { text: 'Identifying key terms...' },
      { text: 'Writing Q&A pairs' },
      { text: 'Deck finalised', bright: true },
    ],
  },
];

/* ─── Icons as inline SVGs ─── */
const icons: Record<string, JSX.Element> = {
  parse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <path d="M4 6h16M4 10h10M4 14h12M4 18h8" />
    </svg>
  ),
  structure: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
      <path d="M12 7v4M12 11l-5 6M12 11l5 6" />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <rect x="4" y="3" width="13" height="17" rx="1" /><path d="M8 7h7M8 11h7M8 15h4" />
      <path d="M17 14l2 2 3-3" />
    </svg>
  ),
  timeline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <path d="M3 12h18M3 6h4M3 18h4M17 6h4M17 18h4" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  flashcards: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <rect x="2" y="6" width="16" height="11" rx="1" />
      <path d="M6 6V4a1 1 0 011-1h14a1 1 0 011 1v11a1 1 0 01-1 1h-2" />
    </svg>
  ),
  brain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" width="28" height="28">
      <path d="M9 3C6.5 3 4.5 5 4.5 7.5c0 .9.3 1.7.7 2.4C4.5 10.5 4 11.4 4 12.5c0 1.6 1 3 2.5 3.5C6.8 17.9 8 19 9.5 19H12m3-16c2.5 0 4.5 2 4.5 4.5 0 .9-.3 1.7-.7 2.4.7.6 1.2 1.5 1.2 2.6 0 1.6-1 3-2.5 3.5C17.2 17.9 16 19 14.5 19H12" />
      <path d="M12 19v2M9 12h6M9 9h6M9 15h6" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" width="6" height="6">
      <path d="M2 5l2 2 4-4" />
    </svg>
  ),
};

const SEG_COUNT = 20;

/* ══════════════════════════════════════════════════════ */
/*  Main content                                         */
/* ══════════════════════════════════════════════════════ */
function ProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const [steps, setSteps] = useState<StepState[]>(
    STEP_DEFS.map(d => ({ ...d, status: 'pending' }))
  );
  const [logs, setLogs] = useState<{ text: string; bright?: boolean; id: number }[]>([]);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState('00:00');
  const [termText, setTermText] = useState('initializing');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logIdRef = useRef(0);
  const startRef = useRef(Date.now());

  /* spring-smoothed progress for progress bar */
  const rawPct = useMotionValue(0);
  const smoothPct = useSpring(rawPct, { stiffness: 60, damping: 20 });

  /* ─── Elapsed timer ─── */
  useEffect(() => {
    const t = setInterval(() => {
      const s = Math.floor((Date.now() - startRef.current) / 1000);
      const mm = String(Math.floor(s / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      setElapsed(`${mm}:${ss}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* ─── Helpers ─── */
  const setStepStatus = (id: string, status: StepStatus, extraElapsed?: string) => {
    setSteps(prev =>
      prev.map(s => s.id === id ? { ...s, status, ...(extraElapsed ? { elapsed: extraElapsed } : {}) } : s)
    );
  };

  const pushLog = (text: string, bright = false) => {
    setLogs(prev => {
      const next = [...prev, { text, bright, id: logIdRef.current++ }];
      return next.slice(-3);
    });
  };

  const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  const animateProgress = async (from: number, to: number, durationMs: number) => {
    const steps2 = Math.ceil(durationMs / 16);
    for (let i = 1; i <= steps2; i++) {
      const pct = from + (to - from) * (i / steps2);
      rawPct.set(pct);
      setProgress(pct);
      await delay(16);
    }
  };

  const fireStepLogs = (step: StepDef, durationMs: number) => {
    step.logs.forEach((log, li) => {
      const t = Math.floor((durationMs / step.logs.length) * li) + 200;
      setTimeout(() => pushLog(log.text, log.bright), t);
    });
  };

  /* ─── Main processing loop ─── */
  useEffect(() => {
    if (!sessionId) return;

    const runProcessing = async () => {
      const base = 100 / STEP_DEFS.length;

      try {
        for (let i = 0; i < STEP_DEFS.length; i++) {
          const def = STEP_DEFS[i];
          setStepStatus(def.id, 'active');
          setTermText(def.id + '_exec');

          const fromPct = i * base;
          const toPct = (i + 1) * base;

          if (def.id === 'notes') {
            // Real API call
            fireStepLogs(def, 6000);
            const apiStart = Date.now();

            const res = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId }),
            });

            // Animate progress while waiting
            await animateProgress(fromPct, toPct - 2, Math.max(Date.now() - apiStart, 1000));

            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || 'Generation failed');
            }

            const apiTime = ((Date.now() - apiStart) / 1000).toFixed(1) + 's';
            setStepStatus(def.id, 'done', apiTime);
            rawPct.set(toPct);
            setProgress(toPct);
          } else {
            fireStepLogs(def, def.duration);
            await animateProgress(fromPct, toPct, def.duration);
            setStepStatus(def.id, 'done', (def.duration / 1000).toFixed(1) + 's');
          }

          await delay(240);
        }

        // Finish
        rawPct.set(100);
        setProgress(100);
        setTermText('complete');
        setDone(true);
        pushLog('Session ready — starting study mode', true);

        await delay(900);
        router.push(`/study?sessionId=${sessionId}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Processing failed';
        setError(msg);
        setTermText('error');
        setSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
        pushLog('Error: ' + msg, false);
      }
    };

    runProcessing();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const completedCount = steps.filter(s => s.status === 'done').length;
  const filledSegs = Math.floor((progress / 100) * SEG_COUNT);

  return (
    <>
      {/* ── Scan lines overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
        background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.011) 2px,rgba(255,255,255,0.011) 4px)',
      }} />

      {/* ── Background dot grid ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(#2c2c2c 1px,transparent 1px),linear-gradient(90deg,#2c2c2c 1px,transparent 1px)',
        backgroundSize: '40px 40px', opacity: 0.18,
        maskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%,black 0%,transparent 100%)',
      }} />

      {/* ── Topbar ── */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 40,
          background: '#0f0f0f', borderBottom: '1px solid #2c2c2c',
          display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 100,
        }}
      >
        {/* Brand — centered */}
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, fontWeight: 500, color: '#d4d4d4',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div style={{
            width: 22, height: 22, border: '1px solid #3d3d3d', borderRadius: 4,
            background: '#1a1a1a', display: 'grid', placeItems: 'center',
          }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="#888" strokeWidth="1.5" width="12" height="12">
              <path d="M8 2l1.5 3h3L10 7l1 3-3-2-3 2 1-3-2.5-2h3z" />
            </svg>
          </div>
          Study AI
        </div>

        {/* Status — right */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <motion.div
            animate={done ? { opacity: 1, scale: 1 } : { opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
            transition={done ? {} : { duration: 1, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: done ? '#888' : '#b0b0b0' }}
          />
          <span style={{
            fontSize: 10, color: '#555', letterSpacing: '0.06em',
            textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace",
          }}>
            {done ? 'Done' : error ? 'Error' : 'Processing'}
          </span>
        </div>
      </motion.header>

      {/* ── Main ── */}
      <main style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px 40px', gap: 28, position: 'relative',
        fontFamily: "'JetBrains Mono', monospace",
      }}>

        {/* Brain icon + orbit */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ position: 'relative', width: 72, height: 72, display: 'grid', placeItems: 'center' }}
        >
          <motion.div
            animate={{ rotate: [0, 4, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 64, height: 64, background: '#1a1a1a',
              border: '1px solid #3d3d3d', borderRadius: 8,
              display: 'grid', placeItems: 'center', position: 'relative', zIndex: 1,
              color: '#888',
            }}
          >
            {icons.brain}
          </motion.div>
          {/* Orbiting ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: -6,
              borderRadius: '50%', border: '1px dashed #3d3d3d',
            }}
          >
            <div style={{
              position: 'absolute', width: 5, height: 5,
              background: '#888', borderRadius: '50%',
              top: '50%', left: -3, transform: 'translateY(-50%)',
            }} />
          </motion.div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 7 }}
        >
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            <span style={{ color: '#3a3a3a' }}>// </span>process_exec
          </div>
          <h1 style={{
            fontSize: 'clamp(20px,3.5vw,28px)', fontWeight: 600,
            color: '#efefef', letterSpacing: '-0.02em', margin: 0,
          }}>
            Processing Your{' '}
            <span style={{ color: '#555555', fontWeight: 300 }}>Materials</span>
          </h1>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.04em' }}>
            Analyzing and structuring your study content
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4 }}
          style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#3a3a3a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              progress
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em' }}>
              {Math.round(progress)}%
            </span>
          </div>
          {/* Track */}
          <div style={{
            height: 3, background: '#222', borderRadius: 2, overflow: 'hidden', position: 'relative',
          }}>
            <motion.div
              style={{
                height: '100%', borderRadius: 2,
                background: '#888', width: smoothPct.get() + '%',
                position: 'relative',
              }}
              animate={{ width: progress + '%' }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* shimmer */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0, width: '50%',
                  background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)',
                  opacity: 0.6,
                }}
              />
            </motion.div>
          </div>
          {/* Segment bar */}
          <div style={{ display: 'flex', gap: 2, height: 2 }}>
            {Array.from({ length: SEG_COUNT }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  background: i < filledSegs ? '#555' : i === filledSegs ? '#888' : '#222',
                  opacity: i === filledSegs ? [0.5, 1, 0.5] : 1,
                }}
                transition={i === filledSegs
                  ? { opacity: { duration: 0.8, repeat: Infinity } }
                  : { duration: 0.3 }
                }
                style={{ flex: 1, borderRadius: 1 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Steps list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
          style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {steps.map((step, idx) => {
            const isActive = step.status === 'active';
            const isDone = step.status === 'done';
            const isPending = step.status === 'pending';
            const isError = step.status === 'error';

            return (
              <motion.div
                key={step.id}
                layout
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 4,
                  border: `1px solid ${isActive ? '#3d3d3d' : isDone ? '#2c2c2c' : isError ? '#4a2020' : 'transparent'}`,
                  background: isActive ? '#1a1a1a' : isDone ? '#0f0f0f' : 'transparent',
                  opacity: isPending ? 0.32 : 1,
                  position: 'relative', overflow: 'hidden',
                  transition: 'background 0.3s, border-color 0.3s, opacity 0.3s',
                }}
              >
                {/* Sweep shimmer for active */}
                {isActive && (
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.025),transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Icon */}
                <div style={{
                  width: 28, height: 28, borderRadius: 3, flexShrink: 0,
                  border: `1px solid ${isActive ? '#767676' : '#2c2c2c'}`,
                  background: isActive ? '#2a2a2a' : isDone ? '#222' : '#1a1a1a',
                  display: 'grid', placeItems: 'center', position: 'relative',
                  color: isActive ? '#d4d4d4' : isDone ? '#888' : '#555',
                }}>
                  {icons[step.id]}
                  {/* Check badge */}
                  <AnimatePresence>
                    {isDone && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        style={{
                          position: 'absolute', bottom: -3, right: -3,
                          width: 11, height: 11, background: '#222',
                          border: '1px solid #3d3d3d', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#888',
                        }}
                      >
                        {icons.check}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Text */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 500, letterSpacing: '0.03em',
                    color: isActive ? '#efefef' : isDone ? '#888' : isError ? '#c87070' : '#555',
                  }}>
                    {step.name}
                  </div>
                  <div style={{
                    fontSize: 10, letterSpacing: '0.05em',
                    color: isActive ? '#555' : '#3a3a3a',
                  }}>
                    {step.detail}
                  </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {step.elapsed && (
                    <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {step.elapsed}
                    </span>
                  )}
                  {!step.elapsed && !isActive && (
                    <span style={{ fontSize: 9, color: '#3a3a3a', letterSpacing: '0.06em' }}>—</span>
                  )}
                  {/* Spinner */}
                  {isActive && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                      style={{
                        width: 12, height: 12, borderRadius: '50%',
                        border: '1.5px solid #3d3d3d',
                        borderTopColor: '#888',
                      }}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Log output */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.45 }}
          style={{
            width: '100%', maxWidth: 480,
            background: '#0f0f0f', border: '1px solid #2c2c2c', borderRadius: 4, overflow: 'hidden',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderBottom: '1px solid #2c2c2c', background: '#141414',
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#3d3d3d' }} />
            ))}
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3a3a3a', marginLeft: 2 }}>
              stdout
            </span>
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 3, minHeight: 60 }}>
            <AnimatePresence mode="popLayout">
              {logs.map(log => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    fontSize: 10, letterSpacing: '0.04em', lineHeight: 1.5,
                    color: log.bright ? '#888' : '#555',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <span style={{ color: '#3a3a3a' }}>&gt; </span>{log.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Bottom row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.4 }}
          style={{
            width: '100%', maxWidth: 480,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <div style={{
            fontSize: 10, color: '#3a3a3a', display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <span style={{ color: '#555' }}>$</span>
            <span style={{ color: '#555' }}>{termText}</span>
            {/* Cursor blink */}
            <motion.span
              animate={{ opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'steps(2)' }}
              style={{
                display: 'inline-block', width: 7, height: 11,
                background: '#767676', borderRadius: 1, opacity: 0.5,
                verticalAlign: 'middle',
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: '#3a3a3a', letterSpacing: '0.06em', fontFamily: "'JetBrains Mono', monospace" }}>
            elapsed <span style={{ color: '#555' }}>{elapsed}</span>
          </div>
        </motion.div>

        {/* Error panel */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                width: '100%', maxWidth: 480,
                padding: '14px 16px', borderRadius: 4,
                border: '1px solid #4a2020', background: 'rgba(100,20,20,0.15)',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <div style={{ fontSize: 11, color: '#c87070', fontWeight: 600, marginBottom: 4, letterSpacing: '0.04em' }}>
                ✗ processing_error
              </div>
              <div style={{ fontSize: 10, color: '#a05050', letterSpacing: '0.03em' }}>{error}</div>
              <div style={{ fontSize: 10, color: '#7a4040', marginTop: 6, letterSpacing: '0.03em' }}>
                Ensure GEMINI_API_KEY is set in .env.local
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </>
  );
}

/* ══════════════════════════════════════════════════════ */
/*  Page export with Suspense                            */
/* ══════════════════════════════════════════════════════ */
export default function ProcessingPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0a0a0a',
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2px solid #2c2c2c', borderTopColor: '#888',
            }}
          />
        </div>
      }
    >
      <ProcessingContent />
    </Suspense>
  );
}
