import { NextRequest } from 'next/server';
import { evaluateQuizAnswersWithAI } from '@/lib/ai';
import { gradeQuestionLocally } from '@/lib/quiz/grading';
import { QuizQuestion } from '@/types';

export const runtime = 'nodejs';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { questions, answers } = await request.json() as {
      questions: QuizQuestion[];
      answers: Record<string, string>;
    };

    if (!questions?.length) {
      return jsonResponse({ error: 'Questions are required' }, 400);
    }

    const safeAnswers = answers || {};

    try {
      const evaluations = await evaluateQuizAnswersWithAI(questions, safeAnswers);
      if (!Array.isArray(evaluations) || evaluations.length !== questions.length) {
        throw new Error('Incomplete AI evaluation');
      }
      return jsonResponse({ evaluations, source: 'ai' });
    } catch {
      const evaluations = questions.map((question) => gradeQuestionLocally(question, safeAnswers[question.id]));
      return jsonResponse({ evaluations, source: 'local' });
    }
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Evaluation failed' },
      500
    );
  }
}
