'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, CheckCircle2, XCircle, ChevronRight, Target } from 'lucide-react';
import { QuizAnswerEvaluation, Quiz } from '@/types';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const [evaluations, setEvaluations] = useState<QuizAnswerEvaluation[]>([]);
  const [exam, setExam] = useState<Quiz | null>(null);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataStr = sessionStorage.getItem('examEvals');
    if (dataStr && sessionId) {
      const data = JSON.parse(dataStr);
      setEvaluations(data.evaluations);
      setExam(data.exam);
      fetchFocusAreas(data.evaluations, sessionId);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchFocusAreas = async (evals: QuizAnswerEvaluation[], sid: string) => {
    try {
      const res = await fetch('/api/exam/focus-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, evaluations: evals })
      });
      const data = await res.json();
      if (data.focusAreas) {
        setFocusAreas(data.focusAreas);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] text-[#f1f1f1] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
        <h2 className="text-xl font-serif">Analyzing your performance...</h2>
        <p className="text-[#a0a0a0] mt-2">Zylo is generating focus areas from your incorrect answers.</p>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="min-h-screen bg-[#111111] text-[#f1f1f1] flex flex-col items-center justify-center font-sans">
        No evaluation data found. 
        <button onClick={() => router.push(`/study?sessionId=${sessionId}`)} className="mt-4 text-emerald-400">Return to Study</button>
      </div>
    );
  }

  const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0);
  const maxScore = evaluations.length;
  const percentage = Math.round((totalScore / maxScore) * 100);

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#E0E0E0] font-sans selection:bg-[#333]">
      {/* Top Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-[#222]">
        <button onClick={() => router.push(`/study?sessionId=${sessionId}`)} className="flex items-center gap-2 text-xs font-semibold tracking-widest text-[#888] hover:text-[#fff] transition-colors uppercase">
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <div className="text-xs font-semibold tracking-widest text-[#666] uppercase">
          Final Exam Results
        </div>
        <div className="w-24" /> {/* Spacer */}
      </header>

      <main className="max-w-4xl mx-auto px-8 py-12">
        {/* Score Header */}
        <div className="flex flex-col items-center justify-center space-y-6 mb-16 px-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-end gap-2"
          >
            <span className={`text-8xl font-serif tracking-tighter ${percentage >= 80 ? 'text-emerald-400' : percentage >= 60 ? 'text-yellow-400' : 'text-rose-400'}`}>
              {percentage}%
            </span>
          </motion.div>
          
          <h1 className="text-3xl font-serif text-white">Your Final Score</h1>
          <p className="text-[#a0a0a0] text-lg">You correctly answered {Math.round(totalScore)} out of {maxScore} questions.</p>
        </div>

        {/* AI Focus Areas Panel */}
        {focusAreas.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-16 bg-[#161616] border border-[#2A2A2A] rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-serif text-white">What You Should Focus On</h2>
            </div>
            <ul className="space-y-4">
              {focusAreas.map((area, idx) => (
                <li key={idx} className="flex gap-4">
                  <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-[#2A2A2A] text-[#888] flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-[#E0E0E0] text-[15px] leading-relaxed">{area}</p>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Question Review List */}
        <div className="space-y-8">
          <h2 className="text-xl font-serif text-white mb-6 border-b border-[#333] pb-4">Detailed Review</h2>
          {evaluations.map((evalData, idx) => {
            const question = exam?.questions.find(q => q.id === evalData.questionId);
            return (
              <motion.div 
                key={evalData.questionId}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                className="bg-[#161616] border border-[#2A2A2A] rounded-2xl overflow-hidden"
              >
                {/* Header bar indicator */}
                <div className={`h-1 w-full ${evalData.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                
                <div className="p-8">
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.2em] text-[#888] mb-3 uppercase">
                        Question {idx + 1}
                      </p>
                      <h3 className="text-xl font-serif text-white leading-relaxed">
                        {question?.question || 'Unknown Question'}
                      </h3>
                    </div>
                    {evalData.isCorrect ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-rose-500 flex-shrink-0" />
                    )}
                  </div>

                  <div className="space-y-4 mt-8">
                    <div className="bg-[#1F1F1F] rounded-lg p-5 border border-[#333]">
                      <span className="text-xs font-bold tracking-wider text-[#666] uppercase block mb-2">Your Answer</span>
                      <p className={`text-[15px] ${evalData.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>{evalData.userAnswer || '(No answer provided)'}</p>
                    </div>

                    {!evalData.isCorrect && (
                      <div className="bg-[#1F1F1F] rounded-lg p-5 border border-[#333]">
                        <span className="text-xs font-bold tracking-wider text-[#666] uppercase block mb-2">Correct Answer</span>
                        <p className="text-[15px] text-[#E0E0E0]">{evalData.correctAnswer}</p>
                      </div>
                    )}
                  </div>

                  {/* AI Explanation */}
                  <div className="mt-8 pt-6 border-t border-[#333]">
                    <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase block mb-3 flex items-center gap-2">
                       Explanation
                    </span>
                    <p className="text-[#A0A0A0] text-[15px] leading-relaxed">{evalData.rationale}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="mt-16 flex justify-center">
          <button
            onClick={() => router.push(`/study?sessionId=${sessionId}`)}
            className="btn-primary px-8 py-4 bg-white text-black hover:bg-[#e0e0e0] flex items-center gap-2 rounded-xl font-semibold tracking-wide"
          >
            Review Session Dashboard
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111111]" />}>
      <ResultsContent />
    </Suspense>
  );
}
