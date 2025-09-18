# 🎯 Mock Excel Interviewer

  
  **Complete Excel interview system with adaptive AI agent, performance reports, and comprehensive evaluation!**

  <div align="center">
    
  [![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18.0.0-green.svg)](https://nodejs.org/)
  [![LangChain](https://img.shields.io/badge/LangChain-0.1.0-orange.svg)](https://langchain.com/)
  [![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-purple.svg)](https://openai.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC.svg)](https://tailwindcss.com/)


  <img width="863" height="924" alt="image" src="https://github.com/user-attachments/assets/72180a8b-1397-4164-89f3-f87dd7006117" />
  
</div>

## 🚀 Features

### 🤖 **Adaptive AI Agent**
- **Dynamic Question Selection**: AI agent analyzes performance and selects harder/easier questions
- **LangChain Memory**: Persistent user context across interview sessions
- **Performance Tracking**: Real-time analysis of strengths and weaknesses
- **Adaptive Feedback**: Personalized feedback based on user responses

### 📊 **Comprehensive Evaluation System**
- **Multi-Criteria Scoring**: Correctness, Depth, and Clarity evaluation
- **AI-Powered Assessment**: GPT-4 powered answer evaluation
- **Weighted Scoring**: Customizable scoring weights for different criteria
- **Detailed Feedback**: Specific feedback for each answer

### 📝 **Performance Reports**
- **Executive Summary**: High-level performance overview
- **Detailed Analysis**: Category-wise performance breakdown
- **Strengths & Weaknesses**: AI-identified areas of improvement
- **Recommendations**: Actionable next steps for skill development
- **Interview Transcript**: Complete conversation history

### 🎯 **Excel-Focused Question Bank**
- **50+ Questions**: Comprehensive Excel knowledge coverage
- **Multiple Categories**: Formulas, Pivot Tables, Charts, VBA, etc.
- **Difficulty Levels**: Beginner, Intermediate, Advanced
- **Real-World Scenarios**: Practical Excel use cases

## 🏗️ Architecture

### **Frontend** (React + Tailwind CSS)
- Modern, responsive UI with Tailwind CSS
- Real-time interview flow management
- Interactive performance reports
- System status monitoring

### **Backend** (Node.js + Express)
- RESTful API endpoints
- LangGraph state machine for interview flow
- OpenAI GPT-4 integration
- In-memory data persistence

### **AI Services**
- **LLM Service**: OpenAI GPT-4 integration via LangChain
- **Interview State Machine**: LangGraph-based interview flow
- **Question Bank Service**: Dynamic question selection
- **Evaluation Service**: AI-powered answer assessment
- **Memory Service**: Session persistence and storage
- **Adaptive Agent**: Dynamic question selection and feedback
- **Report Generator**: Performance report creation

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18.0.0 or higher
- pnpm package manager
- OpenAI API key

### 1. Clone the Repository
```bash
git clone https://github.com/Mritunjay2103/Excel-Interview-Agent.git
cd Excel-Interview-Agent
```

### 2. Install Dependencies
```bash
# Install root dependencies
pnpm install

# Install backend dependencies
cd backend
pnpm install

# Install frontend dependencies
cd ../frontend
pnpm install
```

### 3. Environment Setup
Create a `.env` file in the `backend` directory:
```bash
cd backend
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

### 4. Start the Application
```bash
# From the root directory
pnpm dev
```

This will start both frontend (http://localhost:5173) and backend (http://localhost:5000) servers.

## 🎮 Usage

### Starting an Interview
1. Open http://localhost:5173 in your browser
2. Verify all services are running (green checkmarks)
3. Click "Start Adaptive Excel Interview"
4. Follow the interview flow:
   - **Intro**: Welcome and instructions
   - **Questions**: Answer Excel-related questions
   - **Evaluation**: AI evaluates your responses
   - **Summary**: View your performance report

### Interview Flow
```
Intro → Ask Questions → Collect Answers → Evaluate → Summary
```

### System Status
The application shows real-time status of all services:
- ✅ **Frontend**: React + Tailwind CSS
- ✅ **Backend**: Node.js + Express
- ✅ **LLM Service**: LangChain + OpenAI
- ✅ **Interview State Machine**: LangGraph + State Management
- ✅ **Question Bank**: Excel Questions + Categories
- ✅ **Evaluation Service**: AI Scoring + Feedback
- ✅ **Memory Service**: State Persistence + Storage
- ✅ **Adaptive Agent**: AI Memory + Dynamic Question Selection
- ✅ **Report Generator**: Performance Reports + Transcripts

## 📁 Project Structure

```
mock-excel-interviewer/
├── backend/
│   ├── services/
│   │   ├── llmService.js              # OpenAI integration
│   │   ├── interviewStateMachine.js   # LangGraph state machine
│   │   ├── questionBankService.js     # Question management
│   │   ├── evaluationService.js       # Answer evaluation
│   │   ├── memoryService.js           # Data persistence
│   │   ├── adaptiveAgent.js           # AI agent logic
│   │   └── reportGeneratorService.js  # Report generation
│   ├── data/
│   │   └── questionBank.json          # Excel questions database
│   ├── types/
│   │   └── interviewState.js          # Zod schemas
│   ├── config.js                      # Configuration
│   └── server.js                      # Express server
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InterviewFlow.jsx      # Main interview UI
│   │   │   └── PerformanceReport.jsx  # Report display
│   │   ├── App.jsx                    # Main app component
│   │   └── index.css                  # Tailwind CSS
│   └── package.json
├── package.json                       # Root package.json
└── README.md
```

## 🔧 API Endpoints

### Interview Management
- `POST /api/interview/start` - Start new interview
- `GET /api/interview/:sessionId/state` - Get interview state
- `POST /api/interview/:sessionId/answer` - Submit answer
- `POST /api/interview/:sessionId/continue` - Continue interview
- `GET /api/interview/:sessionId/summary` - Get interview summary

### Question Bank
- `GET /api/questions` - Get all questions
- `GET /api/questions/categories` - Get question categories
- `GET /api/questions/stats` - Get question statistics
- `POST /api/questions/generate` - Generate custom questions

### Evaluation
- `POST /api/evaluation/evaluate` - Evaluate single answer
- `POST /api/evaluation/batch` - Evaluate multiple answers

### Memory & Persistence
- `POST /api/memory/save-session` - Save interview session
- `GET /api/memory/session/:sessionId` - Get session data
- `GET /api/memory/sessions` - Get all sessions
- `POST /api/memory/save-evaluation` - Save evaluation

### Adaptive Agent
- `GET /api/agent/session/:sessionId/insights` - Get performance insights
- `POST /api/agent/analyze-performance` - Analyze performance
- `POST /api/agent/generate-feedback` - Generate adaptive feedback
- `GET /api/agent/active-sessions` - Get active sessions

### Report Generation
- `POST /api/reports/generate` - Generate performance report
- `GET /api/reports/:sessionId` - Get report by session
- `GET /api/reports` - Get all reports
- `GET /api/reports/:sessionId/summary` - Get report summary

## 🎯 Question Categories

### **Formulas & Functions**
- Basic arithmetic operations
- VLOOKUP, HLOOKUP, INDEX/MATCH
- IF statements and logical functions
- Date and time functions
- Text manipulation functions

### **Data Analysis**
- Pivot Tables creation and manipulation
- Data filtering and sorting
- Conditional formatting
- Data validation
- Charts and graphs

### **Advanced Excel**
- VBA programming basics
- Macros and automation
- Power Query and Power Pivot
- Advanced charting techniques
- Data modeling

### **Practical Scenarios**
- Financial modeling
- Data cleaning and preparation
- Dashboard creation
- Report automation
- Collaboration features

## 🧠 AI Evaluation Criteria

### **Correctness (40%)**
- Technical accuracy of the answer
- Proper use of Excel terminology
- Correct formula syntax and logic

### **Depth (35%)**
- Comprehensive coverage of the topic
- Understanding of underlying concepts
- Ability to explain complex scenarios

### **Clarity (25%)**
- Clear and organized explanation
- Logical flow of information
- Easy to understand language

## 🚀 Deployment

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
NODE_ENV=production
```

### Production Build
```bash
# Build frontend
cd frontend
pnpm build

# Start backend
cd ../backend
pnpm start
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LangChain](https://langchain.com/) for AI framework
- [OpenAI](https://openai.com/) for GPT-4 API
- [React](https://reactjs.org/) for frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [LangGraph](https://langchain-ai.github.io/langgraphjs/) for state management

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the API endpoints documentation

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/Mritunjay2103">Mritunjay2103</a></p>
  <p>⭐ Star this repository if you found it helpful!</p>
</div>
