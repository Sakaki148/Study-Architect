import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Since we store userId inside the JSONB 'data' column, we query it using PostgreSQL JSON operators
    const { data: rows, error } = await supabase
      .from('sessions')
      .select('data')
      .eq('data->>userId', userId)
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    const sessions = rows.map((row: any) => row.data);
    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
