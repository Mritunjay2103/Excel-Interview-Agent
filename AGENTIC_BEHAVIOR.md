# Agentic Behavior System

## Overview
The Mock Excel Interviewer now features an intelligent adaptive agent that uses LangChain Memory to maintain user context across interview turns and dynamically adjusts question difficulty based on performance patterns.

## Key Features

### 🧠 **LangChain Memory Integration**
- **Persistent User Context** - Maintains conversation history and user profile
- **Performance Tracking** - Tracks scores, strengths, weaknesses across sessions
- **Adaptive Learning** - Learns from user patterns to improve question selection
- **Session Persistence** - Saves and restores user context between sessions

### 🎯 **Dynamic Question Selection**
- **Performance-Based Adaptation** - Adjusts difficulty based on recent performance
- **Category Targeting** - Focuses on weak areas while reinforcing strengths
- **Intelligent Reasoning** - AI explains why specific questions are selected
- **Real-time Adjustment** - Adapts after each answer evaluation

### 📊 **Advanced Performance Analysis**
- **Multi-dimensional Scoring** - Tracks correctness, depth, and clarity separately
- **Trend Analysis** - Identifies improving, declining, or stable performance patterns
- **Strengths & Weaknesses** - Automatically categorizes user capabilities
- **Adaptation Levels** - Quantifies how much difficulty should change

## Memory System Architecture

### InterviewMemory Class
```javascript
class InterviewMemory extends BaseMemory {
  // User profile tracking
  userProfile: {
    performanceHistory: [],      // All evaluation scores
    difficultyProgression: [],   // Difficulty changes over time
    strengths: [],              // Strong categories/aspects
    weaknesses: [],             // Weak categories/aspects
    currentDifficulty: string,   // Current difficulty level
    totalQuestions: number,      // Questions answered
    correctAnswers: number,      // Correct answers
    averageScore: number         // Overall performance
  }
  
  // Context tracking
  context: {
    currentTopic: string,        // Current interview topic
    questionCategories: [],      // Categories covered
    recentAnswers: [],          // Last 5 answers
    performanceTrend: string,    // 'improving' | 'declining' | 'stable'
    adaptationLevel: number      // -1 (easier) | 0 (same) | 1 (harder)
  }
}
```

### Memory Persistence
- **Session Storage** - Each interview session has its own memory
- **File-based Persistence** - Memory saved to JSON files
- **Automatic Loading** - Memory restored when session resumes
- **Cross-session Learning** - User profile persists across multiple interviews

## Adaptive Question Selection

### Performance Analysis Algorithm
1. **Recent Performance** - Analyzes last 3 answers for trends
2. **Score Thresholds** - 85+ = increase difficulty, 60- = decrease difficulty
3. **Category Analysis** - Identifies weak areas for targeted questions
4. **Trend Detection** - Recognizes improving/declining patterns

### Question Selection Logic
```javascript
// Difficulty adjustment based on performance
if (averageScore >= 85) {
  nextDifficulty = increaseDifficulty(currentDifficulty);
  reasoning = "You're excelling! Increasing difficulty to challenge you further.";
} else if (averageScore <= 60) {
  nextDifficulty = decreaseDifficulty(currentDifficulty);
  reasoning = "Adjusting to easier level to build confidence.";
} else {
  nextDifficulty = currentDifficulty;
  reasoning = "Maintaining current difficulty level.";
}

// Category selection based on weaknesses
if (weaknesses.length > 0) {
  recommendedCategory = getMostFrequentWeakness(weaknesses);
} else {
  recommendedCategory = randomCategory(); // Continue learning
}
```

## AI-Powered Features

### Intelligent Reasoning
The agent generates explanations for question selection:
- **Performance Analysis** - "Based on your 85% average score..."
- **Difficulty Justification** - "I'm increasing difficulty because..."
- **Category Focus** - "Focusing on pivot tables to strengthen weak areas"
- **Encouragement** - "You're improving with each question!"

### Adaptive Feedback
Personalized feedback based on:
- **Current Performance** - Immediate score and analysis
- **Historical Context** - Comparison to previous answers
- **Learning Progress** - Recognition of improvement patterns
- **Motivational Elements** - Encouragement and guidance

## API Endpoints

### Agent Management
- `GET /api/agent/status` - Check agent availability
- `GET /api/agent/active-sessions` - List active interview sessions
- `POST /api/agent/save-memory` - Save agent memory to disk
- `GET /api/agent/load-memory/:sessionId` - Load agent memory
- `DELETE /api/agent/clear-memory/:sessionId` - Clear agent memory

