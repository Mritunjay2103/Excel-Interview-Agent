const { BaseMemory } = require('@langchain/core/memory');
const { ChatMessageHistory } = require('@langchain/core/chat_history');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');

class InterviewMemory extends BaseMemory {
  constructor(sessionId) {
    super();
    this.sessionId = sessionId;
    this.chatHistory = new ChatMessageHistory();
    this.userProfile = {
      sessionId,
      performanceHistory: [],
      difficultyProgression: [],
      strengths: [],
      weaknesses: [],
      currentDifficulty: 'intermediate',
      totalQuestions: 0,
      correctAnswers: 0,
      averageScore: 0,
      lastUpdated: Date.now()
    };
    this.context = {
      currentTopic: 'Excel',
      questionCategories: [],
      recentAnswers: [],
      performanceTrend: 'stable',
      adaptationLevel: 0
    };
  }

  // Get memory variables
  get memoryKeys() {
    return ['chat_history', 'user_profile', 'context'];
  }

  // Load memory variables
  async loadMemoryVariables(inputs) {
    return {
      chat_history: this.chatHistory.messages,
      user_profile: this.userProfile,
      context: this.context
    };
  }

  // Save context to memory
  async saveContext(inputs, outputs) {
    const { question, answer, evaluation } = inputs;
    const { response, nextDifficulty, reasoning } = outputs;

    // Add to chat history
    if (question) {
      this.chatHistory.addMessage(new HumanMessage(question));
    }
    if (answer) {
      this.chatHistory.addMessage(new HumanMessage(answer));
    }
    if (response) {
      this.chatHistory.addMessage(new AIMessage(response));
    }

    // Update user profile
    if (evaluation) {
      this.updateUserProfile(evaluation);
    }

    // Update context
    this.updateContext(inputs, outputs);
  }

  // Update user profile based on evaluation
  updateUserProfile(evaluation) {
    const { score, correctness, depth, clarity, category, difficulty } = evaluation;
    
    // Add to performance history
    this.userProfile.performanceHistory.push({
      score,
      correctness: correctness.score,
      depth: depth.score,
      clarity: clarity.score,
      category,
      difficulty,
      timestamp: Date.now()
    });

    // Update statistics
    this.userProfile.totalQuestions++;
    if (score >= 70) {
      this.userProfile.correctAnswers++;
    }

    // Calculate average score
    const totalScore = this.userProfile.performanceHistory.reduce((sum, p) => sum + p.score, 0);
    this.userProfile.averageScore = totalScore / this.userProfile.performanceHistory.length;

    // Update strengths and weaknesses
    this.updateStrengthsAndWeaknesses(evaluation);

    // Update difficulty progression
    this.userProfile.difficultyProgression.push({
      difficulty: this.userProfile.currentDifficulty,
      score,
      timestamp: Date.now()
    });

    this.userProfile.lastUpdated = Date.now();
  }

  // Update strengths and weaknesses
  updateStrengthsAndWeaknesses(evaluation) {
    const { correctness, depth, clarity, category } = evaluation;
    
    // Add to strengths if score is high
    if (correctness.score >= 80) {
      this.addToCategory(this.userProfile.strengths, category, 'correctness');
    }
    if (depth.score >= 80) {
      this.addToCategory(this.userProfile.strengths, category, 'depth');
    }
    if (clarity.score >= 80) {
      this.addToCategory(this.userProfile.strengths, category, 'clarity');
    }

    // Add to weaknesses if score is low
    if (correctness.score < 60) {
      this.addToCategory(this.userProfile.weaknesses, category, 'correctness');
    }
    if (depth.score < 60) {
      this.addToCategory(this.userProfile.weaknesses, category, 'depth');
    }
    if (clarity.score < 60) {
      this.addToCategory(this.userProfile.weaknesses, category, 'clarity');
    }
  }

  // Helper to add to category list
  addToCategory(list, category, aspect) {
    const existing = list.find(item => item.category === category);
    if (existing) {
      if (!existing.aspects.includes(aspect)) {
        existing.aspects.push(aspect);
        existing.count++;
      }
    } else {
      list.push({
        category,
        aspects: [aspect],
        count: 1
      });
    }
  }

  // Update context based on inputs and outputs
  updateContext(inputs, outputs) {
    const { question, answer, evaluation } = inputs;
    const { nextDifficulty, reasoning } = outputs;

    // Update recent answers
    if (answer) {
      this.context.recentAnswers.push({
        question,
        answer,
        evaluation,
        timestamp: Date.now()
      });
    }

    // Keep only last 5 answers
    if (this.context.recentAnswers.length > 5) {
      this.context.recentAnswers = this.context.recentAnswers.slice(-5);
    }

    // Update performance trend
    this.updatePerformanceTrend();

    // Update adaptation level
    this.updateAdaptationLevel();

    // Update current difficulty
    if (nextDifficulty) {
      this.userProfile.currentDifficulty = nextDifficulty;
    }
  }

