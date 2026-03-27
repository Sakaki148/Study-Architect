// ============================================
// AI Study Architect - Core Type Definitions
// ============================================

// --- Study Material ---
export interface StudyMaterial {
  id: string;
  fileName: string;
  fileType: string;
  content: string;
  createdAt: string;
  sessionId: string;
}

// --- Study Session ---
export interface StudySession {
  id: string;
  userId?: string;
  title: string;
  materials: StudyMaterial[];
  notes: GeneratedNotes | null;
  timeline: StudyTimeline | null;
  flashcards: Flashcard[];
  quizzes: Quiz[];
  focusAreas: string[];
  selectedChapters: string[];
  studyDepth?: '1hr' | 'standard' | 'detailed';
  totalTimeMinutes: number;
  createdAt: string;
  status: 'uploading' | 'processing' | 'ready' | 'studying' | 'completed';
  finalExam?: Quiz | null;
  finalExamFocusAreas?: string[] | null;
}

// --- AI Generated Notes ---
export interface GeneratedNotes {
  id: string;
  sessionId: string;
  content: string; // Markdown content
  sections: NoteSection[];
  createdAt: string;
}

export interface NoteSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

// --- Study Timeline ---
export interface StudyTimeline {
  id: string;
  sessionId: string;
  totalMinutes: number;
  blocks: TimeBlock[];
}

export interface TimeBlock {
  id: string;
  type: 'study' | 'break' | 'quiz' | 'flashcard';
  title: string;
  durationMinutes: number;
  order: number;
  sectionId?: string;
  completed: boolean;
}

// --- Flashcards ---
export interface Flashcard {
  id: string;
  sessionId: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
}

// --- Quiz ---
export interface Quiz {
  id: string;
  sessionId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  score?: number;
  completedAt?: string;
}

export type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'matching' | 'short_answer';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  matchingPairs?: { left: string; right: string }[];
  userAnswer?: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface QuizAnswerEvaluation {
  questionId: string;
  isCorrect: boolean;
  score: number;
  userAnswer: string;
  correctAnswer: string;
  rationale: string;
}

// --- AI Chat ---
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// --- Processing Steps ---
export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

// --- Upload File ---
export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
}

// --- AI Explain Response ---
export interface ExplainResponse {
  explanation: string;
  canGoDeeper: boolean;
}

// --- Time Suggestion ---
export interface TimeSuggestion {
  recommended: number;
  minimum: number;
  comfortable: number;
  reason: string;
}
