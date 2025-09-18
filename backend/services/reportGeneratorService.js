const llmService = require('./llmService');
const adaptiveAgent = require('./adaptiveAgent');
const memoryService = require('./memoryService');

class ReportGeneratorService {
  constructor() {
    // Report templates can be added here in the future
  }

  // Generate comprehensive performance report
  async generatePerformanceReport(sessionId, interviewState) {
    try {
      // Get session insights from adaptive agent
      const insights = await adaptiveAgent.getSessionInsights(sessionId);
      
      // Get all evaluations for the session
      const evaluationsResult = await memoryService.getSessionEvaluations(sessionId);
      const evaluations = evaluationsResult.success ? evaluationsResult.evaluations : [];

      // Create interview transcript
      const transcript = this.createInterviewTranscript(interviewState, evaluations);

      // Generate structured report
      const report = await this.generateStructuredReport(interviewState, insights, evaluations, transcript);

      // Save report and transcript
      await this.saveReportAndTranscript(sessionId, report, transcript);

      return {
        success: true,
        report,
        transcript,
        sessionId
      };
    } catch (error) {
      console.error('Error generating performance report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create interview transcript
  createInterviewTranscript(interviewState, evaluations) {
    const { session, questions, answers, evaluations: stateEvaluations } = interviewState;
    
    const transcript = {
      sessionInfo: {
        sessionId: session.sessionId,
        candidateName: session.candidateName,
        topic: session.topic,
        difficulty: session.difficulty,
        totalQuestions: session.totalQuestions,
        startTime: new Date(session.createdAt).toISOString(),
        endTime: new Date().toISOString(),
        duration: Math.round((Date.now() - session.createdAt) / 1000 / 60) // minutes
      },
      questions: questions.map((q, index) => {
        const answer = answers.find(a => a.questionId === q.id);
        const evaluation = stateEvaluations.find(e => e.questionId === q.id);
        
        return {
          questionNumber: index + 1,
          question: q.question,
          category: q.category,
          difficulty: q.difficulty,
          expectedAnswer: q.expectedAnswer,
          keyPoints: q.keyPoints,
          userAnswer: answer?.answer || 'No answer provided',
          answerTimestamp: answer?.timestamp ? new Date(answer.timestamp).toISOString() : null,
          evaluation: evaluation ? {
            overallScore: evaluation.score,
            weightedScore: evaluation.weightedScore,
            correctness: evaluation.correctness,
            depth: evaluation.depth,
            clarity: evaluation.clarity,
            feedback: evaluation.feedback,
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
            isCorrect: evaluation.isCorrect
          } : null
        };
      }),
      summary: {
        totalQuestions: questions.length,
        questionsAnswered: answers.length,
        averageScore: interviewState.progress.averageScore,
        totalScore: interviewState.progress.totalScore,
        correctAnswers: stateEvaluations.filter(e => e.isCorrect).length,
        accuracy: Math.round((stateEvaluations.filter(e => e.isCorrect).length / questions.length) * 100)
      }
    };

    return transcript;
  }

  // Generate structured report using LLM
  async generateStructuredReport(interviewState, insights, evaluations, transcript) {
    if (!llmService.isAvailable()) {
      return this.generateFallbackReport(interviewState, insights, evaluations);
    }

    try {
      const prompt = this.createReportPrompt(interviewState, insights, evaluations, transcript);
      const response = await llmService.generateResponse(prompt);
      
      if (!response.success) {
        throw new Error(`LLM report generation failed: ${response.error}`);
      }

      // Parse the structured response
      const structuredReport = this.parseStructuredReport(response.content, interviewState, insights);
      
      return structuredReport;
    } catch (error) {
      console.error('Error generating structured report:', error);
      return this.generateFallbackReport(interviewState, insights, evaluations);
    }
  }

  // Create comprehensive report prompt
  createReportPrompt(interviewState, insights, evaluations, transcript) {
    const { session, progress } = interviewState;
    
    return `Generate a comprehensive Excel interview performance report for a candidate.

CANDIDATE INFORMATION:
- Name: ${session.candidateName || 'Anonymous'}
- Interview Topic: ${session.topic}
- Difficulty Level: ${session.difficulty}
- Date: ${new Date(session.createdAt).toLocaleDateString()}
- Duration: ${Math.round((Date.now() - session.createdAt) / 1000 / 60)} minutes

PERFORMANCE METRICS:
- Total Questions: ${progress.questionsAnswered}
- Average Score: ${progress.averageScore.toFixed(1)}/100
- Total Score: ${progress.totalScore}/100
- Correct Answers: ${evaluations.filter(e => e.isCorrect).length}
- Accuracy: ${Math.round((evaluations.filter(e => e.isCorrect).length / progress.questionsAnswered) * 100)}%

PERFORMANCE INSIGHTS:
- Performance Trend: ${insights.performance.trend}
- Strengths: ${insights.strengths.map(s => s.category).join(', ')}
- Weaknesses: ${insights.weaknesses.map(w => w.category).join(', ')}

DETAILED EVALUATIONS:
${evaluations.map((evaluation, index) => `
Question ${index + 1}:
- Category: ${evaluation.category || 'Unknown'}
- Score: ${evaluation.score}/100
- Correctness: ${evaluation.correctness?.score || 0}/100
- Depth: ${evaluation.depth?.score || 0}/100
- Clarity: ${evaluation.clarity?.score || 0}/100
- Feedback: ${evaluation.feedback || 'No feedback available'}
`).join('\n')}

Please generate a structured report in the following JSON format:

{
  "executiveSummary": {
    "overallGrade": "A+",
    "totalScore": 85,
    "keyHighlights": ["Strong technical knowledge", "Clear communication"],
    "mainTakeaway": "Excellent performance with room for improvement in advanced features"
  },
  "performanceBreakdown": {
    "byCategory": {
      "Formulas": { "score": 90, "questions": 3, "strengths": ["VLOOKUP mastery"], "weaknesses": [] },
      "Pivot Tables": { "score": 75, "questions": 2, "strengths": ["Basic understanding"], "weaknesses": ["Advanced features"] }
    },
    "byDifficulty": {
      "beginner": { "score": 95, "questions": 2 },
      "intermediate": { "score": 80, "questions": 2 },
      "advanced": { "score": 70, "questions": 1 }
    }
  },
  "strengths": [
    {
      "category": "Formulas",
      "description": "Demonstrates strong understanding of Excel formulas",
      "evidence": "Scored 90% on formula-related questions",
      "recommendation": "Continue building on this strength"
    }
  ],
  "weaknesses": [
    {
      "category": "Advanced Features",
      "description": "Struggles with complex Excel features",
      "evidence": "Scored 60% on advanced questions",
      "recommendation": "Focus on Power Query and advanced pivot table features"
    }
  ],
  "recommendations": {
    "immediate": [
      "Practice advanced pivot table features",
      "Learn Power Query for data transformation"
    ],
    "longTerm": [
      "Consider Excel certification",
      "Explore VBA for automation"
    ],
    "resources": [
      "Microsoft Excel Advanced Training",
      "Excel Power Query Tutorials",
      "Pivot Table Mastery Course"
    ]
  },
  "nextSteps": {
    "priority": "high",
    "focusAreas": ["Advanced Features", "Data Analysis"],
    "timeline": "2-3 months",
    "goals": ["Master Power Query", "Advanced pivot table techniques"]
  }
}

Be thorough, constructive, and specific in your analysis. Focus on actionable insights and clear recommendations.`;
  }

  // Parse structured report from LLM response
  parseStructuredReport(llmResponse, interviewState, insights) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          metadata: {
            generatedAt: new Date().toISOString(),
            sessionId: interviewState.session.sessionId,
            llmGenerated: true
          }
        };
      }
    } catch (error) {
      console.warn('Failed to parse LLM response as JSON, using fallback');
    }

