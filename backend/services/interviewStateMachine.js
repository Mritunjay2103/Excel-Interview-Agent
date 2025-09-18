const { StateGraph, END } = require('@langchain/langgraph');
const { ChatOpenAI } = require('@langchain/openai');
const config = require('../config');
const llmService = require('./llmService');
const questionBankService = require('./questionBankService');
const evaluationService = require('./evaluationService');
const memoryService = require('./memoryService');
const adaptiveAgent = require('./adaptiveAgent');
const reportGeneratorService = require('./reportGeneratorService');
const { 
  createInitialState, 
  updateProgress, 
  canTransitionTo,
  InterviewStateSchema 
} = require('../types/interviewState');

class InterviewStateMachine {
  constructor() {
    this.llm = null;
    this.stateGraph = null;
    this.initializeLLM();
    this.buildStateMachine();
  }

  initializeLLM() {
    if (!config.openaiApiKey) {
      console.warn('OpenAI API key not configured. Interview state machine will not be available.');
      return;
    }

    try {
      this.llm = new ChatOpenAI({
        apiKey: config.openaiApiKey,
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
      });
      console.log('✅ Interview State Machine LLM initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Interview State Machine LLM:', error.message);
    }
  }

  buildStateMachine() {
    if (!this.llm) return;

    // Define the state machine nodes
    const nodes = {
      intro: this.introNode.bind(this),
      askQuestions: this.askQuestionsNode.bind(this),
      collectAnswers: this.collectAnswersNode.bind(this),
      evaluate: this.evaluateNode.bind(this),
      summary: this.summaryNode.bind(this),
      error: this.errorNode.bind(this),
    };

    // Define the state machine edges
    const edges = [
      ['intro', 'askQuestions'],
      ['askQuestions', 'collectAnswers'],
      ['collectAnswers', 'evaluate'],
      ['evaluate', 'askQuestions'],
      ['evaluate', 'summary'],
      ['summary', END],
      ['error', 'intro'],
      // Add edges to make error node reachable
      ['askQuestions', 'error'],
      ['collectAnswers', 'error'],
      ['evaluate', 'error'],
      ['summary', 'error'],
    ];

    // Create the state graph
    this.stateGraph = new StateGraph({
      channels: InterviewStateSchema.shape
    });

    // Add nodes
    Object.entries(nodes).forEach(([name, node]) => {
      this.stateGraph.addNode(name, node);
    });

    // Add edges
    edges.forEach(([from, to]) => {
      this.stateGraph.addEdge(from, to);
    });

    // Set entry point
    this.stateGraph.setEntryPoint('intro');

    // Compile the graph
    this.app = this.stateGraph.compile();
    console.log('✅ Interview State Machine built successfully');
  }

  // Node implementations
  async introNode(state) {
    console.log('🎯 Intro Node - Starting interview');
    
    try {
      const { session } = state;
      const welcomeMessage = `Welcome to the Excel Interview! 

I'm your AI interviewer, and I'll be asking you ${session.totalQuestions} questions about ${session.topic} at ${session.difficulty} level.

Let's begin! Are you ready to start?`;

      const updatedState = {
        ...state,
        currentState: 'intro',
        ui: {
          ...state.ui,
          currentMessage: welcomeMessage,
          isWaitingForAnswer: true,
        },
        metadata: {
          ...state.metadata,
          llmCalls: state.metadata.llmCalls + 1,
          lastActivity: Date.now(),
        },
      };

      return updateProgress(updatedState);
    } catch (error) {
      console.error('Error in intro node:', error);
      return this.errorNode(state, error.message);
    }
  }

