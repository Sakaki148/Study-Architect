// ============================================
// API: Quiz Generation
// ============================================

import { NextRequest } from 'next/server';
import * as sessionService from '@/lib/services/sessionService';
import { generateQuiz } from '@/lib/ai';
import crypto from 'crypto';

export const runtime = 'nodejs';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, difficulty, questionTypes, count, title, selectedText } = await request.json();

    if (!sessionId) {
      return jsonResponse({ error: 'Session ID required' }, 400);
    }

    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return jsonResponse({ error: 'Session not found' }, 404);
    }

    const allContent = selectedText || session.materials.map(m => m.content).join('\n\n');
    const types = questionTypes || ['mcq', 'true_false', 'fill_blank', 'short_answer'];
    const questions = await generateQuiz(allContent, difficulty || 'medium', types, count || (selectedText ? 3 : 10));

    const quiz = {
      id: crypto.randomUUID(),
      sessionId,
      title: title || `Quiz - ${difficulty || 'Medium'}`,
      difficulty: difficulty || 'medium',
      questions,
    };

    await sessionService.saveQuiz(quiz);

    return jsonResponse({ quiz });
  } catch (error) {
    console.error('Quiz generation error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Quiz generation failed' },
      500
    );
  }
}
