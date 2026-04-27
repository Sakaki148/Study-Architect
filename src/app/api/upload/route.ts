// ============================================
// API: Upload & Process Files
// ============================================

import { NextRequest } from 'next/server';
import { parseFile } from '@/lib/parsers';
import * as sessionService from '@/lib/services/sessionService';
import { StudySession, StudyMaterial } from '@/types';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const focusAreas = formData.get('focusAreas') as string || '';
    const chapters = formData.get('chapters') as string || '';
    const userId = formData.get('userId') as string || undefined;
    const studyDepth = (formData.get('studyDepth') as '1hr' | 'standard' | 'detailed') || 'standard';

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessionId = crypto.randomUUID();
    const materials: StudyMaterial[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const content = await parseFile(buffer, file.name);

      materials.push({
        id: crypto.randomUUID(),
        fileName: file.name,
        fileType: file.type || file.name.split('.').pop() || 'unknown',
        content,
        createdAt: new Date().toISOString(),
        sessionId,
      });
    }

    const session: StudySession = {
      id: sessionId,
      userId,
      title: files.length === 1 ? files[0].name.replace(/\.[^/.]+$/, '') : `Study Session - ${files.length} files`,
      materials,
      notes: null,
      timeline: null,
      flashcards: [],
      quizzes: [],
      focusAreas: focusAreas ? focusAreas.split(',').map(s => s.trim()) : [],
      selectedChapters: chapters ? chapters.split(',').map(s => s.trim()) : [],
      studyDepth,
      totalTimeMinutes: 0,
      createdAt: new Date().toISOString(),
      status: 'processing',
    };

    // Save to database
    await sessionService.createSession(session);

    const responseBody = JSON.stringify({
      sessionId,
      materialCount: materials.length,
      totalWords: materials.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0),
    });

    return new Response(responseBody, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Upload failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
