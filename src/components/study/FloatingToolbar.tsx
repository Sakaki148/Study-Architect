'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, Brain } from 'lucide-react';

interface FloatingToolbarProps {
  visible: boolean;
  position: { x: number; y: number };
  onExplainMore: () => void;
  onAskAI: () => void;
  onQuiz: () => void;
  expandedExplanation?: string | null;
}

export default function FloatingToolbar({ visible, position, onExplainMore, onAskAI, onQuiz, expandedExplanation }: FloatingToolbarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="floating-toolbar fixed z-50 flex flex-col gap-2 overflow-hidden rounded-[16px] border border-white/10 bg-[#111111] p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.85)]"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%)',
          }}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: -12, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {expandedExplanation ? (
            <div className="max-h-[60vh] w-[min(32rem,85vw)] overflow-y-auto p-5 text-[15px]">
              <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-white/50">Selected text</span>
                  <span className="text-sm font-bold text-white/90">Explanation</span>
                </div>
              </div>
              <p className="select-text text-white/80 leading-relaxed cursor-text text-[15px]">
                {expandedExplanation}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <motion.button
                onClick={onExplainMore}
                className="group flex items-center gap-2.5 rounded-[12px] px-4 py-3 text-left transition-colors hover:bg-white/10"
                whileTap={{ scale: 0.98 }}
              >
                <Sparkles className="w-4 h-4 text-white/70 group-hover:text-white" />
                <span className="text-[13px] font-semibold text-white/90">Explain</span>
              </motion.button>

              <div className="w-[1px] h-6 bg-white/10 mx-1" />

              <motion.button
                onClick={onAskAI}
                className="group flex items-center gap-2.5 rounded-[12px] px-4 py-3 text-left transition-colors hover:bg-white/10"
                whileTap={{ scale: 0.98 }}
              >
                <MessageSquare className="w-4 h-4 text-white/70 group-hover:text-white" />
                <span className="text-[13px] font-semibold text-white/90">Ask AI</span>
              </motion.button>

              <div className="w-[1px] h-6 bg-white/10 mx-1" />

              <motion.button
                onClick={onQuiz}
                className="group flex items-center gap-2.5 rounded-[12px] px-4 py-3 text-left transition-colors hover:bg-white/10"
                whileTap={{ scale: 0.98 }}
              >
                <Brain className="w-4 h-4 text-white/70 group-hover:text-white" />
                <span className="text-[13px] font-semibold text-white/90">Quiz</span>
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
