# Interview Flow - State Machine Documentation

## Overview
The Mock Excel Interviewer uses LangGraph to implement a sophisticated state machine that manages the complete interview process from start to finish.

## State Machine Flow

```
┌─────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐    ┌─────────┐
│  IDLE   │───▶│    INTRO     │───▶│ASK_QUESTIONS│───▶│EVALUATE  │───▶│ SUMMARY │
└─────────┘    └──────────────┘    └─────────────┘    └──────────┘    └─────────┘
                      │                     │              │              │
                      │                     ▼              │              │
                      │              ┌─────────────┐       │              │
                      │              │COLLECT_ANSWERS│      │              │
                      │              └─────────────┘       │              │
                      │                     │              │              │
                      │                     └──────────────┘              │
                      │                                                   │
                      └───────────────────────────────────────────────────┘
```

## State Definitions

### 1. **IDLE** 
- Initial state
- No active interview session
- Transitions to: `INTRO`

### 2. **INTRO**
- Welcome message and interview setup
- Displays interview parameters (topic, difficulty, question count)
- Waits for user confirmation to start
- Transitions to: `ASK_QUESTIONS`

### 3. **ASK_QUESTIONS**
- Generates or retrieves interview questions
- Displays current question to user
- Manages question progression
- Transitions to: `COLLECT_ANSWERS`

### 4. **COLLECT_ANSWERS**
- Waits for user to submit their answer
- Validates answer input
- Stores answer in state
- Transitions to: `EVALUATE`

### 5. **EVALUATE**
- Uses LLM to evaluate the submitted answer
- Generates score, feedback, and analysis
- Updates progress tracking
- Transitions to: `ASK_QUESTIONS` (if more questions) or `SUMMARY` (if complete)

### 6. **SUMMARY**
- Generates comprehensive interview summary
- Displays final results and recommendations
- Calculates overall performance metrics
- Transitions to: `COMPLETED`

### 7. **COMPLETED**
- Final state
- Interview session finished
- Results available for review

### 8. **ERROR**
- Handles any errors that occur during the process
- Provides error recovery options
- Transitions to: `IDLE` or `INTRO`

## Key Features

### State Management
- **Persistent State**: All interview data is maintained throughout the session
- **Progress Tracking**: Real-time updates on questions asked, answered, and evaluated
- **Error Handling**: Graceful error recovery with user-friendly messages

### LLM Integration
- **Question Generation**: Dynamic question creation based on topic and difficulty
- **Answer Evaluation**: AI-powered scoring and feedback generation
- **Summary Generation**: Comprehensive interview analysis and recommendations

### User Experience
- **Real-time Updates**: Live progress indicators and status updates
- **Interactive Interface**: Smooth transitions between interview phases
- **Responsive Design**: Works across different screen sizes

## API Endpoints

### Interview Management
- `POST /api/interview/start` - Start a new interview session
- `GET /api/interview/:sessionId/state` - Get current interview state
- `POST /api/interview/:sessionId/answer` - Submit an answer
- `POST /api/interview/:sessionId/continue` - Continue to next step
- `GET /api/interview/:sessionId/summary` - Get interview summary
- `GET /api/interview/status` - Check state machine availability

## Data Flow

1. **Session Creation**: User starts interview with parameters
2. **Question Generation**: LLM generates questions based on topic/difficulty
3. **Answer Collection**: User submits answers through UI
4. **Answer Evaluation**: LLM evaluates each answer with scoring
5. **Progress Tracking**: State updates with progress metrics
6. **Summary Generation**: Final comprehensive analysis
7. **Results Display**: Complete interview results shown to user

## Error Handling

- **API Failures**: Graceful degradation when LLM services unavailable
- **Invalid Input**: Validation and user feedback for incorrect inputs
- **State Corruption**: Recovery mechanisms for invalid state transitions
- **Network Issues**: Retry logic and offline handling

## Configuration

The state machine can be configured with:
- **Question Count**: Number of questions per interview
- **Difficulty Level**: beginner, intermediate, advanced
- **Topic Focus**: Specific Excel areas to focus on
- **Time Limits**: Per-question and total interview time limits
- **Evaluation Criteria**: Custom scoring and feedback parameters

## Future Enhancements

- **Multi-turn Conversations**: Follow-up questions based on answers
- **Adaptive Difficulty**: Dynamic difficulty adjustment based on performance
- **Session Persistence**: Save and resume interview sessions
- **Analytics Dashboard**: Detailed performance analytics and insights
- **Custom Question Banks**: User-defined question sets and categories
