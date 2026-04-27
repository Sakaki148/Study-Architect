-- ============================================================================
-- SUPABASE DATABASE UPDATE: NOTES CLASSIFICATION SYSTEM (FIXED)
-- This script implements the relational structure for Subjects and Chapters
-- while accounting for the JSONB 'data' storage pattern used in this project.
-- ============================================================================

-- 1. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    chapter_number INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Update Notes Table
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;

-- 4. Security Policies (RLS)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid "already exists" error
DROP POLICY IF EXISTS "Subjects are viewable by owner" ON public.subjects;
DROP POLICY IF EXISTS "Users can manage their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Chapters are viewable if subject is viewable" ON public.chapters;
DROP POLICY IF EXISTS "Users can manage chapters of their own subjects" ON public.chapters;

CREATE POLICY "Subjects are viewable by owner" ON public.subjects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subjects" ON public.subjects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Chapters are viewable if subject is viewable" ON public.chapters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.subjects s 
            WHERE s.id = subject_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage chapters of their own subjects" ON public.chapters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.subjects s 
            WHERE s.id = subject_id AND s.user_id = auth.uid()
        )
    );

-- 5. DATA MIGRATION (JSONB to Relational)
DO $$
DECLARE
    note_record RECORD;
    new_subject_id UUID;
BEGIN
    FOR note_record IN 
        SELECT id, data->>'subject' as subject_name, (data->>'userId')::uuid as u_id 
        FROM public.notes 
        WHERE data->>'subject' IS NOT NULL 
    LOOP
        SELECT id INTO new_subject_id 
        FROM public.subjects 
        WHERE name = note_record.subject_name AND user_id = note_record.u_id;
        
        IF new_subject_id IS NULL THEN
            INSERT INTO public.subjects (name, user_id) 
            VALUES (note_record.subject_name, note_record.u_id) 
            RETURNING id INTO new_subject_id;
        END IF;
        
        UPDATE public.notes 
        SET subject_id = new_subject_id 
        WHERE id = note_record.id;
    END LOOP;
END $$;

-- 6. INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON public.chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON public.notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_chapter_id ON public.notes(chapter_id);
