// ============================================
// API: Get Session Data
// ============================================

import { NextRequest } from 'next/server';
import * as sessionService from '@/lib/services/sessionService';

export const runtime = 'nodejs';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await sessionService.getSession(id);
    if (!session) {
      return jsonResponse({ error: 'Session not found' }, 404);
    }
    return jsonResponse({ session });
  } catch (error) {
    console.error('Session fetch error:', error);
    return jsonResponse({ error: 'Failed to fetch session' }, 500);
  }
}
