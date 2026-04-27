-- SQL Update for Notes Classification System
-- This script adds Subject and Chapter classification to the notes system.

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
-- Add foreign keys for subject and chapter
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL;

-- 4. Security Policies (RLS)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

-- Subjects: Only owner can manage, everyone (or owner) can view depending on preference.
CREATE POLICY "Subjects are viewable by owner" ON public.subjects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subjects" ON public.subjects
    FOR ALL USING (auth.uid() = user_id);

-- Chapters: Access tied to the subject's ownership
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
