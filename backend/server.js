const express = require('express');
const cors = require('cors');
const config = require('./config');
const llmService = require('./services/llmService');
const interviewStateMachine = require('./services/interviewStateMachine');
const questionBankService = require('./services/questionBankService');
const evaluationService = require('./services/evaluationService');
const memoryService = require('./services/memoryService');
const adaptiveAgent = require('./services/adaptiveAgent');
const reportGeneratorService = require('./services/reportGeneratorService');

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Backend server is running!',
    llmAvailable: llmService.isAvailable(),
    interviewStateMachineAvailable: interviewStateMachine.isAvailable(),
    questionBankAvailable: questionBankService.isAvailable(),
    evaluationServiceAvailable: evaluationService.isAvailable(),
    memoryServiceAvailable: memoryService.isAvailable(),
    adaptiveAgentAvailable: adaptiveAgent.isAvailable(),
    reportGeneratorAvailable: reportGeneratorService.isAvailable()
  });
});

// LLM status endpoint
app.get('/api/llm/status', (req, res) => {
  res.json({
    available: llmService.isAvailable(),
    message: llmService.isAvailable() 
      ? 'LLM service is ready' 
      : 'LLM service not available - check OpenAI API key'
  });
});

// Generate Excel interview questions
app.post('/api/llm/generate-questions', async (req, res) => {
  try {
    const { topic, difficulty = 'intermediate', count = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }

    const result = await llmService.generateExcelInterviewQuestions(topic, difficulty, count);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Evaluate user answers
app.post('/api/llm/evaluate-answer', async (req, res) => {
  try {
    const { question, userAnswer } = req.body;

    if (!question || !userAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Both question and userAnswer are required'
      });
    }

    const result = await llmService.evaluateAnswer(question, userAnswer);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// General chat endpoint
app.post('/api/llm/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const result = await llmService.generateResponse(message);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Interview State Machine Endpoints

// Start a new interview
app.post('/api/interview/start', async (req, res) => {
  try {
    const { candidateName, topic, difficulty, totalQuestions, timeLimit } = req.body;

    if (!interviewStateMachine.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Interview state machine not available. Check OpenAI API key.'
      });
    }

    const sessionData = {
      candidateName: candidateName || 'Anonymous',
      topic: topic || 'Excel',
      difficulty: difficulty || 'intermediate',
      totalQuestions: totalQuestions || 5,
      timeLimit: timeLimit || 30, // 30 minutes default
    };

    const initialState = await interviewStateMachine.startInterview(sessionData);
    const result = await interviewStateMachine.processInterviewStep(initialState);

    res.json({
      success: true,
      sessionId: result.session.sessionId,
      state: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current interview state
app.get('/api/interview/:sessionId/state', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({
        success: false,
        error: 'Interview state not provided'
      });
    }

    res.json({
      success: true,
      state: state
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Submit an answer
app.post('/api/interview/:sessionId/answer', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { state, answer } = req.body;

    if (!state || !answer) {
      return res.status(400).json({
        success: false,
        error: 'State and answer are required'
      });
    }

    const { currentQuestionIndex, questions } = state;
    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) {
      return res.status(400).json({
        success: false,
        error: 'No current question found'
      });
    }

    // Add the answer to the state
    const updatedState = await interviewStateMachine.addAnswer(
      state, 
      currentQuestion.id, 
      answer
    );

    // Process the interview step (move to evaluation)
    const result = await interviewStateMachine.processInterviewStep(updatedState);

    res.json({
      success: true,
      state: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Continue interview (next step)
app.post('/api/interview/:sessionId/continue', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({
        success: false,
        error: 'Interview state is required'
      });
    }

    const result = await interviewStateMachine.processInterviewStep(state);

    res.json({
      success: true,
      state: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get interview summary
app.get('/api/interview/:sessionId/summary', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({
        success: false,
        error: 'Interview state is required'
      });
    }

    if (state.currentState !== 'completed' && state.currentState !== 'summary') {
      return res.status(400).json({
        success: false,
        error: 'Interview not completed yet'
      });
    }

    res.json({
      success: true,
      summary: state.ui.currentMessage,
      results: {
        totalQuestions: state.session.totalQuestions,
        questionsAnswered: state.progress.questionsAnswered,
        averageScore: state.progress.averageScore,
        totalScore: state.progress.totalScore,
        evaluations: state.evaluations,
        duration: state.metadata.totalDuration,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Interview status endpoint
app.get('/api/interview/status', (req, res) => {
  res.json({
    available: interviewStateMachine.isAvailable(),
    message: interviewStateMachine.isAvailable() 
      ? 'Interview state machine is ready' 
      : 'Interview state machine not available - check OpenAI API key'
  });
});

// Question Bank Endpoints

// Get question bank statistics
app.get('/api/questions/stats', (req, res) => {
  try {
    const stats = questionBankService.getStatistics();
    if (!stats) {
      return res.status(503).json({
        success: false,
        error: 'Question bank not available'
      });
    }
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get question categories
app.get('/api/questions/categories', (req, res) => {
  try {
    const categories = questionBankService.getCategories();
    const difficulties = questionBankService.getDifficulties();
    
    res.json({
      success: true,
      categories,
      difficulties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get questions by criteria
app.get('/api/questions', (req, res) => {
  try {
    const { category, difficulty, count } = req.query;
    
    let questions;
    if (category && difficulty) {
      questions = questionBankService.getQuestionsByCategory(category, difficulty);
    } else if (category) {
      questions = questionBankService.getQuestionsByCategory(category);
    } else if (difficulty) {
      questions = questionBankService.getQuestionsByDifficulty(difficulty);
    } else {
      questions = questionBankService.getRandomQuestions(parseInt(count) || 10);
    }
    
    res.json({
      success: true,
      questions,
      count: questions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate interview questions
app.post('/api/questions/generate', (req, res) => {
  try {
    const { topic, difficulty, count } = req.body;
    
    const result = questionBankService.generateInterviewQuestions(
      topic || 'Excel',
      difficulty || 'intermediate',
      parseInt(count) || 5
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enhanced Evaluation Endpoints

// Evaluate answer with enhanced criteria
app.post('/api/evaluation/evaluate', async (req, res) => {
  try {
    const { question, answer, questionData } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        error: 'Question and answer are required'
      });
    }
    
    const result = await evaluationService.evaluateAnswer(question, answer, questionData);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Batch evaluation
app.post('/api/evaluation/batch', async (req, res) => {
  try {
    const { questionAnswerPairs } = req.body;
    
    if (!questionAnswerPairs || !Array.isArray(questionAnswerPairs)) {
      return res.status(400).json({
        success: false,
        error: 'questionAnswerPairs array is required'
      });
    }
    
    const result = await evaluationService.evaluateMultipleAnswers(questionAnswerPairs);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Memory/Persistence Endpoints

// Save interview session
app.post('/api/memory/save-session', async (req, res) => {
  try {
    const { sessionId, interviewState } = req.body;
    
    if (!sessionId || !interviewState) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and interviewState are required'
      });
    }
    
    const result = await memoryService.saveInterviewSession(sessionId, interviewState);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Load interview session
app.get('/api/memory/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await memoryService.loadInterviewSession(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all sessions
app.get('/api/memory/sessions', async (req, res) => {
  try {
    const result = await memoryService.getAllSessions();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Save evaluation
app.post('/api/memory/save-evaluation', async (req, res) => {
  try {
    const { sessionId, questionId, evaluation } = req.body;
    
    if (!sessionId || !questionId || !evaluation) {
      return res.status(400).json({
        success: false,
        error: 'sessionId, questionId, and evaluation are required'
      });
    }
    
    const result = await memoryService.saveEvaluation(sessionId, questionId, evaluation);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get session evaluations
app.get('/api/memory/session/:sessionId/evaluations', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await memoryService.getSessionEvaluations(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get memory statistics
app.get('/api/memory/stats', async (req, res) => {
  try {
    const result = await memoryService.getMemoryStats();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Adaptive Agent Endpoints

// Get session insights
app.get('/api/agent/session/:sessionId/insights', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const insights = await adaptiveAgent.getSessionInsights(sessionId);
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analyze performance and get next question
app.post('/api/agent/analyze-performance', async (req, res) => {
  try {
    const { sessionId, currentQuestion, userAnswer, evaluation } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    const result = await adaptiveAgent.analyzePerformanceAndSelectQuestion(
      sessionId,
      currentQuestion,
      userAnswer,
      evaluation
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate adaptive feedback
app.post('/api/agent/generate-feedback', async (req, res) => {
  try {
    const { sessionId, evaluation, userProfile, reasoning } = req.body;
    
    if (!sessionId || !evaluation) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and evaluation are required'
      });
    }

    const feedback = await adaptiveAgent.generateAdaptiveFeedback(
      evaluation,
      userProfile,
      reasoning
    );

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Save agent memory
app.post('/api/agent/save-memory', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    const result = await adaptiveAgent.saveMemory(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Load agent memory
app.get('/api/agent/load-memory/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await adaptiveAgent.loadMemory(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear agent memory
app.delete('/api/agent/clear-memory/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await adaptiveAgent.clearMemory(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active sessions
app.get('/api/agent/active-sessions', (req, res) => {
  try {
    const sessions = adaptiveAgent.getActiveSessions();
    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Agent status endpoint
app.get('/api/agent/status', (req, res) => {
  res.json({
    available: adaptiveAgent.isAvailable(),
    message: adaptiveAgent.isAvailable() 
      ? 'Adaptive agent is ready' 
      : 'Adaptive agent not available - check OpenAI API key'
  });
});

// Report Generation Endpoints

// Generate performance report
app.post('/api/reports/generate', async (req, res) => {
  try {
    const { sessionId, interviewState } = req.body;
    
    if (!sessionId || !interviewState) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and interviewState are required'
      });
    }

    const result = await reportGeneratorService.generatePerformanceReport(sessionId, interviewState);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get report and transcript
app.get('/api/reports/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await reportGeneratorService.loadReportAndTranscript(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all reports
app.get('/api/reports', async (req, res) => {
  try {
    const result = await reportGeneratorService.getAllReports();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get report summary (for listing)
app.get('/api/reports/:sessionId/summary', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await reportGeneratorService.loadReportAndTranscript(sessionId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    const { report, transcript } = result.data;
    const summary = {
      sessionId,
      candidateName: transcript.sessionInfo.candidateName,
      overallGrade: report.executiveSummary.overallGrade,
      totalScore: report.executiveSummary.totalScore,
      keyHighlights: report.executiveSummary.keyHighlights,
      generatedAt: result.data.generatedAt,
      duration: transcript.sessionInfo.duration,
      totalQuestions: transcript.summary.totalQuestions,
      accuracy: transcript.summary.accuracy
    };

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export report as PDF (placeholder)
app.get('/api/reports/:sessionId/export/pdf', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await reportGeneratorService.loadReportAndTranscript(sessionId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    // For now, return JSON. In production, you'd generate actual PDF
    res.json({
      success: true,
      message: 'PDF export not implemented yet. Use JSON format.',
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Report status endpoint
app.get('/api/reports/status', (req, res) => {
  res.json({
    available: reportGeneratorService.isAvailable(),
    message: 'Report generation service is ready'
  });
});

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  console.log(`LLM Service: ${llmService.isAvailable() ? '✅ Available' : '❌ Not Available'}`);
  console.log(`Interview State Machine: ${interviewStateMachine.isAvailable() ? '✅ Available' : '❌ Not Available'}`);
  console.log(`Question Bank: ${questionBankService.isAvailable() ? '✅ Available' : '❌ Not Available'}`);
  console.log(`Evaluation Service: ${evaluationService.isAvailable() ? '✅ Available' : '❌ Not Available'}`);
  console.log(`Memory Service: ${memoryService.isAvailable() ? '✅ Available' : '❌ Not Available'}`);
  console.log(`Adaptive Agent: ${adaptiveAgent.isAvailable() ? '✅ Available' : '❌ Not Available'}`);
  console.log(`Report Generator: ${reportGeneratorService.isAvailable() ? '✅ Available' : '❌ Not Available'}`);
});
