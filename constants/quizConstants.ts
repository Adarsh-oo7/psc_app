// constants/quizConstants.ts
export const QUIZ_CONSTANTS = {
  MIN_QUESTIONS: 5,
  MAX_QUESTIONS: 100,
  DEFAULT_QUESTIONS: 15,
  TIME_PER_QUESTION: 60, // seconds
  WARNING_TIME: 120, // 2 minutes
  CRITICAL_TIME: 60, // 1 minute
  HAPTIC_ENABLED: true,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
};

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  MIXED: 'mixed'
} as const;

// types/quiz.ts
export interface Question {
  id: string;
  text: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface QuizConfig {
  numQuestions: number;
  timePerQuestion: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  showExplanations: boolean;
  shuffleQuestions: boolean;
}

export interface UserAnswers {
  [questionId: string]: string;
}

export interface QuizResults {
  score: number;
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
}

export interface ResultData {
  results: QuizResults;
  questions: Question[];
  timeTaken: number;
  userAnswers: UserAnswers;
}

export interface QuizState {
  answers: UserAnswers;
  isFinished: boolean;
  isSubmitting: boolean;
  timeLeft: number;
  currentQuestionIndex: number;
  hasWarned: boolean;
}
