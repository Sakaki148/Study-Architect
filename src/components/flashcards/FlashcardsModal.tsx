'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Flashcard } from '@/types';

interface FlashcardsModalProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

const difficultyColors = {
  easy: { text: '#686868', border: '#303030' },
  medium: { text: '#585858', border: '#282828' },
  hard: { text: '#484848', border: '#242424' },
};

export default function FlashcardsModal({ flashcards, onClose }: FlashcardsModalProps) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [isDone, setIsDone] = useState(false);

  const currentCard = flashcards[idx];
  const isFinished = idx >= flashcards.length;

  useEffect(() => {
    if (idx >= flashcards.length) {
      setIsDone(true);
    }
  }, [idx, flashcards.length]);

  const handleFlip = () => {
    if (!isFinished) setFlipped(!flipped);
  };

  const handleRate = (rating: keyof typeof stats) => {
    setStats(prev => ({ ...prev, [rating]: prev[rating] + 1 }));
    setFlipped(false);
    setIdx(prev => prev + 1);
  };

  const restart = () => {
    setIdx(0);
    setFlipped(false);
    setStats({ again: 0, hard: 0, good: 0, easy: 0 });
    setIsDone(false);
  };

  if (flashcards.length === 0) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ 
        background: '#080808', 
        fontFamily: "'Lora', Georgia, serif", 
        color: '#e8e8e8',
        touchAction: 'none',
        userSelect: 'none' 
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Noise & Scanlines Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999]" 
           style={{ 
             background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,.006) 3px, rgba(255,255,255,.006) 4px)',
           }} 
      />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-50"
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
             backgroundSize: '200px 200px' 
           }} 
      />

      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 h-12 px-5 flex items-center gap-3 z-100 backdrop-blur-md"
              style={{ background: 'rgba(8,8,8,.95)', borderBottom: '1px solid #282828' }}>
        <button 
          onClick={onClose}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#4a4a4a] hover:text-[#e8e8e8] transition-colors outline-none"
          style={{ fontFamily: "'JetBrains Mono', monospace", background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
        <div className="w-px h-4 bg-[#282828]" />
        <div className="text-[11px] tracking-wider text-[#a8a8a8]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          Flashcards
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          {!isFinished && (
            <div 
              className="text-[9px] font-semibold uppercase tracking-[.14em] px-2.5 py-0.5 rounded-sm border transition-all duration-300"
              style={{ 
                fontFamily: "'JetBrains Mono', monospace",
                color: difficultyColors[currentCard?.difficulty || 'easy'].text,
                borderColor: difficultyColors[currentCard?.difficulty || 'easy'].border,
              }}
            >
              {currentCard?.difficulty}
            </div>
          )}
          <div className="text-[12px] font-semibold tracking-wider text-[#707070]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="text-[#e8e8e8]">{isFinished ? flashcards.length : idx + 1}</span> / {flashcards.length}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="fixed top-12 left-0 right-0 h-[2px] bg-[#161616] z-[99]">
        <motion.div 
          className="h-full bg-[#707070]" 
          animate={{ width: `${((idx + 1) / flashcards.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Stage */}
      <div className="fixed inset-0 flex items-center justify-center z-1">
        {!isDone ? (
          <div className="relative w-full max-w-[420px] h-full max-h-[580px] px-4">
            {/* Ghost Cards */}
            <div className="absolute inset-0 rounded-xl border border-[#1e1e1e] bg-[#0d0d0d] translate-y-3 scale-[0.94] z-1 pointer-events-none" />
            <div className="absolute inset-0 rounded-xl border border-[#282828] bg-[#111] translate-y-1.5 scale-[0.97] z-2 pointer-events-none" />

            {/* Main Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ y: 60, scale: 0.96, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: -600, scale: 0.94, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.3, 1] }}
                className="absolute inset-0 z-3 cursor-pointer perspective-1200"
                onClick={handleFlip}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                onDragEnd={(e, info) => {
                  if (info.offset.y < -60) {
                    handleRate('good'); // Default to good on swipe
                  }
                }}
              >
                <motion.div
                  className="relative w-full h-full transition-transform duration-500"
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* FRONT */}
                  <div 
                    className="absolute inset-0 rounded-xl overflow-hidden flex flex-col"
                    style={{ backfaceVisibility: 'hidden', background: '#161616', border: '1px solid #363636' }}
                  >
                    {/* Corner Accents */}
                    <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t border-l border-[#363636] opacity-60" />
                    <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b border-r border-[#363636] opacity-60" />
                    
                    <div className="p-4.5 flex items-center justify-between border-b border-[#282828]" style={{ padding: '18px 22px 14px' }}>
                      <span className="text-[9px] text-[#4a4a4a] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        // Question
                      </span>
                      <span className="text-[9px] text-[#4a4a4a] tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {String(idx + 1).padStart(2, '0')} / {String(flashcards.length).padStart(2, '0')}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                      <div className="text-[9px] text-[#4a4a4a] uppercase tracking-widest opacity-70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Tap to reveal answer
                      </div>
                      <div className="text-xl md:text-2xl font-bold text-[#e8e8e8] leading-relaxed tracking-tight">
                        {currentCard?.front}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-[#707070] tracking-widest animate-pulse" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3"><path d="M4 12h16M4 12l4-4M4 12l4 4"/></svg>
                        Tap to flip
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-[#4a4a4a] uppercase tracking-widest opacity-60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-2.5 h-2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                        Swipe up for next
                      </div>
                    </div>
                  </div>

                  {/* BACK */}
                  <div 
                    className="absolute inset-0 rounded-xl overflow-hidden flex flex-col"
                    style={{ 
                      backfaceVisibility: 'hidden', 
                      transform: 'rotateY(180deg)', 
                      background: '#111', 
                      border: '1px solid #282828' 
                    }}
                  >
                    {/* Corner Accents */}
                    <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t border-l border-[#363636] opacity-60" />
                    <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b border-r border-[#363636] opacity-60" />

                    <div className="p-4.5 flex items-center justify-between border-b border-[#282828]" style={{ padding: '18px 22px 14px' }}>
                      <span className="text-[9px] text-[#4a4a4a] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        // Answer
                      </span>
                      <span className="text-[9px] text-[#4a4a4a] tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {String(idx + 1).padStart(2, '0')} / {String(flashcards.length).padStart(2, '0')}
                      </span>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                      <div className="text-[9px] text-[#4a4a4a] uppercase tracking-widest opacity-70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        Explanation
                      </div>
                      <div className="text-base md:text-lg font-normal text-[#a8a8a8] leading-relaxed">
                        {currentCard?.back}
                      </div>
                      <div className="w-10 h-px bg-[#363636]" />
                    </div>

                    <div className="p-5 flex justify-center">
                      <div className="flex items-center gap-1 text-[9px] text-[#4a4a4a] uppercase tracking-widest opacity-60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-2.5 h-2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                        Swipe up for next
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-4 text-center z-10"
          >
            <div className="w-14 h-14 rounded-lg border border-[#363636] bg-[#161616] flex items-center justify-center mb-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-[#707070]">
                <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#e8e8e8]">Deck Complete</h2>
            <div className="text-[11px] text-[#707070] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              // session_end
            </div>
            <div className="flex gap-1 mt-2">
              {(Object.keys(stats) as Array<keyof typeof stats>).map(key => (
                <div key={key} className="bg-[#161616] border border-[#282828] px-4 py-3 text-center min-w-[80px]">
                  <span className="block text-xl font-semibold text-[#e8e8e8]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {stats[key]}
                  </span>
                  <span className="block text-[9px] text-[#4a4a4a] uppercase tracking-widest" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {key}
                  </span>
                </div>
              ))}
            </div>
            <button 
              onClick={restart}
              className="mt-4 px-6 py-2.5 rounded-sm border border-[#363636] bg-[#1c1c1c] text-[#e8e8e8] text-[10px] font-semibold uppercase tracking-widest hover:bg-[#242424] transition-all outline-none"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ↩ Restart Deck
            </button>
          </motion.div>
        )}
      </div>

      {/* Rating Bar */}
      <AnimatePresence>
        {flipped && !isFinished && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20"
          >
            {[
              { id: 'again', label: '↩ Again', color: '#2a1a1a', hover: '#1a1010', text: '#a07070' },
              { id: 'hard', label: 'Hard', color: '#282828', hover: '#1c1c1c', text: '#a8a8a8' },
              { id: 'good', label: 'Good', color: '#282828', hover: '#1c1c1c', text: '#e8e8e8' },
              { id: 'easy', label: 'Easy ✓', color: '#1a2a1a', hover: '#101a10', text: '#70a070' },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => handleRate(btn.id as any)}
                className="px-4 py-2 rounded-sm border text-[10px] font-semibold uppercase tracking-widest transition-all outline-none"
                style={{ 
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: '#161616',
                  borderColor: btn.color,
                  color: '#707070'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = btn.hover;
                  e.currentTarget.style.color = btn.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#161616';
                  e.currentTarget.style.color = '#707070';
                }}
              >
                {btn.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
