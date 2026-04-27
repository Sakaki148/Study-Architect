import { QuizQuestion } from '@/types';

export interface AnswerEvaluation {
  questionId: string;
  isCorrect: boolean;
  score: number;
  userAnswer: string;
  normalizedUserAnswer: string;
  correctAnswer: string;
  rationale: string;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length, 1);
}

export function stringifyMatchingAnswer(answer: Record<string, string> | undefined): string {
  if (!answer) return '';
  return Object.entries(answer)
    .sort(([leftA], [leftB]) => leftA.localeCompare(leftB))
    .map(([left, right]) => `${left} -> ${right}`)
    .join('; ');
}

export function parseMatchingAnswer(answer: string | undefined): Record<string, string> {
  if (!answer) return {};
  try {
    const parsed = JSON.parse(answer) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function gradeMatching(question: QuizQuestion, answer: string | undefined): AnswerEvaluation {
  const userMap = parseMatchingAnswer(answer);
  const expectedPairs = question.matchingPairs ?? [];
  const correctCount = expectedPairs.filter((pair) => {
    const normalizedUser = normalizeText(userMap[pair.left] || '');
    return normalizedUser === normalizeText(pair.right);
  }).length;
  const score = expectedPairs.length ? correctCount / expectedPairs.length : 0;

  return {
    questionId: question.id,
    isCorrect: score === 1,
    score,
    userAnswer: stringifyMatchingAnswer(userMap),
    normalizedUserAnswer: stringifyMatchingAnswer(userMap).toLowerCase(),
    correctAnswer: stringifyMatchingAnswer(
      Object.fromEntries(expectedPairs.map((pair) => [pair.left, pair.right]))
    ),
    rationale: score === 1 ? 'All matches were correct.' : `${correctCount} of ${expectedPairs.length} matches were correct.`,
  };
}

export function gradeQuestionLocally(question: QuizQuestion, answer: string | undefined): AnswerEvaluation {
  if (question.type === 'matching') {
    return gradeMatching(question, answer);
  }

  const userAnswer = answer?.trim() || '';
  const normalizedUser = normalizeText(userAnswer);
  const normalizedCorrect = normalizeText(question.correctAnswer || '');

  if (!normalizedUser) {
    return {
      questionId: question.id,
      isCorrect: false,
      score: 0,
      userAnswer: '',
      normalizedUserAnswer: '',
      correctAnswer: question.correctAnswer,
      rationale: 'No answer was provided.',
    };
  }

  const exact = normalizedUser === normalizedCorrect;
  const containsCore =
    normalizedCorrect.length > 5 &&
    (normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser));
  const fuzzyScore = similarity(normalizedUser, normalizedCorrect);
  const closeEnough =
    question.type === 'short_answer'
      ? fuzzyScore >= 0.72 || containsCore
      : fuzzyScore >= 0.84 || containsCore;

  const score = exact ? 1 : closeEnough ? Math.max(fuzzyScore, 0.85) : fuzzyScore;

  return {
    questionId: question.id,
    isCorrect: exact || closeEnough,
    score,
    userAnswer,
    normalizedUserAnswer: normalizedUser,
    correctAnswer: question.correctAnswer,
    rationale: exact
      ? 'Exact match.'
      : closeEnough
        ? 'Accepted because the response is meaningfully equivalent to the expected answer.'
        : 'The response does not match the expected answer closely enough.',
  };
}
