-- Supabase schema for Study AI Notes platform
-- Generated 2026-04-24

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ========================================
-- Core Tables
-- ========================================

-- Users table (extends auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique,
    full_name text,
    avatar_url text,
    bio text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- ========================================
-- Security Policies
-- ========================================

-- Create policies for auth.users (handled by Supabase Auth)
-- No RLS needed for auth.users table - managed by Supabase

-- Profiles policies
create policy "Profiles are viewable by everyone"
    on public.profiles for select
    using (true);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Study sessions policies
create policy "Study sessions are viewable by owner"
    on public.study_sessions for select
    using (auth.uid() = user_id);

create policy "Users can create own study sessions"
    on public.study_sessions for insert
    with check (auth.uid() = user_id);

create policy "Users can update own study sessions"
    on public.study_sessions for update
    using (auth.uid() = user_id);

create policy "Users can delete own study sessions"
    on public.study_sessions for delete
    using (auth.uid() = user_id);

-- Notes policies
create policy "Public notes are viewable by everyone"
    on public.notes for select
    using (is_public = true);

create policy "Private notes are viewable by owner"
    on public.notes for select
    using (auth.uid() = user_id);

create policy "Users can create own notes"
    on public.notes for insert
    with check (auth.uid() = user_id);

create policy "Users can update own notes"
    on public.notes for update
    using (auth.uid() = user_id);

create policy "Users can delete own notes"
    on public.notes for delete
    using (auth.uid() = user_id);

-- Note sections policies
create policy "Note sections viewable with parent note"
    on public.note_sections for select
    using (exists (
        select 1 from public.notes n
        where n.id = note_id
        and (n.is_public = true or n.user_id = auth.uid())
    ));

create policy "Users can manage sections of own notes"
    on public.note_sections for all
    using (exists (
        select 1 from public.notes n
        where n.id = note_id and n.user_id = auth.uid()
    ));

-- Files policies
create policy "Files viewable by owner"
    on public.files for select
    using (auth.uid() = user_id);

create policy "Users can upload own files"
    on public.files for insert
    with check (auth.uid() = user_id);

create policy "Users can delete own files"
    on public.files for delete
    using (auth.uid() = user_id);

-- Session files policies
create policy "Session files viewable with session"
    on public.session_files for select
    using (exists (
        select 1 from public.study_sessions s
        where s.id = session_id
        and s.user_id = auth.uid()
    ));

-- Tags policies
create policy "Tags are viewable by everyone"
    on public.tags for select
    using (true);

create policy "Users can create tags"
    on public.tags for insert
    with check (true);

-- Note tags policies
create policy "Note tags viewable with note"
    on public.note_tags for select
    using (exists (
        select 1 from public.notes n
        where n.id = note_id
        and (n.is_public = true or n.user_id = auth.uid())
    ));

-- Timer logs policies
create policy "Timer logs viewable by owner"
    on public.timer_logs for select
    using (auth.uid() = user_id);

create policy "Users can create own timer logs"
    on public.timer_logs for insert
    with check (auth.uid() = user_id);

-- Reading progress policies
create policy "Reading progress viewable by owner"
    on public.reading_progress for select
    using (auth.uid() = user_id);

create policy "Users can update own reading progress"
    on public.reading_progress for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Flashcards policies
create policy "Flashcards viewable by owner"
    on public.flashcards for select
    using (auth.uid() = user_id);

create policy "Users can manage own flashcards"
    on public.flashcards for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Quiz results policies
create policy "Quiz results viewable by owner"
    on public.quiz_results for select
    using (auth.uid() = user_id);

create policy "Users can create own quiz results"
    on public.quiz_results for insert
    with check (auth.uid() = user_id);

-- Storage buckets policies
create policy "Buckets viewable by everyone"
    on public.storage_buckets for select
    using (true);

create policy "Buckets manageable by owner"
    on public.storage_buckets for all
    using (auth.uid() = owner)
    with check (auth.uid() = owner);

-- Storage objects policies
create policy "Objects viewable by everyone"
    on public.storage_objects for select
    using (true);

create policy "Objects manageable by owner"
    on public.storage_objects for all
    using (auth.uid() = owner)
    with check (auth.uid() = owner);

-- ========================================
-- Functions
-- ========================================

-- Update updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- ========================================
-- Triggers
-- ========================================

create trigger update_profiles_updated_at
    before update on public.profiles
    for each row
    execute function public.handle_updated_at();

create trigger update_study_sessions_updated_at
    before update on public.study_sessions
    for each row
    execute function public.handle_updated_at();

create trigger update_notes_updated_at
    before update on public.notes
    for each row
    execute function public.handle_updated_at();

create trigger update_flashcards_updated_at
    before update on public.flashcards
    for each row
    execute function public.handle_updated_at();

-- ========================================
-- Indexes
-- ========================================

create index idx_profiles_username on public.profiles(username);
create index idx_study_sessions_user_id on public.study_sessions(user_id);
create index idx_study_sessions_is_active on public.study_sessions(is_active);
create index idx_notes_user_id on public.notes(user_id);
create index idx_notes_session_id on public.notes(session_id);
create index idx_notes_tags on public.notes using gin(tags);
create index idx_note_sections_note_id on public.note_sections(note_id);
create index idx_note_sections_parent_id on public.note_sections(parent_section_id);
create index idx_files_user_id on public.files(user_id);
create index idx_files_session_id on public.files(session_id);
create index idx_timer_logs_user_id on public.timer_logs(user_id);
create index idx_timer_logs_session_id on public.timer_logs(session_id);
create index idx_reading_progress_user_id on public.reading_progress(user_id);
create index idx_reading_progress_note_id on public.reading_progress(note_id);
create index idx_flashcards_user_id on public.flashcards(user_id);
create index idx_flashcards_note_id on public.flashcards(note_id);
create index idx_quiz_results_user_id on public.quiz_results(user_id);
create index idx_quiz_results_session_id on public.quiz_results(session_id);
create index idx_quiz_results_note_id on public.quiz_results(note_id);
create index idx_storage_objects_bucket_path on public.storage_objects(bucketid, path_tokens);
