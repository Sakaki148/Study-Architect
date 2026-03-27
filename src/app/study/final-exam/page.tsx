'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { StudySession, Quiz } from '@/types';
import MatchingQuestion from '@/components/quiz/MatchingQuestion';

function FinalExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const [session, setSession] = useState<StudySession | null>(null);
  const [exam, setExam] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (sessionId) fetchOrCreateExam();
  }, [sessionId]);

  const fetchOrCreateExam = async () => {
    try {
      const resSession = await fetch(`/api/session/${sessionId}`);
      const dataSession = await resSession.json();
      const s: StudySession = dataSession.session;
      setSession(s);

      if (s.finalExam) {
        setExam(s.finalExam);
        setLoading(false);
      } else {
        const resGenerate = await fetch('/api/exam/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        const dataGenerate = await resGenerate.json();
        setExam(dataGenerate.quiz);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const currentQuestion = exam?.questions[currentIndex];

  const handleAnswerSelect = (answer: string) => {
    if (!currentQuestion) return;
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };

  const handleNext = () => {
    if (exam && currentIndex < exam.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!exam) return;
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: exam.questions, answers })
      });
      const evalData = await res.json();
      
      sessionStorage.setItem('examEvals', JSON.stringify({
         evaluations: evalData.evaluations,
         exam: exam
      }));
      
      router.push(`/study/final-exam/results?sessionId=${sessionId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate exam.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-[#E0E0E0] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-[#555] animate-spin mb-6" />
        <h2 className="text-2xl font-serif text-[#E0E0E0]">Preparing Assessment</h2>
        <p className="text-[#888] mt-3 tracking-wide text-sm">Please wait while we compile your exam.</p>
      </div>
    );
  }

  if (!exam || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-[#E0E0E0] flex items-center justify-center">
        Failed to load exam.
      </div>
    );
  }

  const questionTypeLabel = {
    'mcq': 'MCQ',
    'true_false': 'TRUE OR FALSE',
    'fill_blank': 'FILL IN THE BLANK',
    'matching': 'MATCHING',
    'short_answer': 'SHORT ANSWER'
  }[currentQuestion.type] || 'QUESTION';

  const isAnswered = !!answers[currentQuestion.id];
  const isLastQuestion = currentIndex === exam.questions.length - 1;

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#E0E0E0] font-sans selection:bg-[#333] flex flex-col items-center justify-center">
      
      {/* Top Meta Header */}
      <div className="fixed top-0 left-0 w-full flex items-center justify-between px-8 py-6 opacity-60 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => router.push(`/study?sessionId=${sessionId}`)} 
          className="text-[10px] font-medium tracking-[0.2em] text-[#888] hover:text-[#fff] transition-colors uppercase"
        >
          ‹ Back to Study
        </button>
        <div className="text-[10px] font-medium tracking-[0.2em] text-[#666] uppercase">
          {session?.title || 'Assessment'}
        </div>
        <div className="text-[10px] font-medium tracking-[0.2em] text-[#888] hover:text-[#fff] transition-colors uppercase cursor-pointer">
          Full Page ↗
        </div>
      </div>

      {/* Main Centered Content Wrapper */}
      <main className="w-full max-w-4xl px-8 py-20 flex flex-col items-center justify-center flex-1 mt-12 mb-20 text-center">
        
        {/* Exam Title & Progress */}
        <div className="mb-20 flex flex-col items-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-[#F5F5F5] tracking-tight">Final Exam</h1>
          <div className="text-[11px] font-semibold tracking-[0.3em] text-[#777] uppercase flex items-center gap-3">
            <span>Progress</span>
            <span className="w-1 h-1 rounded-full bg-[#444]"></span>
            <span className="text-[#E0E0E0] font-mono text-sm">{currentIndex + 1} <span className="text-[#666]">/ {exam.questions.length}</span></span>
          </div>
        </div>

        {/* Question Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-3xl flex flex-col items-center"
          >
            <div className="text-[10px] font-bold tracking-[0.25em] text-[#666] mb-8 uppercase">
              {questionTypeLabel}
            </div>
            
            <h2 className="text-3xl md:text-[2.2rem] font-serif text-[#F5F5F5] leading-snug mb-16 max-w-2xl text-center text-balance">
              {currentQuestion.question}
            </h2>

            {/* Answer Options */}
            <div className="w-full space-y-4 flex flex-col items-center">
              
              {currentQuestion.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-6 w-full max-w-xl">
                  {['True', 'False'].map((opt) => {
                    const selected = answers[currentQuestion.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswerSelect(opt)}
                        className={`flex flex-col items-center justify-center p-10 rounded-lg border transition-all duration-300 ease-out group ${
                          selected 
                            ? 'border-white bg-white/5 shadow-[0_4px_30px_rgba(255,255,255,0.03)]' 
                            : 'border-[#222] hover:bg-[#161616] hover:border-[#444]'
                        }`}
                      >
                        <span className={`text-[13px] font-bold tracking-[0.2em] uppercase transition-colors ${selected ? 'text-white' : 'text-[#888] group-hover:text-[#ccc]'}`}>{opt}</span>
                        {/* Removed the deeply rounded icon to align visually with minimalism */}
                      </button>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === 'mcq' && currentQuestion.options && (
                <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt, idx) => {
                    const selected = answers[currentQuestion.id] === opt;
                    const letters = ['A', 'B', 'C', 'D', 'E'];
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswerSelect(opt)}
                        className={`w-full flex flex-col items-center text-center p-8 rounded-lg border transition-all duration-300 ease-out group ${
                          selected 
                            ? 'border-white bg-white/5 shadow-[0_4px_30px_rgba(255,255,255,0.03)]' 
                            : 'border-[#222] hover:bg-[#121212] hover:border-[#444]'
                        }`}
                      >
                        <div className={`text-[10px] font-bold tracking-[0.25em] mb-4 transition-colors ${selected ? 'text-white' : 'text-[#555] group-hover:text-[#888]'}`}>
                          {letters[idx]}
                        </div>
                        <span className={`text-[15px] font-medium leading-relaxed transition-colors ${selected ? 'text-white' : 'text-[#aaa] group-hover:text-[#eee]'}`}>
                          {opt}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === 'short_answer' && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="Enter your response..."
                  className="w-full max-w-2xl h-40 bg-transparent border border-[#333] hover:border-[#555] rounded-lg p-8 text-center text-[#E0E0E0] text-lg focus:outline-none focus:border-white focus:bg-white/[0.02] transition-colors resize-none placeholder-[#444]"
                />
              )}

              {currentQuestion.type === 'fill_blank' && (
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  placeholder="Type the missing word..."
                  className="w-full max-w-md bg-transparent border border-[#333] hover:border-[#555] rounded-lg px-8 py-5 text-center text-[#E0E0E0] text-lg focus:outline-none focus:border-white focus:bg-white/[0.02] transition-colors placeholder-[#444]"
                />
              )}

              {currentQuestion.type === 'matching' && currentQuestion.matchingPairs && (
                <div className="w-full max-w-4xl text-left bg-transparent border border-[#222] rounded-lg p-8 md:p-12">
                  <MatchingQuestion 
                    questionId={currentQuestion.id}
                    pairs={currentQuestion.matchingPairs}
                    answer={answers[currentQuestion.id]}
                    onChange={(value) => handleAnswerSelect(value)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Navigation - Centered Minimalist */}
      <div className="fixed bottom-0 left-0 w-full pb-10 flex flex-col items-center justify-center gap-4 bg-gradient-to-t from-[#0E0E10] via-[#0E0E10] to-transparent pt-12">
        <div className="flex items-center gap-8">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`text-[11px] font-semibold tracking-[0.2em] uppercase transition-all ${
              currentIndex === 0 
                ? 'opacity-20 cursor-not-allowed text-[#888]' 
                : 'text-[#888] hover:text-[#fff]'
            }`}
          >
            Prev
          </button>
          
          {/* Subtle separator dot */}
          <div className="w-1 h-1 rounded-full bg-[#333]"></div>

          {!isLastQuestion ? (
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              className={`text-[11px] font-semibold tracking-[0.2em] uppercase transition-all ${
                !isAnswered 
                  ? 'text-[#555] opacity-50 cursor-not-allowed' 
                  : 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isAnswered || submitting}
              className={`text-[11px] font-semibold tracking-[0.2em] uppercase transition-all ${
                !isAnswered || submitting 
                  ? 'text-[#555] opacity-50 cursor-not-allowed' 
                  : 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
      
    </div>
  );
}

export default function FinalExamPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0E0E10]" />}>
      <FinalExamContent />
    </Suspense>
  );
}