  // Update performance trend
  updatePerformanceTrend() {
    const recent = this.userProfile.performanceHistory.slice(-3);
    if (recent.length < 2) {
      this.context.performanceTrend = 'stable';
      return;
    }

    const scores = recent.map(p => p.score);
    const trend = this.calculateTrend(scores);
    this.context.performanceTrend = trend;
  }

  // Calculate trend from scores
  calculateTrend(scores) {
    if (scores.length < 2) return 'stable';
    
    const first = scores[0];
    const last = scores[scores.length - 1];
    const diff = last - first;
    
    if (diff > 10) return 'improving';
    if (diff < -10) return 'declining';
    return 'stable';
  }

  // Update adaptation level
  updateAdaptationLevel() {
    const recent = this.userProfile.performanceHistory.slice(-3);
    if (recent.length < 2) {
      this.context.adaptationLevel = 0;
      return;
    }

    const avgScore = recent.reduce((sum, p) => sum + p.score, 0) / recent.length;
    
    if (avgScore >= 85) {
      this.context.adaptationLevel = 1; // Increase difficulty
    } else if (avgScore <= 60) {
      this.context.adaptationLevel = -1; // Decrease difficulty
    } else {
      this.context.adaptationLevel = 0; // Keep current difficulty
    }
  }

  // Get next difficulty level
  getNextDifficulty() {
    const { adaptationLevel, performanceTrend } = this.context;
    const currentDifficulty = this.userProfile.currentDifficulty;
    
    const difficultyLevels = ['beginner', 'intermediate', 'advanced'];
    const currentIndex = difficultyLevels.indexOf(currentDifficulty);
    
    let nextIndex = currentIndex;
    
    // Adapt based on performance
    if (adaptationLevel === 1 && currentIndex < difficultyLevels.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (adaptationLevel === -1 && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }
    
    return difficultyLevels[nextIndex];
  }

  // Get recommended question category
  getRecommendedCategory() {
    const { weaknesses, strengths } = this.userProfile;
    
    // Prioritize weak areas
    if (weaknesses.length > 0) {
      const sortedWeaknesses = weaknesses.sort((a, b) => b.count - a.count);
      return sortedWeaknesses[0].category;
    }
    
    // If no weaknesses, continue with strengths or random
    if (strengths.length > 0) {
      const sortedStrengths = strengths.sort((a, b) => b.count - a.count);
      return sortedStrengths[0].category;
    }
    
    return null; // Let the system choose randomly
  }

  // Get user profile summary
  getUserProfileSummary() {
    const { totalQuestions, correctAnswers, averageScore, strengths, weaknesses } = this.userProfile;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    return {
      totalQuestions,
      correctAnswers,
      accuracy: Math.round(accuracy),
      averageScore: Math.round(averageScore),
      currentDifficulty: this.userProfile.currentDifficulty,
      performanceTrend: this.context.performanceTrend,
      adaptationLevel: this.context.adaptationLevel,
      strengths: strengths.slice(0, 3), // Top 3 strengths
      weaknesses: weaknesses.slice(0, 3), // Top 3 weaknesses
      lastUpdated: this.userProfile.lastUpdated
    };
  }

  // Clear memory
  async clear() {
    this.chatHistory.clear();
    this.userProfile = {
      sessionId: this.sessionId,
      performanceHistory: [],
      difficultyProgression: [],
      strengths: [],
      weaknesses: [],
      currentDifficulty: 'intermediate',
      totalQuestions: 0,
      correctAnswers: 0,
      averageScore: 0,
      lastUpdated: Date.now()
    };
    this.context = {
      currentTopic: 'Excel',
      questionCategories: [],
      recentAnswers: [],
      performanceTrend: 'stable',
      adaptationLevel: 0
    };
  }

  // Get memory as JSON
  toJSON() {
    return {
      sessionId: this.sessionId,
      userProfile: this.userProfile,
      context: this.context,
      chatHistory: this.chatHistory.messages.map(msg => ({
        type: msg.constructor.name,
        content: msg.content
      }))
    };
  }

  // Load memory from JSON
  static fromJSON(data) {
    const memory = new InterviewMemory(data.sessionId);
    memory.userProfile = data.userProfile;
    memory.context = data.context;
    
    // Reconstruct chat history
    data.chatHistory.forEach(msgData => {
      let message;
      switch (msgData.type) {
        case 'HumanMessage':
          message = new HumanMessage(msgData.content);
          break;
        case 'AIMessage':
          message = new AIMessage(msgData.content);
          break;
        case 'SystemMessage':
          message = new SystemMessage(msgData.content);
          break;
      }
      if (message) {
        memory.chatHistory.addMessage(message);
      }
    });
    
    return memory;
  }
}

module.exports = InterviewMemory;