### Performance Analysis
- `GET /api/agent/session/:sessionId/insights` - Get session insights
- `POST /api/agent/analyze-performance` - Analyze performance and get next question
- `POST /api/agent/generate-feedback` - Generate adaptive feedback

## Integration with State Machine

### Enhanced Interview Flow
1. **Question Generation** - Agent selects questions based on performance
2. **Answer Evaluation** - Enhanced evaluation with detailed scoring
3. **Memory Update** - Performance data saved to agent memory
4. **Adaptive Feedback** - Personalized feedback generated
5. **Next Question** - Agent selects next question with reasoning

### State Machine Integration
```javascript
// In askQuestionsNode
const adaptiveResult = await this.getAdaptiveQuestion(state, questions.length);
const { nextQuestion, reasoning, userProfile, nextDifficulty } = adaptiveResult;

// In evaluateNode
const adaptiveFeedback = await this.generateAdaptiveFeedback(state, evaluation);
```

## User Experience

### Real-time Adaptation
- **Immediate Feedback** - Adaptive feedback after each answer
- **Difficulty Indicators** - Visual indicators of difficulty changes
- **Progress Tracking** - Real-time performance metrics
- **Reasoning Display** - AI explanations for question selection

### Learning Continuity
- **Session Persistence** - Resume interviews with full context
- **Cross-session Learning** - Performance patterns remembered
- **Progressive Difficulty** - Gradual skill building
- **Personalized Path** - Unique learning journey for each user

## Example Adaptive Behavior

### Scenario: User Struggling with Formulas
1. **Initial State** - User starts with intermediate difficulty
2. **Poor Performance** - Scores 45% on VLOOKUP question
3. **Agent Analysis** - Identifies weakness in formulas category
4. **Adaptation** - Switches to beginner difficulty, focuses on formulas
5. **Feedback** - "Let's build your foundation with basic formula concepts"
6. **Next Question** - Beginner-level IF function question
7. **Improvement** - User scores 75% on IF function
8. **Agent Response** - "Great improvement! Let's try a slightly harder formula"
9. **Progression** - Gradually increases difficulty as performance improves

### Scenario: User Excelling
1. **Strong Performance** - User scores 90% on intermediate questions
2. **Agent Analysis** - Recognizes high performance pattern
3. **Adaptation** - Increases to advanced difficulty
4. **Feedback** - "You're mastering these concepts! Let's challenge you with advanced topics"
5. **Next Question** - Advanced array formula question
6. **Continued Success** - Maintains high performance at advanced level

## Technical Implementation

### Memory Management
- **LangChain BaseMemory** - Extends LangChain's memory framework
- **Chat History** - Maintains conversation context
- **Profile Tracking** - Comprehensive user performance data
- **Context Awareness** - Real-time adaptation based on current state

### Performance Optimization
- **Efficient Storage** - JSON-based persistence with compression
- **Memory Limits** - Keeps only recent answers (last 5) in context
- **Lazy Loading** - Memory loaded only when needed
- **Cleanup** - Automatic cleanup of old session data

### Error Handling
- **Graceful Degradation** - Falls back to static questions if agent fails
- **Memory Recovery** - Handles corrupted memory files
- **LLM Fallbacks** - Uses rule-based reasoning when LLM unavailable
- **Session Continuity** - Maintains interview flow even with errors

## Future Enhancements

### Advanced AI Features
- **Multi-turn Conversations** - Follow-up questions based on answers
- **Conceptual Learning** - Track understanding of Excel concepts
- **Skill Mapping** - Detailed skill progression tracking
- **Personalized Curriculum** - Custom learning paths

### Enhanced Memory
- **Long-term Learning** - Cross-session skill development
- **Pattern Recognition** - Identify learning styles and preferences
- **Predictive Adaptation** - Anticipate user needs
- **Collaborative Learning** - Learn from multiple users

### Advanced Analytics
- **Performance Dashboards** - Detailed analytics and insights
- **Learning Analytics** - Track learning effectiveness
- **A/B Testing** - Test different adaptation strategies
- **Recommendation Engine** - Suggest optimal learning paths

The agentic behavior system transforms the Excel interview from a static Q&A session into an intelligent, adaptive learning experience that grows with the user and provides personalized guidance throughout their Excel skill development journey.