    // Fallback to generated report
    return this.generateFallbackReport(interviewState, insights, []);
  }

  // Generate fallback report when LLM is not available
  generateFallbackReport(interviewState, insights, evaluations) {
    const { session, progress } = interviewState;
    const { performance } = insights;

    const overallGrade = this.calculateGrade(progress.averageScore);
    const accuracy = Math.round((evaluations.filter(e => e.isCorrect).length / progress.questionsAnswered) * 100);

    return {
      executiveSummary: {
        overallGrade,
        totalScore: Math.round(progress.averageScore),
        keyHighlights: this.generateKeyHighlights(performance, evaluations),
        mainTakeaway: this.generateMainTakeaway(progress.averageScore, performance.trend)
      },
      performanceBreakdown: {
        byCategory: this.analyzeByCategory(evaluations),
        byDifficulty: this.analyzeByDifficulty(evaluations)
      },
      strengths: this.identifyStrengths(insights.strengths, evaluations),
      weaknesses: this.identifyWeaknesses(insights.weaknesses, evaluations),
      recommendations: {
        immediate: this.generateImmediateRecommendations(insights.weaknesses),
        longTerm: this.generateLongTermRecommendations(progress.averageScore),
        resources: this.generateResourceRecommendations(insights.weaknesses)
      },
      nextSteps: {
        priority: progress.averageScore < 70 ? 'high' : 'medium',
        focusAreas: insights.weaknesses.map(w => w.category),
        timeline: progress.averageScore < 70 ? '3-6 months' : '1-3 months',
        goals: this.generateGoals(insights.weaknesses, progress.averageScore)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        sessionId: session.sessionId,
        llmGenerated: false
      }
    };
  }

  // Helper methods for fallback report generation
  calculateGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D+';
    if (score >= 60) return 'D';
    return 'F';
  }

  generateKeyHighlights(performance, evaluations) {
    const highlights = [];
    
    if (performance.averageScore >= 85) {
      highlights.push('Excellent overall performance');
    }
    
    if (performance.trend === 'improving') {
      highlights.push('Shows consistent improvement');
    }
    
    const strengths = evaluations.filter(e => e.score >= 85);
    if (strengths.length > 0) {
      highlights.push(`Strong performance in ${strengths.length} areas`);
    }
    
    return highlights.length > 0 ? highlights : ['Completed the interview successfully'];
  }

  generateMainTakeaway(averageScore, trend) {
    if (averageScore >= 90) {
      return 'Outstanding Excel skills with potential for advanced roles';
    } else if (averageScore >= 80) {
      return 'Strong Excel foundation with room for advanced feature mastery';
    } else if (averageScore >= 70) {
      return 'Good understanding of Excel basics, focus on intermediate features';
    } else {
      return 'Solid foundation established, continue building core Excel skills';
    }
  }

  analyzeByCategory(evaluations) {
    const categoryAnalysis = {};
    
    evaluations.forEach(evaluation => {
      const category = evaluation.category || 'Unknown';
      if (!categoryAnalysis[category]) {
        categoryAnalysis[category] = {
          score: 0,
          questions: 0,
          strengths: [],
          weaknesses: []
        };
      }
      
      categoryAnalysis[category].score += evaluation.score;
      categoryAnalysis[category].questions += 1;
      
      if (evaluation.score >= 80) {
        categoryAnalysis[category].strengths.push('Strong performance');
      } else if (evaluation.score < 60) {
        categoryAnalysis[category].weaknesses.push('Needs improvement');
      }
    });
    
    // Calculate averages
    Object.keys(categoryAnalysis).forEach(category => {
      const analysis = categoryAnalysis[category];
      analysis.score = Math.round(analysis.score / analysis.questions);
    });
    
    return categoryAnalysis;
  }

  analyzeByDifficulty(evaluations) {
    const difficultyAnalysis = {};
    
    evaluations.forEach(evaluation => {
      const difficulty = evaluation.difficulty || 'intermediate';
      if (!difficultyAnalysis[difficulty]) {
        difficultyAnalysis[difficulty] = { score: 0, questions: 0 };
      }
      
      difficultyAnalysis[difficulty].score += evaluation.score;
      difficultyAnalysis[difficulty].questions += 1;
    });
    
    // Calculate averages
    Object.keys(difficultyAnalysis).forEach(difficulty => {
      const analysis = difficultyAnalysis[difficulty];
      analysis.score = Math.round(analysis.score / analysis.questions);
    });
    
    return difficultyAnalysis;
  }

  identifyStrengths(strengths, evaluations) {
    return strengths.slice(0, 3).map(strength => ({
      category: strength.category,
      description: `Strong performance in ${strength.category}`,
      evidence: `Consistently high scores in this area`,
      recommendation: 'Continue building on this strength'
    }));
  }

  identifyWeaknesses(weaknesses, evaluations) {
    return weaknesses.slice(0, 3).map(weakness => ({
      category: weakness.category,
      description: `Needs improvement in ${weakness.category}`,
      evidence: `Lower scores in this area`,
      recommendation: `Focus on ${weakness.category} fundamentals`
    }));
  }

  generateImmediateRecommendations(weaknesses) {
    const recommendations = [];
    
    if (weaknesses.length > 0) {
      recommendations.push(`Focus on ${weaknesses[0].category} fundamentals`);
    }
    
    recommendations.push('Practice with real Excel datasets');
    recommendations.push('Review basic Excel functions');
    
    return recommendations;
  }

  generateLongTermRecommendations(averageScore) {
    const recommendations = [];
    
    if (averageScore >= 80) {
      recommendations.push('Consider Excel certification');
      recommendations.push('Explore advanced features like Power Query');
    } else {
      recommendations.push('Build solid foundation with basic functions');
      recommendations.push('Practice regularly with Excel tutorials');
    }
    
    return recommendations;
  }

  generateResourceRecommendations(weaknesses) {
    const resources = [
      'Microsoft Excel Official Documentation',
      'Excel YouTube Tutorials',
      'Excel Practice Workbooks'
    ];
    
    if (weaknesses.some(w => w.category === 'Formulas')) {
      resources.push('Excel Formula Reference Guide');
    }
    
    if (weaknesses.some(w => w.category === 'Pivot Tables')) {
      resources.push('Pivot Table Mastery Course');
    }
    
    return resources;
  }

  generateGoals(weaknesses, averageScore) {
    const goals = [];
    
    if (weaknesses.length > 0) {
      goals.push(`Master ${weaknesses[0].category} concepts`);
    }
    
    if (averageScore < 70) {
      goals.push('Achieve 80% accuracy in basic Excel functions');
    } else {
      goals.push('Advance to expert-level Excel features');
    }
    
    return goals;
  }

  // Save report and transcript to storage
  async saveReportAndTranscript(sessionId, report, transcript) {
    try {
      const reportData = {
        sessionId,
        report,
        transcript,
        generatedAt: new Date().toISOString(),
        metadata: {
          version: '1.0',
          type: 'performance_report'
        }
      };

      // Save to file system
      const fs = require('fs');
      const path = require('path');
      const reportsDir = path.join(__dirname, '../data/reports');
      
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const filePath = path.join(reportsDir, `report_${sessionId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
      
      console.log(`✅ Report and transcript saved for session ${sessionId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save report and transcript:', error);
      return { success: false, error: error.message };
    }
  }

  // Load report and transcript
  async loadReportAndTranscript(sessionId) {
    try {
      const fs = require('fs');
      const path = require('path');
      const reportsDir = path.join(__dirname, '../data/reports');
      const filePath = path.join(reportsDir, `report_${sessionId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Report not found' };
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      const reportData = JSON.parse(data);
      
      return { success: true, data: reportData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all reports
  async getAllReports() {
    try {
      const fs = require('fs');
      const path = require('path');
      const reportsDir = path.join(__dirname, '../data/reports');
      
      if (!fs.existsSync(reportsDir)) {
        return { success: true, reports: [] };
      }
      
      const files = fs.readdirSync(reportsDir);
      const reportFiles = files.filter(file => file.startsWith('report_') && file.endsWith('.json'));
      
      const reports = [];
      
      for (const file of reportFiles) {
        const filePath = path.join(reportsDir, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const reportData = JSON.parse(data);
        reports.push({
          sessionId: reportData.sessionId,
          generatedAt: reportData.generatedAt,
          candidateName: reportData.transcript.sessionInfo.candidateName,
          overallGrade: reportData.report.executiveSummary.overallGrade,
          totalScore: reportData.report.executiveSummary.totalScore
        });
      }
      
      // Sort by generation date (newest first)
      reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
      
      return { success: true, reports };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  isAvailable() {
    return true; // Report generation is always available (with or without LLM)
  }
}

module.exports = new ReportGeneratorService();
