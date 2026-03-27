// ============================================
// AI Generator Functions
// ============================================

import { generateWithGemini, generateJSONWithGemini } from './gemini';
import { Flashcard, QuizQuestion, QuizAnswerEvaluation, TimeSuggestion, TimeBlock } from '@/types';
import crypto from 'crypto';

// --- Generate Structured Notes ---
export async function generateNotes(content: string, focusAreas?: string[], studyDepth?: string): Promise<string> {
  const focusPrompt = focusAreas && focusAreas.length > 0
    ? `Pay special attention to these focus areas: ${focusAreas.join(', ')}.`
    : '';

  let depthPrompt = '';
  if (studyDepth === '1hr') {
    depthPrompt = '- CRITICAL: Keep notes brief, high-level, and extremely concise so the student can study the entire thing in under 1 hour. ONLY cover the absolute necessities. Avoid deep examples.';
  } else if (studyDepth === 'detailed') {
    depthPrompt = '- CRITICAL: Produce an extremely comprehensive and lengthy deep-dive. Leave no concept unexplained. Include exhaustive examples and deep background intuition.';
  } else {
    depthPrompt = '- Cover material thoroughly based precisely on the depth of the source document.';
  }

  const prompt = `You are an expert study material architect. Transform the following study material into well-structured notes.

Requirements:
- Use Markdown formatting with proper headings (##, ###, ####)
${depthPrompt}
- Include clear explanations for complex concepts
- Add examples where they help understanding
- Use bullet points for lists and key takeaways
- Include "Key Takeaway" sections at the end of major topics
- No emojis
- Do not reference the module name, the author, the PowerPoint, or the source document in any way. Do not use phrases like "based on the module," "according to the presentation," or "as stated in the file." Focus exclusively on the lesson content itself.
${focusPrompt}

Study Material:
${content}

Generate the comprehensive study notes now:`;

  const systemInstruction = 'You are a world-class educator who creates thorough, structured study notes. Your notes are known for being comprehensive yet clear, covering every concept with proper depth. Never use emojis.';

  return generateWithGemini(prompt, systemInstruction);
}

// --- Generate Time Suggestion ---
export async function generateTimeSuggestion(content: string): Promise<TimeSuggestion> {
  const wordCount = content.split(/\s+/).length;

  const prompt = `Analyze the following study material and suggest optimal study times.

Material word count: ${wordCount}
Material preview: ${content.substring(0, 2000)}

Provide your response as a JSON object with these fields:
- recommended: number (minutes) - the ideal study time
- minimum: number (minutes) - the absolute minimum to cover the material
- comfortable: number (minutes) - a comfortable pace with breaks
- reason: string - brief explanation of your recommendation

Consider:
- Content density and complexity
- Need for practice/review time
- Break periods
- Quiz/flashcard time`;

  return generateJSONWithGemini<TimeSuggestion>(prompt);
}

// --- Generate Study Timeline ---
export async function generateTimeline(
  content: string,
  totalMinutes: number,
  sections: { title: string; content: string }[]
): Promise<TimeBlock[]> {
  const prompt = `Create a study timeline for ${totalMinutes} minutes total.

Study material sections:
${sections.map((s, i) => `${i + 1}. ${s.title} (${s.content.split(/\s+/).length} words)`).join('\n')}

Create a structured timeline as a JSON array. Each block should have:
- type: "study" | "break" | "quiz" | "flashcard"
- title: string (descriptive title)
- durationMinutes: number
- order: number (sequential)
- sectionId: string (optional, reference to section title)

Rules:
- Include breaks (5-10 min) between study blocks
- Add quiz slots after every 2-3 study blocks
- Include flashcard review slots
- Harder/longer topics get more time
- Total must equal ${totalMinutes} minutes
- Start with study, end with a comprehensive quiz`;

  const blocks = await generateJSONWithGemini<Omit<TimeBlock, 'id' | 'completed'>[]>(prompt);
  return blocks.map(block => ({
    ...block,
    id: crypto.randomUUID(),
    completed: false,
  }));
}

// --- Generate Flashcards ---
export async function generateFlashcards(content: string, sessionId: string): Promise<Flashcard[]> {
  const prompt = `Create comprehensive flashcards from the following study material.

Requirements:
- Generate at least 15-20 flashcards
- Cover all key concepts, definitions, and important facts
- Mix difficulty levels (easy, medium, hard)
- Front: clear, specific question
- Back: concise but complete answer
- No emojis
- Do not mention module names, document titles, slide decks, or author names

Respond as a JSON array where each item has:
- front: string (the question)
- back: string (the answer)
- difficulty: "easy" | "medium" | "hard"

Study Material:
${content}`;

  const cards = await generateJSONWithGemini<{ front: string; back: string; difficulty: 'easy' | 'medium' | 'hard' }[]>(prompt);
  return cards.map((card, index) => ({
    id: crypto.randomUUID(),
    sessionId,
    front: card.front,
    back: card.back,
    difficulty: card.difficulty,
    order: index,
  }));
}

