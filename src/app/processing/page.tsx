'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, FileSearch, BookOpen, Brain, Sparkles } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

interface Step {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'pending' | 'active' | 'completed' | 'error';
}

function ProcessingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const [steps, setSteps] = useState<Step[]>([
    { id: 'parse', label: 'Parsing documents', icon: FileSearch, status: 'completed' },
    { id: 'structure', label: 'Structuring content', icon: BookOpen, status: 'pending' },
    { id: 'notes', label: 'Generating comprehensive notes', icon: Sparkles, status: 'pending' },
    { id: 'timeline', label: 'Building smart timeline', icon: Brain, status: 'pending' },
    { id: 'flashcards', label: 'Creating flashcards', icon: Brain, status: 'pending' },
  ]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const processSession = async () => {
      try {
        // Step 1: Structuring
        updateStep('structure', 'active');
        await delay(1000);
        updateStep('structure', 'completed');

        // Step 2: Generate notes
        updateStep('notes', 'active');
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Generation failed');
        }

        updateStep('notes', 'completed');
        updateStep('timeline', 'completed');
        updateStep('flashcards', 'completed');

        await delay(800);
        router.push(`/study?sessionId=${sessionId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Processing failed');
        const activeStep = steps.find(s => s.status === 'active');
        if (activeStep) updateStep(activeStep.id, 'error');
      }
    };

    processSession();
  }, [sessionId]);

  const updateStep = (id: string, status: Step['status']) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const activeIndex = steps.findIndex(s => s.status === 'active');
  const progress = steps.filter(s => s.status === 'completed').length / steps.length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="relative z-10 max-w-lg w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--accent-glow)] mb-6"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Brain className="w-10 h-10 text-[var(--accent-primary)]" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Processing Your Materials</h1>
          <p className="text-[var(--text-secondary)]">
            AI is analyzing and structuring your study content
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="timer-bar h-2 rounded-full">
            <motion.div
              className="timer-bar-fill h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-2 text-center">
            {Math.round(progress * 100)}% complete
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                className={`glass-card p-5 flex items-center gap-4 ${
                  step.status === 'active' ? 'border-[var(--accent-primary)]' : ''
                } ${step.status === 'error' ? 'border-[var(--error)]' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-500/10' :
                  step.status === 'active' ? 'bg-[var(--accent-glow)]' :
                  step.status === 'error' ? 'bg-red-500/10' :
                  'bg-[var(--bg-card)]'
                }`}>
                  {step.status === 'completed' ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </motion.div>
                  ) : step.status === 'active' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-5 h-5 text-[var(--accent-primary)]" />
                    </motion.div>
                  ) : (
                    <Icon className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    step.status === 'active' ? 'text-[var(--text-primary)]' :
                    step.status === 'completed' ? 'text-green-400' :
                    step.status === 'error' ? 'text-red-400' :
                    'text-[var(--text-muted)]'
                  }`}>
                    {step.label}
                  </p>
                </div>
                {step.status === 'active' && (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <motion.div
            className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="font-medium mb-1">Processing Error</p>
            <p>{error}</p>
            <p className="mt-2 text-red-300/70">Make sure your GEMINI_API_KEY is set in your .env.local file.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-[var(--accent-primary)]" />
        </motion.div>
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  );
}
