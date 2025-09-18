// Interview State Schema for LangGraph
const { z } = require('zod');

// Question schema
const QuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.string(),
  expectedAnswer: z.string().optional(),
  timeLimit: z.number().optional(), // in seconds
});

// Answer schema
const AnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
  timestamp: z.number(),
  timeSpent: z.number().optional(), // in seconds
});

// Evaluation schema
const EvaluationSchema = z.object({
  questionId: z.string(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  isCorrect: z.boolean(),
  detailedAnalysis: z.string().optional(),
});

// Interview session schema
const InterviewSessionSchema = z.object({
  sessionId: z.string(),
  candidateName: z.string().optional(),
  topic: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  totalQuestions: z.number(),
  timeLimit: z.number().optional(), // total time in minutes
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Main interview state schema
const InterviewStateSchema = z.object({
  // Session info
  session: InterviewSessionSchema,
  
  // Current state
  currentState: z.enum([
    'idle',
    'intro',
    'asking_questions',
    'collecting_answers',
    'evaluating',
    'summary',
    'completed',
    'error'
  ]),
  
  // Interview flow
  currentQuestionIndex: z.number().min(0).default(0),
  questions: z.array(QuestionSchema).default([]),
  answers: z.array(AnswerSchema).default([]),
  evaluations: z.array(EvaluationSchema).default([]),
  
  // Progress tracking
  progress: z.object({
    questionsAsked: z.number().default(0),
    questionsAnswered: z.number().default(0),
    questionsEvaluated: z.number().default(0),
    totalScore: z.number().default(0),
    averageScore: z.number().default(0),
  }),
  
  // UI state
  ui: z.object({
    currentMessage: z.string().default(''),
    isWaitingForAnswer: z.boolean().default(false),
    showSummary: z.boolean().default(false),
    errorMessage: z.string().optional(),
  }),
  
  // Metadata
  metadata: z.object({
    startTime: z.number().optional(),
    endTime: z.number().optional(),
    totalDuration: z.number().optional(), // in seconds
    llmCalls: z.number().default(0),
    lastActivity: z.number().default(Date.now()),
  }),
});

// State transitions
const StateTransitions = {
  idle: ['intro'],
  intro: ['asking_questions', 'error'],
  asking_questions: ['collecting_answers', 'evaluating', 'error'],
  collecting_answers: ['asking_questions', 'evaluating', 'error'],
  evaluating: ['asking_questions', 'summary', 'error'],
  summary: ['completed', 'error'],
  completed: [],
  error: ['idle', 'intro']
};

// Helper functions
const createInitialState = (sessionData) => {
  const now = Date.now();
  return {
    session: {
      sessionId: sessionData.sessionId || `interview_${now}`,
      candidateName: sessionData.candidateName,
      topic: sessionData.topic || 'Excel',
      difficulty: sessionData.difficulty || 'intermediate',
      totalQuestions: sessionData.totalQuestions || 5,
      timeLimit: sessionData.timeLimit,
      createdAt: now,
      updatedAt: now,
    },
    currentState: 'idle',
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    evaluations: [],
    progress: {
      questionsAsked: 0,
      questionsAnswered: 0,
      questionsEvaluated: 0,
      totalScore: 0,
      averageScore: 0,
    },
    ui: {
      currentMessage: '',
      isWaitingForAnswer: false,
      showSummary: false,
    },
    metadata: {
      startTime: now,
      llmCalls: 0,
      lastActivity: now,
    },
  };
};

const updateProgress = (state) => {
  const { answers, evaluations, questions } = state;
  const totalScore = evaluations.reduce((sum, eval) => sum + eval.score, 0);
  const averageScore = evaluations.length > 0 ? totalScore / evaluations.length : 0;
  
  return {
    ...state,
    progress: {
      questionsAsked: state.currentQuestionIndex,
      questionsAnswered: answers.length,
      questionsEvaluated: evaluations.length,
      totalScore,
      averageScore,
    },
  };
};

const canTransitionTo = (currentState, targetState) => {
  return StateTransitions[currentState]?.includes(targetState) || false;
};

module.exports = {
  InterviewStateSchema,
  QuestionSchema,
  AnswerSchema,
  EvaluationSchema,
  InterviewSessionSchema,
  StateTransitions,
  createInitialState,
  updateProgress,
  canTransitionTo,
};
