// ============================================
// API: AI Explain + Chat
// ============================================

import { NextRequest } from 'next/server';
import { explainMore, askAI } from '@/lib/ai';

export const runtime = 'nodejs';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { type, text, context, depth, question, chatHistory } = await request.json();

    if (type === 'explain') {
      const explanation = await explainMore(text, context, depth || 1);
      return jsonResponse({ explanation });
    }

    if (type === 'chat') {
      const answer = await askAI(question, context, chatHistory || []);
      return jsonResponse({ answer });
    }

    return jsonResponse({ error: 'Invalid type. Use "explain" or "chat".' }, 400);
  } catch (error) {
    console.error('AI chat error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'AI request failed' },
      500
    );
  }
}
