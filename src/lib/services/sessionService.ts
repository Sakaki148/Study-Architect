// ============================================
// Session Service - Data Access Layer
// ============================================

import { StudySession, GeneratedNotes, Flashcard, Quiz, StudyTimeline } from '@/types';
import { findById, insertOne, updateOne, readCollection, findByField, deleteOne } from '@/lib/db';

const SESSIONS_COLLECTION = 'sessions';
const NOTES_COLLECTION = 'notes';
const FLASHCARDS_COLLECTION = 'flashcards';
const QUIZZES_COLLECTION = 'quizzes';
const TIMELINES_COLLECTION = 'timelines';

// --- Sessions ---
export async function createSession(session: StudySession): Promise<StudySession> {
  return await insertOne(SESSIONS_COLLECTION, session);
}

export async function getSession(id: string): Promise<StudySession | null> {
  return await findById(SESSIONS_COLLECTION, id);
}

export async function updateSession(id: string, updates: Partial<StudySession>): Promise<StudySession | null> {
  return await updateOne(SESSIONS_COLLECTION, id, updates);
}

export async function getAllSessions(): Promise<StudySession[]> {
  return await readCollection<StudySession>(SESSIONS_COLLECTION);
}

export async function deleteSession(id: string): Promise<boolean> {
  return await deleteOne(SESSIONS_COLLECTION, id);
}

// --- Notes ---
export async function saveNotes(notes: GeneratedNotes): Promise<GeneratedNotes> {
  return await insertOne(NOTES_COLLECTION, notes);
}

export async function getNotesBySession(sessionId: string): Promise<GeneratedNotes | null> {
  const items = await findByField<GeneratedNotes>(NOTES_COLLECTION, 'sessionId', sessionId);
  return items[0] || null;
}

export async function updateNotes(id: string, updates: Partial<GeneratedNotes>): Promise<GeneratedNotes | null> {
  return await updateOne(NOTES_COLLECTION, id, updates);
}

// --- Flashcards ---
export async function saveFlashcards(flashcards: Flashcard[]): Promise<Flashcard[]> {
  await Promise.all(flashcards.map(card => insertOne(FLASHCARDS_COLLECTION, card)));
  return flashcards;
}

export async function getFlashcardsBySession(sessionId: string): Promise<Flashcard[]> {
  return await findByField<Flashcard>(FLASHCARDS_COLLECTION, 'sessionId', sessionId);
}

// --- Quizzes ---
export async function saveQuiz(quiz: Quiz): Promise<Quiz> {
  return await insertOne(QUIZZES_COLLECTION, quiz);
}

export async function getQuizzesBySession(sessionId: string): Promise<Quiz[]> {
  return await findByField<Quiz>(QUIZZES_COLLECTION, 'sessionId', sessionId);
}

export async function updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | null> {
  return await updateOne(QUIZZES_COLLECTION, id, updates);
}

// --- Timeline ---
export async function saveTimeline(timeline: StudyTimeline): Promise<StudyTimeline> {
  return await insertOne(TIMELINES_COLLECTION, timeline);
}

export async function getTimelineBySession(sessionId: string): Promise<StudyTimeline | null> {
  const items = await findByField<StudyTimeline>(TIMELINES_COLLECTION, 'sessionId', sessionId);
  return items[0] || null;
}
