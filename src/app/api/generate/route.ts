// ============================================
// API: Generate study content (notes, flashcards, timeline)
// Optimized: runs AI calls in parallel where possible
// ============================================

import { NextRequest } from 'next/server';
import * as sessionService from '@/lib/services/sessionService';
import { generateNotes, generateTimeSuggestion, generateFlashcards, generateTimeline } from '@/lib/ai';
import crypto from 'crypto';
import { GeneratedNotes, NoteSection } from '@/types';

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
    const { sessionId, totalTimeMinutes } = await request.json();

    if (!sessionId) {
      return jsonResponse({ error: 'Session ID required' }, 400);
    }

    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return jsonResponse({ error: 'Session not found' }, 404);
    }

    const allContent = session.materials.map(m => m.content).join('\n\n---\n\n');
    
    // We cap at ~80,000 chars for notes. This is enough for specific chapters without huge latency.
    const trimmedNotesContent = allContent.substring(0, 80000);
    
    // Time suggestion and flashcards don't need the whole massive document, parsing huge arrays causes processing to take >15 seconds.
    // Let's pass much smaller chunks for secondary tasks.
    const trimmedFlashcardContent = allContent.substring(0, 20000);
    const trimmedTimeContent = allContent.substring(0, 5000);

    const combinedFocus = [...(session.focusAreas || []), ...(session.selectedChapters || [])];

    // Re-parallelizing calls to meet the strict <15s requirement. 
    // Small inputs ensure we don't hit the concurrent TPM rate limit that causes 15s retries.
    // Sequential awaits to prevent the free tier 1-minute burst cooldown limit.
    const notesResult = await generateNotes(trimmedNotesContent, combinedFocus, session.studyDepth);
    const timeSuggestion = totalTimeMinutes ? null : await generateTimeSuggestion(trimmedTimeContent);
    const flashcards = await generateFlashcards(trimmedFlashcardContent, sessionId);

    // Parse notes into sections based on the generated chapters
    const sections: NoteSection[] = [];
    let globalOrder = 0;

    notesResult.chapters.forEach((chapter, chapterIdx) => {
      const lines = chapter.content.split('\n');
      let currentTitle = chapter.title;
      let currentContent: string[] = [];
      let currentLevel = 1;

      const slugify = (t: string) =>
        t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      for (const line of lines) {
        const h2 = line.match(/^## (.+)/);
        const h3 = line.match(/^### (.+)/);
        const heading = h2 || h3;
        if (heading) {
          if (currentContent.length > 0) {
            sections.push({
              id: crypto.randomUUID(),
              title: currentTitle,
              content: currentContent.join('\n'),
              order: globalOrder++,
              slug: slugify(currentTitle),
              level: currentLevel,
            });
          }
          currentTitle = heading[1];
          currentLevel = h2 ? 1 : 2;
          currentContent = [];
        } else {
          currentContent.push(line);
        }
      }
      if (currentContent.length > 0) {
        sections.push({
          id: crypto.randomUUID(),
          title: currentTitle,
          content: currentContent.join('\n'),
          order: globalOrder++,
          slug: slugify(currentTitle),
          level: currentLevel,
        });
      }
    });

    const notes: GeneratedNotes = {
      id: crypto.randomUUID(),
      sessionId,
      content: notesResult.fullContent,
      sections,
      subject: notesResult.subject,
      chapters: notesResult.chapters,
      createdAt: new Date().toISOString(),
    };
    await sessionService.saveNotes(notes);

    const timeMinutes = session.studyDepth === '1hr' ? 60 : (totalTimeMinutes || (timeSuggestion ? timeSuggestion.recommended : 30));

    // Generate timeline (needs sections from notes, so runs after)
    const timelineBlocks = await generateTimeline(
      trimmedNotesContent,
      timeMinutes,
      sections.map(s => ({ title: s.title, content: s.content.substring(0, 200) }))
    );
    const timeline = {
      id: crypto.randomUUID(),
      sessionId,
      totalMinutes: timeMinutes,
      blocks: timelineBlocks,
    };
    await sessionService.saveTimeline(timeline);
    await sessionService.saveFlashcards(flashcards);

    // Update session
    await sessionService.updateSession(sessionId, {
      notes,
      timeline,
      flashcards,
      totalTimeMinutes: timeMinutes,
      status: 'ready',
    });

    return jsonResponse({
      sessionId,
      notes,
      timeline,
      flashcards,
      timeSuggestion,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      500
    );
  }
}
