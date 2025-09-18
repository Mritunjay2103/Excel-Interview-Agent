# Backend - Mock Excel Interviewer

Node.js/Express backend with LangChain and OpenAI integration.

## Environment Setup

1. Create a `.env` file in the backend directory:
```bash
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
```

2. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

3. Replace `your_openai_api_key_here` with your actual API key

## API Endpoints

### Health & Status
- `GET /api/health` - Server health check
- `GET /api/llm/status` - LLM service status

### LLM Endpoints
- `POST /api/llm/chat` - General chat with LLM
- `POST /api/llm/generate-questions` - Generate Excel interview questions
- `POST /api/llm/evaluate-answer` - Evaluate user answers

### Example Usage

**Generate Questions:**
```bash
curl -X POST http://localhost:5000/api/llm/generate-questions \
  -H "Content-Type: application/json" \
  -d '{"topic": "VLOOKUP", "difficulty": "intermediate", "count": 3}'
```

**Evaluate Answer:**
```bash
curl -X POST http://localhost:5000/api/llm/evaluate-answer \
  -H "Content-Type: application/json" \
  -d '{"question": "What is VLOOKUP?", "userAnswer": "VLOOKUP is a function that searches for a value in the first column of a table and returns a value in the same row from a specified column."}'
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start production server
pnpm start
```
