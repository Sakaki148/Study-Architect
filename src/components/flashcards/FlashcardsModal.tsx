'use client';

import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Flashcard } from '@/types';

interface FlashcardsModalProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

const difficultyColors = {
  easy: 'text-green-400 bg-green-400/10',
  medium: 'text-yellow-400 bg-yellow-400/10',
  hard: 'text-red-400 bg-red-400/10',
};

export default function FlashcardsModal({ flashcards, onClose }: FlashcardsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const controls = useAnimation();

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentIndex(prev => Math.min(prev + 1, flashcards.length));
  };

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -50 || info.velocity.y < -500) {
      // Swipe up - simulate pushing to the back
      await controls.start({ y: -80, scale: 0.8, opacity: 0, zIndex: -10, transition: { duration: 0.25 } });
      nextCard();
      controls.set({ y: 0, scale: 1, opacity: 1, zIndex: 'auto' });
    } else {
      controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const visibleCards = flashcards.slice(currentIndex, currentIndex + 4);
  const isFinished = currentIndex >= flashcards.length;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col h-full py-12">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Flashcards</h2>
            <p className="text-sm font-medium text-[var(--accent-secondary)] mt-1">
              {!isFinished ? `${currentIndex + 1} of ${flashcards.length}` : 'Completed'}
            </p>
          </div>
          <motion.button
            onClick={onClose}
            className="p-3 rounded-full hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Deck Area */}
        <div className="flex-1 relative flex items-center justify-center perspective-1000">
          <AnimatePresence mode="popLayout">
            {isFinished ? (
              <motion.div
                key="finished"
                className="glass-card w-full p-12 text-center rounded-3xl border border-white/10 bg-white/5 shadow-2xl flex flex-col items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Deck Completed!</h3>
                <p className="text-[var(--text-secondary)] mb-8">You went through all {flashcards.length} cards.</p>
                <motion.button
                  onClick={() => { setCurrentIndex(0); setIsFlipped(false); }}
                  className="btn-primary w-full py-4 text-lg font-bold rounded-2xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Study Again
                </motion.button>
              </motion.div>
            ) : (
              [...visibleCards].reverse().map((card, revIndex) => {
                const isTop = card.id === flashcards[currentIndex]?.id;
                // offset: 0 for the top card, 1 for the next, etc.
                const offset = visibleCards.findIndex(c => c.id === card.id);

                return (
                  <motion.div
                    key={card.id}
                    className="absolute w-full"
                    style={{
                      zIndex: 10 - offset,
                    }}
                    initial={{
                      y: offset * 30,
                      scale: 1 - offset * 0.05,
                      opacity: offset === 3 ? 0 : 1,
                    }}
                    animate={{
                      y: offset * 25,
                      scale: 1 - offset * 0.05,
                      opacity: 1,
                    }}
                    exit={{ opacity: 0, y: -100, scale: 0.8, transition: { duration: 0.2 } }}
                    drag={isTop ? 'y' : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={isTop ? 0.8 : 0}
                    onDragEnd={(e, info) => {
                      if (isTop && (info.offset.y < -50 || info.velocity.y < -500)) {
                        nextCard();
                      }
                    }}
                    onClick={isTop ? handleFlip : undefined}
                  >
                    <motion.div
                      className="relative w-full aspect-[3/4] max-h-[60vh] rounded-[2rem] shadow-2xl cursor-pointer"
                      animate={{ rotateY: isTop && isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Front Card */}
                      <div
                        className="absolute inset-0 glass-card bg-[#18181b] border border-white/10 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center shadow-2xl"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <span className={`absolute top-6 left-6 text-xs font-bold tracking-wider uppercase px-4 py-1.5 rounded-full ${difficultyColors[card.difficulty]}`}>
                          {card.difficulty}
                        </span>
                        
                        <p className="text-2xl font-bold leading-snug tracking-tight text-white mb-8">{card.front}</p>
                        
                        <div className="absolute bottom-8 left-0 w-full flex flex-col items-center">
                          <p className="text-sm font-semibold text-indigo-400 mb-1">Tap to flip</p>
                          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Swipe up to next</p>
                        </div>
                      </div>

                      {/* Back Card */}
                      <div
                        className="absolute inset-0 glass-card bg-[#18181b] border border-indigo-500/30 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center shadow-2xl"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <span className="absolute top-6 left-6 text-xs font-bold text-indigo-300 bg-indigo-500/20 px-4 py-1.5 rounded-full uppercase tracking-wider">
                          Answer
                        </span>
                        
                        <p className="text-xl font-medium leading-relaxed text-indigo-50">{card.back}</p>
                        
                        <div className="absolute bottom-8 left-0 w-full flex flex-col items-center">
                          <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Swipe up for next card</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