  async askQuestionsNode(state) {
    console.log('❓ Ask Questions Node - Generating adaptive questions');
    
    try {
      const { session, currentQuestionIndex, questions } = state;
      
      // If we already have questions and haven't asked them all, continue
      if (questions.length > 0 && currentQuestionIndex < questions.length) {
        const currentQuestion = questions[currentQuestionIndex];
        const questionMessage = `Question ${currentQuestionIndex + 1} of ${session.totalQuestions}:

${currentQuestion.question}

Please provide your answer:`;

        return {
          ...state,
          currentState: 'asking_questions',
          ui: {
            ...state.ui,
            currentMessage: questionMessage,
            isWaitingForAnswer: true,
          },
          metadata: {
            ...state.metadata,
            lastActivity: Date.now(),
          },
        };
      }

      // Use adaptive agent to select next question
      if (questions.length < session.totalQuestions) {
        const adaptiveResult = await this.getAdaptiveQuestion(state, questions.length);
        
        if (!adaptiveResult.success) {
          throw new Error(`Failed to get adaptive question: ${adaptiveResult.error}`);
        }

        const { nextQuestion, reasoning, userProfile, nextDifficulty, adaptationLevel } = adaptiveResult;
        
        const newQuestion = {
          id: `q_${questions.length + 1}`,
          question: nextQuestion.question,
          difficulty: nextQuestion.difficulty,
          category: nextQuestion.category,
          expectedAnswer: nextQuestion.expectedAnswer,
          keyPoints: nextQuestion.keyPoints,
          example: nextQuestion.example,
          timeLimit: nextQuestion.timeLimit,
          adaptiveReasoning: reasoning,
          adaptationLevel: adaptationLevel
        };

        const allQuestions = [...questions, newQuestion];
        const currentQuestion = allQuestions[currentQuestionIndex];

        const questionMessage = `Question ${currentQuestionIndex + 1} of ${session.totalQuestions}:

${currentQuestion.question}

Please provide your answer:`;

        return updateProgress({
          ...state,
          currentState: 'asking_questions',
          questions: allQuestions,
          ui: {
            ...state.ui,
            currentMessage: questionMessage,
            isWaitingForAnswer: true,
          },
          metadata: {
            ...state.metadata,
            llmCalls: state.metadata.llmCalls + 1,
            lastActivity: Date.now(),
            adaptiveReasoning: reasoning,
            adaptationLevel: adaptationLevel
          },
        });
      }

      // All questions asked, move to summary
      return {
        ...state,
        currentState: 'summary',
        ui: {
          ...state.ui,
          currentMessage: 'All questions have been asked. Moving to summary...',
          isWaitingForAnswer: false,
        },
      };
    } catch (error) {
      console.error('Error in ask questions node:', error);
      return this.errorNode(state, error.message);
    }
  }

  async collectAnswersNode(state) {
    console.log('📝 Collect Answers Node - Processing answer');
    
    try {
      const { currentQuestionIndex, questions, answers } = state;
      const currentQuestion = questions[currentQuestionIndex];
      
      // This node is typically called when we receive an answer
      // The actual answer collection happens in the API endpoint
      // This node just prepares the state for evaluation
      
      return {
        ...state,
        currentState: 'collecting_answers',
        ui: {
          ...state.ui,
          currentMessage: 'Thank you for your answer. Let me evaluate it...',
          isWaitingForAnswer: false,
        },
        metadata: {
          ...state.metadata,
          lastActivity: Date.now(),
        },
      };
    } catch (error) {
      console.error('Error in collect answers node:', error);
      return this.errorNode(state, error.message);
    }
  }

