import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST() {
  try {
    // 1. Fetch all sessions that have notes
    const { data: sessionsRows, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, data');

    if (sessionsError) throw sessionsError;

    let updatedCount = 0;

    for (const row of sessionsRows) {
      const session = row.data;
      if (!session || !session.notes) continue;

      const notes = session.notes;
      if (notes.subject) continue; // Already classified

      const content = notes.content || '';
      
      // Extract Title (First # heading)
      const titleMatch = content.match(/^#\s+(.*)/m);
      const title = titleMatch ? titleMatch[1].replace('Comprehensive Study Notes: ', '').trim() : 'Untitled Note';

      // Extract Subject
      const subject = title;

      // Extract Chapters (Split by ## headings)
      const chapters = [];
      const chapterRegex = /^##\s+(.*)/gm;
      let match;
      let lastIndex = 0;
      let lastTitle = 'Introduction';

      while ((match = chapterRegex.exec(content)) !== null) {
        if (lastIndex < match.index) {
          chapters.push({
            title: lastTitle,
            content: content.substring(lastIndex, match.index).trim()
          });
        }
        lastTitle = match[1];
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < content.length) {
        chapters.push({
          title: lastTitle,
          content: content.substring(lastIndex).trim()
        });
      }

      // Update the session data
      const updatedNotes = {
        ...notes,
        title,
        subject,
        chapters: chapters.length > 0 ? chapters : [{ title: 'Main Content', content }]
      };

      const updatedSession = {
        ...session,
        notes: updatedNotes
      };

      const { error: updateError } = await supabase
        .from('sessions')
        .update({ data: updatedSession })
        .eq('id', row.id);

      if (updateError) {
        console.error(`Failed to update session ${row.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully classified ${updatedCount} sessions.` 
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
