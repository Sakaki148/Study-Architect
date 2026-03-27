'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Quiz, QuizAnswerEvaluation } from '@/types';
import MatchingQuestion from './MatchingQuestion';
import { gradeQuestionLocally } from '@/lib/quiz/grading';

interface QuizModalProps {
  sessionId: string;
  selectedText?: string;
  onClose: () => void;
}

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'config' | 'loading' | 'quiz' | 'grading' | 'results';

const questionTypeLabels: Record<string, string> = {
  mcq: 'Multiple Choice',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
  matching: 'Matching',
  short_answer: 'Short Answer',
  mixed: 'Mixed',
};

export default function QuizModal({ sessionId, selectedText, onClose }: QuizModalProps) {
  const [phase, setPhase] = useState<Phase>('config');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['mcq', 'true_false', 'fill_blank', 'short_answer', 'matching']);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, QuizAnswerEvaluation>>({});

  const toggleType = (type: string) => {
    if (type === 'mixed') {
      setSelectedTypes(['mcq', 'true_false', 'fill_blank', 'short_answer', 'matching']);
      return;
    }

    setSelectedTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type];
      return next.length ? next : prev;
    });
  };

  const startQuiz = async () => {
    setPhase('loading');
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          selectedText,
          difficulty,
          questionTypes: selectedTypes,
          count: selectedText ? 4 : 10,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate quiz');
      setQuiz(data.quiz);
      setCurrentQ(0);
      setAnswers({});
      setEvaluations({});
      setPhase('quiz');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to generate quiz');
      setPhase('config');
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const submitQuiz = async () => {
    if (!quiz) return;

    setPhase('grading');
    try {
      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: quiz.questions, answers }),
      });
      const data = await res.json();
      const nextEvaluations = (data.evaluations as QuizAnswerEvaluation[]).reduce<Record<string, QuizAnswerEvaluation>>((acc, evaluation) => {
        acc[evaluation.questionId] = evaluation;
        return acc;
      }, {});
      setEvaluations(nextEvaluations);
    } catch {
      const fallback = quiz.questions.reduce<Record<string, QuizAnswerEvaluation>>((acc, question) => {
        acc[question.id] = gradeQuestionLocally(question, answers[question.id]);
        return acc;
      }, {});
      setEvaluations(fallback);
    } finally {
      setPhase('results');
    }
  };

  const question = quiz?.questions[currentQ];
  const score = useMemo(() => Object.values(evaluations).filter((item) => item.isCorrect).length, [evaluations]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0" onClick={onClose} />

      <motion.div
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#111216,#0a0b0f)] shadow-[0_40px_120px_-28px_rgba(0,0,0,0.85)]"
        initial={{ scale: 0.96, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 18 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      >
        <div className="flex items-center gap-4 border-b border-white/8 px-6 py-5">
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04]"
          >
            <ArrowLeft className="h-5 w-5 text-white/70" />
          </motion.button>
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/35">
              {phase === 'config' ? 'Context quiz setup' : phase === 'results' ? 'Results' : 'Quiz in progress'}
            </div>
            <div className="text-xl font-bold text-white">
              {selectedText ? 'Selected text practice' : 'Context Quiz'}
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          {phase === 'config' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/35">Difficulty</div>
                <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((item) => {
                    const active = difficulty === item;
                    return (
                      <motion.button
                        key={item}
                        onClick={() => setDifficulty(item)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`rounded-2xl border px-4 py-4 text-sm font-bold capitalize transition ${
                          active
                            ? 'border-white/18 bg-white text-black'
                            : 'border-white/8 bg-[#18191e] text-white/65'
                        }`}
                      >
                        {item}
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/35">Question types</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(questionTypeLabels).map(([key, label]) => {
                    const isActive = key === 'mixed' ? selectedTypes.length >= 5 : selectedTypes.includes(key);
                    return (
                      <motion.button
                        key={key}
                        onClick={() => toggleType(key)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`rounded-2xl border px-4 py-4 text-left transition ${
                          isActive
                            ? 'border-sky-300/30 bg-sky-400/10 text-white'
                            : 'border-white/8 bg-[#18191e] text-white/55'
                        }`}
                      >
                        <div className="text-sm font-bold">{label}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              <motion.button
                onClick={startQuiz}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full rounded-[22px] bg-white px-5 py-4 text-base font-bold text-black"
              >
                Start Quiz
              </motion.button>
            </motion.div>
          )}

          {(phase === 'loading' || phase === 'grading') && (
            <div className="flex min-h-[22rem] flex-col items-center justify-center text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}>
                <Loader2 className="h-10 w-10 text-white/65" />
              </motion.div>
              <div className="mt-5 text-lg font-semibold text-white">
                {phase === 'loading' ? 'Generating your quiz' : 'Reviewing your answers'}
              </div>
              <p className="mt-2 max-w-sm text-sm text-white/45">
                {phase === 'loading'
                  ? 'Building practice questions from the exact context you selected.'
                  : 'Checking correctness and accepting close answers where the meaning still matches.'}
              </p>
            </div>
          )}

          {phase === 'quiz' && question && quiz && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="space-y-6"
              >
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/35">
                      Question {currentQ + 1} of {quiz.questions.length}
                    </div>
                    <h2 className="mt-2 text-2xl font-bold leading-tight text-white">{question.question}</h2>
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                    {question.type.replace('_', ' ')}
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#a78bfa)]"
                    animate={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
                  />
                </div>

                {question.type === 'mcq' && question.options && (
                  <div className="space-y-3">
                    {question.options.map((option, index) => {
                      const active = answers[question.id] === option;
                      return (
                        <motion.button
                          key={option}
                          onClick={() => handleAnswer(question.id, option)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`flex w-full items-center gap-4 rounded-[22px] border px-4 py-4 text-left transition ${
                            active
                              ? 'border-white/18 bg-white/[0.08]'
                              : 'border-white/8 bg-[#15161b] text-white/80'
                          }`}
                        >
                          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${
                            active ? 'bg-white text-black' : 'bg-white/[0.06] text-white/55'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-sm leading-6">{option}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {question.type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-3">
                    {['True', 'False'].map((option) => {
                      const active = answers[question.id] === option;
                      return (
                        <motion.button
                          key={option}
                          onClick={() => handleAnswer(question.id, option)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`rounded-[22px] border px-4 py-5 text-base font-bold transition ${
                            active
                              ? 'border-white/18 bg-white text-black'
                              : 'border-white/8 bg-[#15161b] text-white/70'
                          }`}
                        >
                          {option}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {question.type === 'fill_blank' && (
                  <input
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={(event) => handleAnswer(question.id, event.target.value)}
                    placeholder="Type your answer..."
                    className="input-field rounded-[22px] border-white/10 bg-[#15161b] px-5 py-4 text-base"
                  />
                )}

                {question.type === 'short_answer' && (
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(event) => handleAnswer(question.id, event.target.value)}
                    placeholder="Write your answer..."
                    className="input-field min-h-[11rem] resize-none rounded-[22px] border-white/10 bg-[#15161b] px-5 py-4 text-base"
                  />
                )}

                {question.type === 'matching' && question.matchingPairs && (
                  <MatchingQuestion
                    questionId={question.id}
                    pairs={question.matchingPairs}
                    answer={answers[question.id]}
                    onChange={(value) => handleAnswer(question.id, value)}
                    compact
                  />
                )}

                <div className="flex gap-3 pt-2">
                  {currentQ > 0 && (
                    <motion.button
                      onClick={() => setCurrentQ((prev) => prev - 1)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex-1 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm font-bold text-white/70"
                    >
                      Previous
                    </motion.button>
                  )}
                  {currentQ < quiz.questions.length - 1 ? (
                    <motion.button
                      onClick={() => setCurrentQ((prev) => prev + 1)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex-[1.4] rounded-[22px] bg-white px-4 py-4 text-sm font-bold text-black"
                    >
                      Next Question
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={submitQuiz}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="flex-[1.4] rounded-[22px] bg-[linear-gradient(135deg,#38bdf8,#818cf8)] px-4 py-4 text-sm font-bold text-white"
                    >
                      Submit Quiz
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {phase === 'results' && quiz && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-[30px] border border-white/8 bg-white/[0.03] p-6 text-center">
                <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/14">
                  <Sparkles className="h-7 w-7 text-emerald-300" />
                </div>
                <div className="text-5xl font-black text-white">{score}/{quiz.questions.length}</div>
                <p className="mt-2 text-sm text-white/45">
                  {Math.round((score / quiz.questions.length) * 100)}% correct after exact and close-answer grading
                </p>
              </div>

              <div className="space-y-3">
                {quiz.questions.map((item, index) => {
                  const evaluation = evaluations[item.id];
                  const isCorrect = evaluation?.isCorrect;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className={`rounded-[24px] border p-5 ${
                        isCorrect
                          ? 'border-emerald-400/18 bg-emerald-400/[0.05]'
                          : 'border-red-400/18 bg-red-400/[0.05]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-300" />
                        )}
                        <div className="flex-1">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">
                            {item.type.replace('_', ' ')}
                          </div>
                          <p className="mt-2 text-sm font-semibold text-white/90">{item.question}</p>
                          <div className="mt-3 space-y-1 text-sm">
                            <p className="text-white/50">Your answer: <span className={isCorrect ? 'text-emerald-200' : 'text-red-200'}>{evaluation?.userAnswer || '(no answer)'}</span></p>
                            {!isCorrect && (
                              <p className="text-white/50">Expected answer: <span className="text-white/85">{evaluation?.correctAnswer || item.correctAnswer}</span></p>
                            )}
                          </div>
                          <p className="mt-3 rounded-2xl bg-black/20 px-3 py-2 text-sm text-white/55">
                            {evaluation?.rationale || item.explanation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full rounded-[22px] bg-white px-5 py-4 text-base font-bold text-black"
              >
                Done
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
