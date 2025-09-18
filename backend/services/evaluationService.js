const llmService = require('./llmService');
const questionBankService = require('./questionBankService');

class EvaluationService {
  constructor() {
    this.evaluationCriteria = questionBankService.getEvaluationCriteria();
  }

  async evaluateAnswer(question, userAnswer, questionData = null) {
    if (!llmService.isAvailable()) {
      return {
        success: false,
        error: 'LLM service not available'
      };
    }

    try {
      // Get evaluation criteria
      const criteria = this.evaluationCriteria;
      
      // Create enhanced evaluation prompt
      const evaluationPrompt = this.createEvaluationPrompt(question, userAnswer, questionData, criteria);
      
      // Get LLM evaluation
      const llmResult = await llmService.generateResponse(evaluationPrompt);
      
      if (!llmResult.success) {
        return {
          success: false,
          error: `LLM evaluation failed: ${llmResult.error}`
        };
      }

      // Parse LLM response
      const evaluation = this.parseEvaluationResponse(llmResult.content, criteria);
      
      // Calculate weighted score
      const weightedScore = this.calculateWeightedScore(evaluation, criteria);
      
      // Generate detailed feedback
      const detailedFeedback = this.generateDetailedFeedback(evaluation, questionData);
      
      return {
        success: true,
        evaluation: {
          ...evaluation,
          weightedScore,
          detailedFeedback,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Evaluation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  createEvaluationPrompt(question, userAnswer, questionData, criteria) {
    const expectedAnswer = questionData?.expectedAnswer || 'Not provided';
    const keyPoints = questionData?.keyPoints || [];
    const example = questionData?.example || 'Not provided';

    return `You are an expert Excel instructor evaluating an interview answer. Please evaluate the following response based on the criteria provided.

QUESTION: ${question}

EXPECTED ANSWER (for reference): ${expectedAnswer}
KEY POINTS TO COVER: ${keyPoints.join(', ')}
EXAMPLE: ${example}

USER'S ANSWER: ${userAnswer}

EVALUATION CRITERIA:
1. CORRECTNESS (Weight: ${criteria.correctness.weight * 100}%): ${criteria.correctness.description}
   - Excellent: ${criteria.correctness.levels.excellent}
   - Good: ${criteria.correctness.levels.good}
   - Satisfactory: ${criteria.correctness.levels.satisfactory}
   - Needs Improvement: ${criteria.correctness.levels.needs_improvement}
   - Incorrect: ${criteria.correctness.levels.incorrect}

2. DEPTH (Weight: ${criteria.depth.weight * 100}%): ${criteria.depth.description}
   - Excellent: ${criteria.depth.levels.excellent}
   - Good: ${criteria.depth.levels.good}
   - Satisfactory: ${criteria.depth.levels.satisfactory}
   - Needs Improvement: ${criteria.depth.levels.needs_improvement}
   - Incorrect: ${criteria.depth.levels.incorrect}

3. CLARITY (Weight: ${criteria.clarity.weight * 100}%): ${criteria.clarity.description}
   - Excellent: ${criteria.clarity.levels.excellent}
   - Good: ${criteria.clarity.levels.good}
   - Satisfactory: ${criteria.clarity.levels.satisfactory}
   - Needs Improvement: ${criteria.clarity.levels.needs_improvement}
   - Incorrect: ${criteria.clarity.levels.incorrect}

Please provide your evaluation in the following JSON format:
{
  "correctness": {
    "score": 85,
    "level": "good",
    "feedback": "The answer demonstrates good understanding of the concept with minor gaps in technical details."
  },
  "depth": {
    "score": 75,
    "level": "satisfactory", 
    "feedback": "Adequate detail provided but could benefit from more examples or edge cases."
  },
  "clarity": {
    "score": 90,
    "level": "excellent",
    "feedback": "Answer is well-structured and easy to follow with clear explanations."
  },
  "overall": {
    "score": 83,
    "feedback": "Strong answer overall with good technical understanding and clear communication.",
    "strengths": ["Clear explanation", "Good technical accuracy", "Well-structured response"],
    "improvements": ["Could include more examples", "Mention edge cases", "Add practical applications"]
  }
}

Be thorough but fair in your evaluation. Consider the difficulty level and provide constructive feedback.`;
  }

  parseEvaluationResponse(llmResponse, criteria) {
    try {
      // Try to parse as JSON
      const evaluation = JSON.parse(llmResponse);
      
      // Validate structure
      if (!evaluation.correctness || !evaluation.depth || !evaluation.clarity || !evaluation.overall) {
        throw new Error('Invalid evaluation structure');
      }

      return evaluation;
    } catch (parseError) {
      console.warn('Failed to parse LLM evaluation response, using fallback');
      
      // Fallback evaluation
      return this.createFallbackEvaluation(llmResponse);
    }
  }

  createFallbackEvaluation(llmResponse) {
    // Extract scores from text if JSON parsing fails
    const scoreRegex = /(\d+)/g;
    const scores = llmResponse.match(scoreRegex)?.map(Number) || [70, 70, 70];
    
    return {
      correctness: {
        score: scores[0] || 70,
        level: this.getScoreLevel(scores[0] || 70),
        feedback: "Evaluation based on automated analysis"
      },
      depth: {
        score: scores[1] || 70,
        level: this.getScoreLevel(scores[1] || 70),
        feedback: "Evaluation based on automated analysis"
      },
      clarity: {
        score: scores[2] || 70,
        level: this.getScoreLevel(scores[2] || 70),
        feedback: "Evaluation based on automated analysis"
      },
      overall: {
        score: Math.round((scores[0] + scores[1] + scores[2]) / 3),
        feedback: llmResponse.substring(0, 200) + "...",
        strengths: ["Answer provided"],
        improvements: ["Could be more detailed"]
      }
    };
  }

  getScoreLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'satisfactory';
    if (score >= 60) return 'needs_improvement';
    return 'incorrect';
  }

  calculateWeightedScore(evaluation, criteria) {
    const correctnessScore = evaluation.correctness.score * criteria.correctness.weight;
    const depthScore = evaluation.depth.score * criteria.depth.weight;
    const clarityScore = evaluation.clarity.score * criteria.clarity.weight;
    
    return Math.round(correctnessScore + depthScore + clarityScore);
  }

  generateDetailedFeedback(evaluation, questionData) {
    const { correctness, depth, clarity, overall } = evaluation;
    
    let detailedFeedback = `## Detailed Evaluation\n\n`;
    
    // Correctness feedback
    detailedFeedback += `### Correctness (${correctness.score}/100 - ${correctness.level.toUpperCase()})\n`;
    detailedFeedback += `${correctness.feedback}\n\n`;
    
    // Depth feedback
    detailedFeedback += `### Depth (${depth.score}/100 - ${depth.level.toUpperCase()})\n`;
    detailedFeedback += `${depth.feedback}\n\n`;
    
    // Clarity feedback
    detailedFeedback += `### Clarity (${clarity.score}/100 - ${clarity.level.toUpperCase()})\n`;
    detailedFeedback += `${clarity.feedback}\n\n`;
    
    // Overall assessment
    detailedFeedback += `### Overall Assessment (${overall.score}/100)\n`;
    detailedFeedback += `${overall.feedback}\n\n`;
    
    // Strengths
    if (overall.strengths && overall.strengths.length > 0) {
      detailedFeedback += `### Strengths\n`;
      overall.strengths.forEach(strength => {
        detailedFeedback += `- ${strength}\n`;
      });
      detailedFeedback += `\n`;
    }
    
    // Improvements
    if (overall.improvements && overall.improvements.length > 0) {
      detailedFeedback += `### Areas for Improvement\n`;
      overall.improvements.forEach(improvement => {
        detailedFeedback += `- ${improvement}\n`;
      });
      detailedFeedback += `\n`;
    }
    
    // Additional context if available
    if (questionData?.example) {
      detailedFeedback += `### Example\n`;
      detailedFeedback += `${questionData.example}\n\n`;
    }
    
    return detailedFeedback;
  }

  // Batch evaluation for multiple answers
  async evaluateMultipleAnswers(questionAnswerPairs) {
    const results = [];
    
    for (const pair of questionAnswerPairs) {
      const result = await this.evaluateAnswer(pair.question, pair.answer, pair.questionData);
      results.push({
        questionId: pair.questionId,
        ...result
      });
    }
    
    return {
      success: true,
      evaluations: results,
      summary: this.generateBatchSummary(results)
    };
  }

  generateBatchSummary(evaluations) {
    const validEvaluations = evaluations.filter(e => e.success);
    
    if (validEvaluations.length === 0) {
      return {
        totalQuestions: evaluations.length,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        performanceLevel: 'No valid evaluations'
      };
    }

    const scores = validEvaluations.map(e => e.evaluation.overall.score);
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    
    let performanceLevel = 'Needs Improvement';
    if (averageScore >= 90) performanceLevel = 'Excellent';
    else if (averageScore >= 80) performanceLevel = 'Good';
    else if (averageScore >= 70) performanceLevel = 'Satisfactory';
    
    return {
      totalQuestions: evaluations.length,
      validEvaluations: validEvaluations.length,
      averageScore,
      highestScore,
      lowestScore,
      performanceLevel
    };
  }

  isAvailable() {
    return llmService.isAvailable() && questionBankService.isAvailable();
  }
}

module.exports = new EvaluationService();
