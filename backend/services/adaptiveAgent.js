const { ChatOpenAI } = require('@langchain/openai');
const config = require('../config');
const questionBankService = require('./questionBankService');
const evaluationService = require('./evaluationService');
const InterviewMemory = require('./agenticMemoryService');

class AdaptiveAgent {
  constructor() {
    this.llm = null;
    this.memories = new Map(); // sessionId -> InterviewMemory
    this.initializeLLM();
  }

  initializeLLM() {
    if (!config.openaiApiKey) {
      console.warn('OpenAI API key not configured. Adaptive agent will not be available.');
      return;
    }

    try {
      this.llm = new ChatOpenAI({
        apiKey: config.openaiApiKey,
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
      });
      console.log('✅ Adaptive Agent LLM initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Adaptive Agent LLM:', error.message);
    }
  }

  // Get or create memory for session
  getMemory(sessionId) {
    if (!this.memories.has(sessionId)) {
      this.memories.set(sessionId, new InterviewMemory(sessionId));
    }
    return this.memories.get(sessionId);
  }

  // Analyze user performance and determine next question
  async analyzePerformanceAndSelectQuestion(sessionId, currentQuestion, userAnswer, evaluation) {
    const memory = this.getMemory(sessionId);
    
    // Update memory with current interaction
    await memory.saveContext(
      { question: currentQuestion, answer: userAnswer, evaluation },
      { response: 'Analyzing performance...' }
    );

    // Get user profile and context
    const userProfile = memory.getUserProfileSummary();
    const nextDifficulty = memory.getNextDifficulty();
    const recommendedCategory = memory.getRecommendedCategory();

    // Generate reasoning for question selection
    const reasoning = await this.generateSelectionReasoning(userProfile, evaluation, nextDifficulty, recommendedCategory);

    // Select next question based on analysis
    const nextQuestion = await this.selectNextQuestion(
      nextDifficulty,
      recommendedCategory,
      userProfile,
      reasoning
    );

    return {
      nextQuestion,
      reasoning,
      userProfile,
      nextDifficulty,
      recommendedCategory,
      adaptationLevel: memory.context.adaptationLevel
    };
  }

  // Generate reasoning for question selection
  async generateSelectionReasoning(userProfile, evaluation, nextDifficulty, recommendedCategory) {
    if (!this.llm) {
      return this.generateFallbackReasoning(userProfile, evaluation, nextDifficulty, recommendedCategory);
    }

    try {
      const prompt = `As an AI interview agent, analyze the user's performance and explain your reasoning for the next question selection.

USER PROFILE:
- Total Questions: ${userProfile.totalQuestions}
- Correct Answers: ${userProfile.correctAnswers}
- Accuracy: ${userProfile.accuracy}%
- Average Score: ${userProfile.averageScore}
- Current Difficulty: ${userProfile.currentDifficulty}
- Performance Trend: ${userProfile.performanceTrend}
- Strengths: ${userProfile.strengths.map(s => s.category).join(', ')}
- Weaknesses: ${userProfile.weaknesses.map(w => w.category).join(', ')}

LATEST EVALUATION:
- Score: ${evaluation.overall.score}/100
- Correctness: ${evaluation.correctness.score}/100
- Depth: ${evaluation.depth.score}/100
- Clarity: ${evaluation.clarity.score}/100

NEXT QUESTION STRATEGY:
- Recommended Difficulty: ${nextDifficulty}
- Recommended Category: ${recommendedCategory || 'Any'}

Provide a brief reasoning (2-3 sentences) explaining why you're selecting this difficulty and category for the next question.`;

      const response = await this.llm.invoke(prompt);
      return response.content;
    } catch (error) {
      console.error('Error generating reasoning:', error);
      return this.generateFallbackReasoning(userProfile, evaluation, nextDifficulty, recommendedCategory);
    }
  }

  // Fallback reasoning when LLM is not available
  generateFallbackReasoning(userProfile, evaluation, nextDifficulty, recommendedCategory) {
    const { averageScore, performanceTrend } = userProfile;
    const { score } = evaluation.overall;

    let reasoning = `Based on your performance (${score}/100), `;
    
    if (score >= 85) {
      reasoning += `you're excelling! I'm increasing the difficulty to ${nextDifficulty} to challenge you further.`;
    } else if (score >= 70) {
      reasoning += `you're doing well. I'm maintaining the ${nextDifficulty} difficulty level.`;
    } else {
      reasoning += `I'm adjusting to ${nextDifficulty} difficulty to better match your current level.`;
    }

    if (recommendedCategory) {
      reasoning += ` I'm focusing on ${recommendedCategory} to help strengthen your weak areas.`;
    }

    return reasoning;
  }

  // Select next question based on analysis
  async selectNextQuestion(difficulty, category, userProfile, reasoning) {
    try {
      // Get questions from question bank
      const questions = questionBankService.getRandomQuestions(1, category, difficulty);
      
      if (questions.length === 0) {
        // Fallback to any question of the difficulty level
        const fallbackQuestions = questionBankService.getRandomQuestions(1, null, difficulty);
        if (fallbackQuestions.length === 0) {
          throw new Error('No questions available for the selected criteria');
        }
        return fallbackQuestions[0];
      }

      return questions[0];
    } catch (error) {
      console.error('Error selecting next question:', error);
      // Ultimate fallback - get any intermediate question
      const fallbackQuestions = questionBankService.getRandomQuestions(1, null, 'intermediate');
      return fallbackQuestions[0] || null;
    }
  }

