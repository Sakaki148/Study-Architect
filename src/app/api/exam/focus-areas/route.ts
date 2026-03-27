import { NextRequest } from 'next/server';
import * as sessionService from '@/lib/services/sessionService';
import { generateJSONWithGemini } from '@/lib/ai';
import { QuizAnswerEvaluation } from '@/types';

export const runtime = 'nodejs';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, evaluations } = await request.json() as { sessionId: string, evaluations: QuizAnswerEvaluation[] };

    if (!sessionId) {
      return jsonResponse({ error: 'Session ID required' }, 400);
    }

    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return jsonResponse({ error: 'Session not found' }, 404);
    }

    // Filter to incorrect evaluations
    const incorrectEvals = evaluations.filter(e => !e.isCorrect || e.score < 1);
    
    if (incorrectEvals.length === 0) {
        const focusAreas = ["Excellent job! You have fully mastered the material."];
        await sessionService.updateSession(sessionId, { finalExamFocusAreas: focusAreas });
        return jsonResponse({ focusAreas });
    }

    const prompt = `Based on the following incorrect exam answers, identify exactly 3 specific topics or concepts the student should focus on reviewing. 
    Keep each suggestion concise, actionable, and encouraging (max 1 short sentence per suggestion).

    Incorrect Answers Context:
    ${JSON.stringify(incorrectEvals.map(e => ({
       userAnswer: e.userAnswer,
       correctAnswer: e.correctAnswer,
       conceptFeedback: e.rationale
    })).slice(0, 15), null, 2)}
    
    Return a JSON array of strings, where each string is a focus topic. DO NOT return markdown, just the JSON array ['topic1', 'topic2', 'topic3'].`;

    const focusAreas = await generateJSONWithGemini<string[]>(prompt);

    await sessionService.updateSession(sessionId, { finalExamFocusAreas: focusAreas });

    return jsonResponse({ focusAreas });
  } catch (error) {
    console.error('Focus area generation error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Focus area generation failed' },
      500
    );
  }
}
