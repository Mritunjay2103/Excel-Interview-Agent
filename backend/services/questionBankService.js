const fs = require('fs');
const path = require('path');

class QuestionBankService {
  constructor() {
    this.questionBank = null;
    this.loadQuestionBank();
  }

  loadQuestionBank() {
    try {
      const questionBankPath = path.join(__dirname, '../data/questionBank.json');
      const data = fs.readFileSync(questionBankPath, 'utf8');
      this.questionBank = JSON.parse(data);
      console.log('✅ Question bank loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load question bank:', error.message);
      this.questionBank = null;
    }
  }

  getQuestionById(questionId) {
    if (!this.questionBank) return null;
    return this.questionBank.questions.find(q => q.id === questionId);
  }

  getQuestionsByCategory(category, difficulty = null) {
    if (!this.questionBank) return [];
    
    let questions = this.questionBank.questions.filter(q => q.category === category);
    
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    
    return questions;
  }

  getQuestionsByDifficulty(difficulty) {
    if (!this.questionBank) return [];
    return this.questionBank.questions.filter(q => q.difficulty === difficulty);
  }

  getRandomQuestions(count, category = null, difficulty = null) {
    if (!this.questionBank) return [];
    
    let questions = [...this.questionBank.questions];
    
    if (category) {
      questions = questions.filter(q => q.category === category);
    }
    
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }
    
    // Shuffle and return requested count
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  getCategories() {
    if (!this.questionBank) return [];
    return Object.keys(this.questionBank.categories).map(key => ({
      id: key,
      ...this.questionBank.categories[key]
    }));
  }

  getDifficulties() {
    return ['beginner', 'intermediate', 'advanced'];
  }

  getEvaluationCriteria() {
    if (!this.questionBank) return null;
    return this.questionBank.evaluationCriteria;
  }

  // Generate questions for interview based on parameters
  generateInterviewQuestions(topic, difficulty, count) {
    if (!this.questionBank) {
      return {
        success: false,
        error: 'Question bank not available'
      };
    }

    // Map topic to category
    const topicMapping = {
      'excel': null, // All categories
      'formulas': 'formulas',
      'pivot tables': 'pivot_tables',
      'charts': 'charts',
      'data management': 'data_management',
      'advanced features': 'advanced_features'
    };

    const category = topicMapping[topic.toLowerCase()] || null;
    const questions = this.getRandomQuestions(count, category, difficulty);

    if (questions.length === 0) {
      return {
        success: false,
        error: 'No questions found for the specified criteria'
      };
    }

    // Format questions for interview
    const formattedQuestions = questions.map((q, index) => ({
      id: `interview_q_${index + 1}`,
      question: q.question,
      difficulty: q.difficulty,
      category: this.questionBank.categories[q.category].name,
      expectedAnswer: q.expectedAnswer,
      keyPoints: q.keyPoints,
      example: q.example,
      timeLimit: this.getTimeLimit(q.difficulty)
    }));

    return {
      success: true,
      questions: formattedQuestions,
      metadata: {
        topic,
        difficulty,
        count: formattedQuestions.length,
        categories: [...new Set(formattedQuestions.map(q => q.category))]
      }
    };
  }

  getTimeLimit(difficulty) {
    const timeLimits = {
      'beginner': 180, // 3 minutes
      'intermediate': 300, // 5 minutes
      'advanced': 420 // 7 minutes
    };
    return timeLimits[difficulty] || 300;
  }

  // Get question statistics
  getStatistics() {
    if (!this.questionBank) return null;

    const stats = {
      totalQuestions: this.questionBank.questions.length,
      byCategory: {},
      byDifficulty: {},
      categories: Object.keys(this.questionBank.categories).length
    };

    // Count by category
    this.questionBank.questions.forEach(q => {
      stats.byCategory[q.category] = (stats.byCategory[q.category] || 0) + 1;
      stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
    });

    return stats;
  }

  isAvailable() {
    return this.questionBank !== null;
  }
}

module.exports = new QuestionBankService();
