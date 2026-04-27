import { NextRequest } from 'next/server';
import * as sessionService from '@/lib/services/sessionService';
import { generateQuiz } from '@/lib/ai';
import crypto from 'crypto';

export const maxDuration = 300;
export const runtime = 'nodejs';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return jsonResponse({ error: 'Session ID required' }, 400);
    }

    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return jsonResponse({ error: 'Session not found' }, 404);
    }

    const notesContent = session.notes?.content || session.materials.map(m => m.content).join('\n\n');
    const flashcardsContent = session.flashcards ? session.flashcards.map(f => `Q: ${f.front} A: ${f.back}`).join('\n') : '';
    const allContent = notesContent + '\n\n' + flashcardsContent;
    
    // We cap to avoid token limit errors
    const trimmedContent = allContent.substring(0, 80000);

    const types = ['mcq', 'true_false', 'fill_blank', 'short_answer', 'matching'];
    const questions = await generateQuiz(trimmedContent, 'medium', types, 30);

    const quiz = {
      id: crypto.randomUUID(),
      sessionId,
      title: 'Final Exam',
      difficulty: 'medium' as const,
      questions,
    };

    // Save final exam to session
    await sessionService.updateSession(sessionId, { finalExam: quiz });

    return jsonResponse({ quiz });
  } catch (error) {
    console.error('Final Exam generation error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Exam generation failed' },
      500
    );
  }
}