// --- Generate Quiz ---
export async function generateQuiz(
  content: string,
  difficulty: 'easy' | 'medium' | 'hard',
  questionTypes: string[],
  count: number = 10
): Promise<QuizQuestion[]> {
  const typesStr = questionTypes.join(', ');

  const prompt = `Create a ${difficulty} difficulty quiz from the following study material.

Requirements:
- Generate exactly ${count} questions
- Question types to include: ${typesStr}
- Each question must test genuine understanding
- Include plausible wrong answers for MCQ
- No emojis
- Do not reference the module name, the author, the PowerPoint, or the source document in any way. Do not use phrases like "based on the module," "according to the presentation," or "as stated in the file." Focus exclusively on the lesson content itself.

Respond as a JSON array. Each question object must have:
- type: "mcq" | "true_false" | "fill_blank" | "matching" | "short_answer"
- question: string
- options: string[] (for MCQ, 4 options; for true_false: ["True", "False"])
- correctAnswer: string
- matchingPairs: [{left: string, right: string}] (only for matching type)
- explanation: string (brief explanation of the correct answer)

Study Material:
${content}`;

  const questions = await generateJSONWithGemini<QuizQuestion[]>(prompt);
  return questions.map(q => ({
    ...q,
    id: crypto.randomUUID(),
  }));
}

export async function evaluateQuizAnswersWithAI(
  questions: QuizQuestion[],
  answers: Record<string, string>
): Promise<QuizAnswerEvaluation[]> {
  const prompt = `Evaluate the student's quiz answers.

Return a JSON array with one item per question. Each item must contain:
- questionId: string
- isCorrect: boolean
- score: number between 0 and 1
- userAnswer: string
- correctAnswer: string
- rationale: string

Rules:
- Mark answers correct when they are semantically equivalent, even if wording differs.
- For fill-in-the-blank and short-answer questions, accept close paraphrases and minor spelling issues when the meaning is right.
- For matching questions, compare each left-right pair and score proportionally.
- Be strict about factual correctness, but generous about wording.
- Keep each rationale to one short sentence.
- Do not reference the module name, the author, the PowerPoint, or the source document in any way. Do not use phrases like "based on the module," "according to the presentation," or "as stated in the file." Focus exclusively on the lesson content itself.

Questions and answers:
${JSON.stringify(questions.map((question) => ({
  id: question.id,
  type: question.type,
  question: question.question,
  correctAnswer: question.correctAnswer,
  matchingPairs: question.matchingPairs,
  userAnswer: answers[question.id] || '',
})), null, 2)}`;

  return generateJSONWithGemini<QuizAnswerEvaluation[]>(
    prompt,
    'You are a careful exam grader who accepts equivalent answers when the meaning is correct.'
  );
}

// --- Explain More ---
export async function explainMore(text: string, context: string, depth: number = 1): Promise<string> {
  const depthMap: Record<number, string> = {
    1: 'Provide a clear, expanded explanation',
    2: 'Provide a very detailed, in-depth explanation with examples',
    3: 'Provide the most thorough explanation possible, as if teaching someone with no background',
  };

  const prompt = `${depthMap[depth] || depthMap[1]} of the following concept.

Selected text: "${text}"

Context from the study material: "${context.substring(0, 1000)}"

Requirements:
- Be thorough but critically concise
- STRICT LIMIT: Maximum 1 or 2 small paragraphs total. Do not output essays.
- Use examples to illustrate if possible within the size limit
- No emojis
- Do NOT use markdown headings, just flowing text with occasional bold for key terms
- Do not reference the module name, the author, the PowerPoint, or the source document in any way. Do not use phrases like "based on the module," "according to the presentation," or "as stated in the file." Focus exclusively on the lesson content itself.`;

  return generateWithGemini(prompt, 'You are a patient, thorough tutor who excels at breaking down complex topics.');
}

// --- Ask AI (Contextual Chat) ---
export async function askAI(question: string, studyContext: string, chatHistory: { role: string; content: string }[]): Promise<string> {
  const historyStr = chatHistory
    .slice(-6)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = `You are a study assistant helping a student understand their material.

Study material context (excerpt): "${studyContext.substring(0, 2000)}"

Previous conversation:
${historyStr}

Student's question: "${question}"

Provide a helpful, clear answer. No emojis. Be thorough but focused on the question asked. 
Do not reference the module name, the author, the PowerPoint, or the source document in any way. Do not use phrases like "based on the module," "according to the presentation," or "as stated in the file." Focus exclusively on the lesson content itself.`;

  return generateWithGemini(prompt, 'You are a knowledgeable, patient study assistant. You provide clear, accurate answers focused on helping students understand their material. Never use emojis.');
}
