-- Optional: Seed data for testing
-- Run this after schema.sql is deployed

-- Insert sample profile
insert into public.profiles (id, username, full_name, bio)
values 
  ('00000000-0000-0000-0000-000000000001', 'testuser', 'Test User', 'Sample bio');

-- Insert sample study session
insert into public.study_sessions (id, user_id, title, description, total_time_seconds, files_count, is_active)
values 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Anthropology Session', 'Introduction to Anthropology study session', 4494, 2, true);

-- Insert sample note
insert into public.notes (id, user_id, session_id, title, content, subject, tags, is_public)
values 
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Introducing Anthropology', 'Anthropology is the systematic study of humankind...', 'Anthropology', '{anthropology, introduction, unit-one}', true);

-- Insert sample flashcard
insert into public.flashcards (id, user_id, note_id, question, answer, difficulty)
values 
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'What are the four fields of anthropology?', '1. Cultural Anthropology, 2. Biological (Physical) Anthropology, 3. Archaeology, 4. Linguistic Anthropology', 1);

-- Insert sample reading progress
insert into public.reading_progress (id, user_id, note_id, progress_percent, last_position)
values 
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 34, 1540);