  async evaluateNode(state) {
    console.log('🔍 Evaluate Node - Evaluating answer');
    
    try {
      const { currentQuestionIndex, questions, answers, evaluations } = state;
      const currentQuestion = questions[currentQuestionIndex];
      const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);
      
      if (!currentAnswer) {
        throw new Error('No answer found for current question');
      }

      // Check if already evaluated
      const existingEvaluation = evaluations.find(e => e.questionId === currentQuestion.id);
      if (existingEvaluation) {
        // Move to next question or summary
        const nextQuestionIndex = currentQuestionIndex + 1;
        if (nextQuestionIndex < questions.length) {
          return {
            ...state,
            currentQuestionIndex: nextQuestionIndex,
            currentState: 'asking_questions',
            ui: {
              ...state.ui,
              currentMessage: 'Moving to next question...',
              isWaitingForAnswer: false,
            },
          };
        } else {
          return {
            ...state,
            currentState: 'summary',
            ui: {
              ...state.ui,
              currentMessage: 'All questions evaluated. Generating summary...',
              isWaitingForAnswer: false,
            },
          };
        }
      }

      // Evaluate the answer using enhanced evaluation service
      const evaluationResult = await evaluationService.evaluateAnswer(
        currentQuestion.question,
        currentAnswer.answer,
        {
          expectedAnswer: currentQuestion.expectedAnswer,
          keyPoints: currentQuestion.keyPoints,
          example: currentQuestion.example
        }
      );

      if (!evaluationResult.success) {
        throw new Error(`Failed to evaluate answer: ${evaluationResult.error}`);
      }

      const evaluation = {
        questionId: currentQuestion.id,
        score: evaluationResult.evaluation.overall.score,
        weightedScore: evaluationResult.evaluation.weightedScore,
        feedback: evaluationResult.evaluation.overall.feedback,
        strengths: evaluationResult.evaluation.overall.strengths,
        improvements: evaluationResult.evaluation.overall.improvements,
        isCorrect: evaluationResult.evaluation.overall.score >= 70,
        detailedAnalysis: evaluationResult.evaluation.detailedFeedback,
        correctness: evaluationResult.evaluation.correctness,
        depth: evaluationResult.evaluation.depth,
        clarity: evaluationResult.evaluation.clarity,
        timestamp: evaluationResult.evaluation.timestamp,
      };

      // Save evaluation to memory
      await memoryService.saveEvaluation(session.sessionId, currentQuestion.id, evaluation);

      // Generate adaptive feedback
      const adaptiveFeedback = await this.generateAdaptiveFeedback(state, evaluation);

      const newEvaluations = [...evaluations, evaluation];
      const nextQuestionIndex = currentQuestionIndex + 1;

      // Determine next state
      let nextState = 'asking_questions';
      let nextMessage = adaptiveFeedback || 'Great! Moving to the next question...';

      if (nextQuestionIndex >= questions.length) {
        nextState = 'summary';
        nextMessage = 'All questions completed! Generating your summary...';
      }

      return updateProgress({
        ...state,
        currentState: nextState,
        currentQuestionIndex: nextQuestionIndex,
        evaluations: newEvaluations,
        ui: {
          ...state.ui,
          currentMessage: nextMessage,
          isWaitingForAnswer: false,
        },
        metadata: {
          ...state.metadata,
          llmCalls: state.metadata.llmCalls + 1,
          lastActivity: Date.now(),
        },
      });
    } catch (error) {
      console.error('Error in evaluate node:', error);
      return this.errorNode(state, error.message);
    }
  }

  async summaryNode(state) {
    console.log('📊 Summary Node - Generating final summary');
    
    try {
      const { session, questions, answers, evaluations, progress } = state;
      
      // Generate comprehensive summary
      const summaryPrompt = `Generate a comprehensive interview summary for an Excel interview:

Session Details:
- Topic: ${session.topic}
- Difficulty: ${session.difficulty}
- Total Questions: ${session.totalQuestions}
- Questions Answered: ${progress.questionsAnswered}
- Average Score: ${progress.averageScore.toFixed(1)}%

Questions and Evaluations:
${evaluations.map((evaluation, index) => `
Question ${index + 1}: ${questions.find(q => q.id === evaluation.questionId)?.question}
Score: ${evaluation.score}/100
Feedback: ${evaluation.feedback}
`).join('\n')}

Please provide:
1. Overall performance assessment
2. Key strengths demonstrated
3. Areas for improvement
4. Recommended next steps
5. Final score and recommendation

Format as a professional interview summary.`;

      const summaryResult = await llmService.generateResponse(summaryPrompt);
      
      if (!summaryResult.success) {
        throw new Error(`Failed to generate summary: ${summaryResult.error}`);
      }

      const finalSummary = `# Interview Summary

**Candidate:** ${session.candidateName || 'Anonymous'}
**Topic:** ${session.topic}
**Difficulty:** ${session.difficulty}
**Date:** ${new Date(session.createdAt).toLocaleDateString()}

## Performance Overview
- **Total Questions:** ${session.totalQuestions}
- **Questions Answered:** ${progress.questionsAnswered}
- **Average Score:** ${progress.averageScore.toFixed(1)}/100
- **Overall Grade:** ${this.getGrade(progress.averageScore)}

## Detailed Analysis
${summaryResult.content}

## Recommendations
Based on this interview, focus on the areas mentioned above to improve your Excel skills.`;

      const finalState = {
        ...state,
        currentState: 'completed',
        ui: {
          ...state.ui,
          currentMessage: finalSummary,
          isWaitingForAnswer: false,
          showSummary: true,
        },
        metadata: {
          ...state.metadata,
          endTime: Date.now(),
          totalDuration: Date.now() - state.metadata.startTime,
          llmCalls: state.metadata.llmCalls + 1,
          lastActivity: Date.now(),
        },
      };

      // Save final state to memory
      await memoryService.saveInterviewSession(session.sessionId, finalState);
      await memoryService.saveInterviewSummary(session.sessionId, finalSummary);

      // Generate performance report
      try {
        const reportResult = await reportGeneratorService.generatePerformanceReport(session.sessionId, finalState);
        if (reportResult.success) {
          console.log(`✅ Performance report generated for session ${session.sessionId}`);
          // Add report info to final state
          finalState.reportGenerated = true;
          finalState.reportId = session.sessionId;
        } else {
          console.warn(`⚠️ Failed to generate report for session ${session.sessionId}:`, reportResult.error);
        }
      } catch (error) {
        console.error(`❌ Error generating report for session ${session.sessionId}:`, error);
      }

      return finalState;
    } catch (error) {
      console.error('Error in summary node:', error);
      return this.errorNode(state, error.message);
    }
  }

  async errorNode(state, errorMessage) {
    console.error('❌ Error Node - Handling error:', errorMessage);
    
    return {
      ...state,
      currentState: 'error',
      ui: {
        ...state.ui,
        currentMessage: `An error occurred: ${errorMessage}. Please try again.`,
        isWaitingForAnswer: false,
        errorMessage: errorMessage,
      },
      metadata: {
        ...state.metadata,
        lastActivity: Date.now(),
      },
    };
  }

  // Helper methods
  getGrade(score) {
    if (score >= 90) return 'A (Excellent)';
    if (score >= 80) return 'B (Good)';
    if (score >= 70) return 'C (Satisfactory)';
    if (score >= 60) return 'D (Needs Improvement)';
    return 'F (Unsatisfactory)';
  }

  // Get adaptive question using the adaptive agent
  async getAdaptiveQuestion(state, questionNumber) {
    try {
      const { session, questions, evaluations } = state;
      
      // Get the last question and evaluation for context
      let lastQuestion = null;
      let lastEvaluation = null;
      
      if (questions.length > 0) {
        lastQuestion = questions[questions.length - 1];
        lastEvaluation = evaluations.find(e => e.questionId === lastQuestion.id);
      }

      // Use adaptive agent to analyze performance and select next question
      const adaptiveResult = await adaptiveAgent.analyzePerformanceAndSelectQuestion(
        session.sessionId,
        lastQuestion?.question || 'First question',
        'Previous answer', // This will be updated with actual answer
        lastEvaluation || {
          overall: { score: 0 },
          correctness: { score: 0 },
          depth: { score: 0 },
          clarity: { score: 0 }
        }
      );

      return {
        success: true,
        ...adaptiveResult
      };
    } catch (error) {
      console.error('Error getting adaptive question:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate adaptive feedback
  async generateAdaptiveFeedback(state, evaluation) {
    try {
      const { session } = state;
      
      // Get user profile from adaptive agent
      const insights = await adaptiveAgent.getSessionInsights(session.sessionId);
      
      // Generate adaptive feedback
      const feedback = await adaptiveAgent.generateAdaptiveFeedback(
        evaluation,
        insights.performance,
        'Adaptive feedback based on your performance'
      );

      return feedback;
    } catch (error) {
      console.error('Error generating adaptive feedback:', error);
      return null; // Fall back to default feedback
    }
  }

  // Public methods
  async startInterview(sessionData) {
    if (!this.app) {
      throw new Error('State machine not initialized. Check OpenAI API key.');
    }

    const initialState = createInitialState(sessionData);
    console.log('🚀 Starting new interview session:', initialState.session.sessionId);
    
    return initialState;
  }

  async processInterviewStep(state, action = null) {
    if (!this.app) {
      throw new Error('State machine not initialized. Check OpenAI API key.');
    }

    try {
      // Update state with any action data, ensuring no duplicate values
      let updatedState = { ...state };
      if (action) {
        // Only update specific fields, avoid spreading the entire action
        if (action.answers) {
          updatedState.answers = [...state.answers, ...action.answers];
        }
        if (action.evaluations) {
          updatedState.evaluations = [...state.evaluations, ...action.evaluations];
        }
        if (action.questions) {
          updatedState.questions = [...state.questions, ...action.questions];
        }
        if (action.currentQuestionIndex !== undefined) {
          updatedState.currentQuestionIndex = action.currentQuestionIndex;
        }
        if (action.currentState) {
          updatedState.currentState = action.currentState;
        }
        if (action.ui) {
          updatedState.ui = { ...state.ui, ...action.ui };
        }
        if (action.metadata) {
          updatedState.metadata = { ...state.metadata, ...action.metadata };
        }
        // Don't update session data as it should remain constant
      }

      // Process the current state
      const result = await this.app.invoke(updatedState);
      return result;
    } catch (error) {
      console.error('Error processing interview step:', error);
      return this.errorNode(state, error.message);
    }
  }

  async addAnswer(state, questionId, answer) {
    const newAnswer = {
      questionId,
      answer,
      timestamp: Date.now(),
    };

    const updatedState = {
      ...state,
      answers: [...state.answers, newAnswer],
      metadata: {
        ...state.metadata,
        lastActivity: Date.now(),
      },
    };

    return updateProgress(updatedState);
  }

  isAvailable() {
    return this.app !== null && this.llm !== null;
  }
}

module.exports = new InterviewStateMachine();
