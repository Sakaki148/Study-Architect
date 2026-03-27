// ============================================
// API: Time Suggestion
// ============================================

import { NextRequest } from 'next/server';
import * as sessionService from '@/lib/services/sessionService';
import { generateTimeSuggestion } from '@/lib/ai';

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
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return jsonResponse({ error: 'Session not found' }, 404);
    }
    const allContent = session.materials.map(m => m.content).join('\n\n');
    const suggestion = await generateTimeSuggestion(allContent);
    return jsonResponse({ suggestion });
  } catch (error) {
    console.error('Time suggestion error:', error);
    return jsonResponse({ error: 'Failed to generate suggestion' }, 500);
  }
}
