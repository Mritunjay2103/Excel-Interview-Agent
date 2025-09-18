# Question Bank & Evaluation System

## Overview
The Mock Excel Interviewer now includes a comprehensive question bank with 15+ Excel questions across 5 categories and 3 difficulty levels, plus an advanced AI-powered evaluation system that rates answers on correctness, depth, and clarity.

## Question Bank Structure

### Categories
1. **Formulas & Functions** - VLOOKUP, IF, SUMIF, INDEX/MATCH, array formulas
2. **Pivot Tables & Data Analysis** - Basic pivot tables, calculated fields, grouping
3. **Charts & Visualization** - Chart types, customization, data visualization
4. **Data Management** - Data validation, cleaning, organization
5. **Advanced Features** - Macros, conditional formatting, Power Query

### Difficulty Levels
- **Beginner** (3 minutes/question) - Basic concepts and simple functions
- **Intermediate** (5 minutes/question) - Complex formulas and data analysis
- **Advanced** (7 minutes/question) - Advanced features and automation

### Question Format
Each question includes:
- **Question Text** - Clear, interview-style question
- **Expected Answer** - Reference answer with key concepts
- **Key Points** - Important concepts to cover
- **Example** - Practical example or use case
- **Time Limit** - Appropriate time based on difficulty

## Evaluation System

### Scoring Criteria (Weighted)
1. **Correctness (40%)** - Technical accuracy and understanding
2. **Depth (30%)** - Thoroughness and detail level
3. **Clarity (30%)** - Communication and explanation quality

### Evaluation Levels
- **Excellent (90-100)** - Comprehensive with examples and edge cases
- **Good (80-89)** - Detailed with good examples
- **Satisfactory (70-79)** - Adequate detail with basic examples
- **Needs Improvement (60-69)** - Surface level with minimal detail
- **Incorrect (0-59)** - Very brief or completely incorrect

### AI-Powered Features
- **Contextual Evaluation** - Uses question data (expected answer, key points, examples)
- **Detailed Feedback** - Specific strengths and improvement areas
- **Weighted Scoring** - Combines all criteria for final score
- **Fallback Handling** - Graceful degradation if JSON parsing fails

## Memory & Persistence

### Session Storage
- **Interview States** - Complete session state saved to disk
- **Evaluations** - Individual question evaluations stored separately
- **Summaries** - Final interview summaries persisted
- **Metadata** - Timestamps, progress, and statistics

### Data Structure
```json
{
  "sessionId": "interview_1234567890",
  "timestamp": 1234567890,
  "state": { /* complete interview state */ },
  "evaluations": [ /* individual evaluations */ ],
  "summary": "/* final summary */"
}
```

## API Endpoints

### Question Bank
- `GET /api/questions/stats` - Question bank statistics
- `GET /api/questions/categories` - Available categories and difficulties
- `GET /api/questions` - Get questions by criteria
- `POST /api/questions/generate` - Generate interview questions

### Enhanced Evaluation
- `POST /api/evaluation/evaluate` - Evaluate single answer
- `POST /api/evaluation/batch` - Batch evaluation of multiple answers

### Memory Management
- `POST /api/memory/save-session` - Save interview session
- `GET /api/memory/session/:id` - Load interview session
- `GET /api/memory/sessions` - Get all sessions
- `POST /api/memory/save-evaluation` - Save evaluation
- `GET /api/memory/session/:id/evaluations` - Get session evaluations
- `GET /api/memory/stats` - Memory usage statistics

## Example Questions

### Beginner - VLOOKUP
**Question:** "What is VLOOKUP and how do you use it?"
**Expected Answer:** "VLOOKUP is a function that searches for a value in the first column of a table and returns a value in the same row from a specified column. Syntax: VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])"
**Key Points:** lookup value, table array, column index, exact match, approximate match

### Intermediate - Pivot Tables
**Question:** "How do you add calculated fields to a pivot table?"
**Expected Answer:** "Right-click in the pivot table, select 'Calculated Field', enter a name and formula. The formula can reference other fields in the pivot table using field names in square brackets."
**Key Points:** calculated field, formula, field references, right-click menu, brackets

### Advanced - Array Formulas
**Question:** "What are array formulas and when would you use them?"
**Expected Answer:** "Array formulas perform calculations on multiple values simultaneously. They're useful for complex calculations that would require multiple regular formulas. Use Ctrl+Shift+Enter to enter them."
**Key Points:** array formulas, multiple values, complex calculations, ctrl+shift+enter, efficiency

## Evaluation Example

### Input
- **Question:** "What is VLOOKUP and how do you use it?"
- **User Answer:** "VLOOKUP looks up a value in a table and returns a corresponding value from another column. You need the lookup value, table range, column number, and whether to use exact match."

### Output
```json
{
  "correctness": {
    "score": 85,
    "level": "good",
    "feedback": "Good understanding of VLOOKUP concept with minor gaps in technical details."
  },
  "depth": {
    "score": 75,
    "level": "satisfactory",
    "feedback": "Adequate detail provided but could benefit from syntax example."
  },
  "clarity": {
    "score": 90,
    "level": "excellent",
    "feedback": "Answer is well-structured and easy to follow."
  },
  "overall": {
    "score": 83,
    "feedback": "Strong answer overall with good technical understanding.",
    "strengths": ["Clear explanation", "Good technical accuracy"],
    "improvements": ["Could include syntax example", "Mention range_lookup parameter"]
  }
}
```

## Integration with State Machine

The question bank and evaluation system are fully integrated with the LangGraph state machine:

1. **Question Generation** - State machine uses question bank service
2. **Answer Evaluation** - Enhanced evaluation service provides detailed scoring
3. **State Persistence** - Memory service saves all data throughout interview
4. **Progress Tracking** - Real-time updates on evaluation progress

## Future Enhancements

- **Custom Question Sets** - User-defined question categories
- **Adaptive Difficulty** - Dynamic difficulty based on performance
- **Question Analytics** - Track which questions are most/least answered correctly
- **Evaluation Templates** - Customizable evaluation criteria
- **Export Features** - Export evaluations and summaries to various formats
- **Question Recommendations** - Suggest questions based on weak areas