  // Generate adaptive feedback based on performance
  async generateAdaptiveFeedback(evaluation, userProfile, reasoning) {
    if (!this.llm) {
      return this.generateFallbackFeedback(evaluation, userProfile);
    }

    try {
      const prompt = `Generate personalized feedback for an Excel interview candidate based on their performance.

EVALUATION:
- Overall Score: ${evaluation.overall.score}/100
- Correctness: ${evaluation.correctness.score}/100
- Depth: ${evaluation.depth.score}/100
- Clarity: ${evaluation.clarity.score}/100
- Strengths: ${evaluation.overall.strengths.join(', ')}
- Improvements: ${evaluation.overall.improvements.join(', ')}

USER PROFILE:
- Total Questions: ${userProfile.totalQuestions}
- Accuracy: ${userProfile.accuracy}%
- Average Score: ${userProfile.averageScore}
- Performance Trend: ${userProfile.performanceTrend}
- Current Difficulty: ${userProfile.currentDifficulty}

REASONING FOR NEXT QUESTION:
${reasoning}

Generate encouraging, personalized feedback that:
1. Acknowledges their strengths
2. Provides constructive guidance on areas for improvement
3. Explains the reasoning for the next question selection
4. Motivates them to continue learning

Keep it concise (2-3 paragraphs) and encouraging.`;

      const response = await this.llm.invoke(prompt);
      return response.content;
    } catch (error) {
      console.error('Error generating adaptive feedback:', error);
      return this.generateFallbackFeedback(evaluation, userProfile);
    }
  }

  // Fallback feedback when LLM is not available
  generateFallbackFeedback(evaluation, userProfile) {
    const { score } = evaluation.overall;
    const { accuracy, performanceTrend } = userProfile;

    let feedback = `Great job on this question! You scored ${score}/100. `;
    
    if (score >= 85) {
      feedback += `Your performance is excellent! You demonstrate strong understanding of Excel concepts. `;
    } else if (score >= 70) {
      feedback += `You're doing well with a solid understanding of the material. `;
    } else {
      feedback += `There's room for improvement, but you're on the right track. `;
    }

    feedback += `Your overall accuracy is ${accuracy}% across ${userProfile.totalQuestions} questions. `;
    
    if (performanceTrend === 'improving') {
      feedback += `I can see you're getting better with each question! `;
    } else if (performanceTrend === 'declining') {
      feedback += `Let's focus on the fundamentals to build your confidence. `;
    }

    feedback += `Keep up the great work!`;

    return feedback;
  }

  // Get session insights
  async getSessionInsights(sessionId) {
    const memory = this.getMemory(sessionId);
    const userProfile = memory.getUserProfileSummary();
    
    // Generate insights about the session
    const insights = {
      performance: {
        totalQuestions: userProfile.totalQuestions,
        accuracy: userProfile.accuracy,
        averageScore: userProfile.averageScore,
        trend: userProfile.performanceTrend
      },
      strengths: userProfile.strengths,
      weaknesses: userProfile.weaknesses,
      difficultyProgression: memory.userProfile.difficultyProgression,
      recommendations: this.generateRecommendations(userProfile)
    };

    return insights;
  }

  // Generate recommendations based on performance
  generateRecommendations(userProfile) {
    const recommendations = [];

    if (userProfile.accuracy < 60) {
      recommendations.push({
        type: 'difficulty',
        message: 'Consider focusing on beginner-level questions to build foundational knowledge',
        priority: 'high'
      });
    }

    if (userProfile.weaknesses.length > 0) {
      const topWeakness = userProfile.weaknesses[0];
      recommendations.push({
        type: 'category',
        message: `Focus on ${topWeakness.category} to strengthen your weak areas`,
        priority: 'medium'
      });
    }

    if (userProfile.averageScore >= 85) {
      recommendations.push({
        type: 'challenge',
        message: 'You\'re ready for advanced Excel concepts and real-world scenarios',
        priority: 'low'
      });
    }

    return recommendations;
  }

  // Save memory to persistent storage
  async saveMemory(sessionId) {
    const memory = this.getMemory(sessionId);
    const memoryData = memory.toJSON();
    
    // Save to file system
    const fs = require('fs');
    const path = require('path');
    const memoryDir = path.join(__dirname, '../data/memory');
    
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    const filePath = path.join(memoryDir, `agent_memory_${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(memoryData, null, 2));
    
    return { success: true };
  }

  // Load memory from persistent storage
  async loadMemory(sessionId) {
    try {
      const fs = require('fs');
      const path = require('path');
      const memoryDir = path.join(__dirname, '../data/memory');
      const filePath = path.join(memoryDir, `agent_memory_${sessionId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Memory not found' };
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      const memoryData = JSON.parse(data);
      const memory = InterviewMemory.fromJSON(memoryData);
      
      this.memories.set(sessionId, memory);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Clear memory for session
  async clearMemory(sessionId) {
    const memory = this.getMemory(sessionId);
    await memory.clear();
    this.memories.delete(sessionId);
    return { success: true };
  }

  // Get all active sessions
  getActiveSessions() {
    return Array.from(this.memories.keys());
  }

  // Check if agent is available
  isAvailable() {
    return this.llm !== null;
  }
}

module.exports = new AdaptiveAgent();
