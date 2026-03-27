import { NextRequest, NextResponse } from 'next/server';
import * as sessionService from '@/lib/services/sessionService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { sessionIds, userId } = await request.json();

    if (!sessionIds || !userId || !Array.isArray(sessionIds)) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    for (const id of sessionIds) {
      const session = await sessionService.getSession(id);
      // Only claim if it has no user assigned
      if (session && !session.userId) {
        await sessionService.updateSession(id, { userId });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
