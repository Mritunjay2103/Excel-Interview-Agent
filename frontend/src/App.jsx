import { useState, useEffect } from 'react'
import InterviewFlow from './components/InterviewFlow'

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [llmStatus, setLlmStatus] = useState('Checking...')
  const [interviewStatus, setInterviewStatus] = useState('Checking...')
  const [questionBankStatus, setQuestionBankStatus] = useState('Checking...')
  const [evaluationStatus, setEvaluationStatus] = useState('Checking...')
  const [memoryStatus, setMemoryStatus] = useState('Checking...')
  const [adaptiveAgentStatus, setAdaptiveAgentStatus] = useState('Checking...')
  const [reportGeneratorStatus, setReportGeneratorStatus] = useState('Checking...')
  const [chatMessage, setChatMessage] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showInterview, setShowInterview] = useState(false)

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(response => response.json())
      .then(data => {
        setBackendStatus(data.message)
        setLlmStatus(data.llmAvailable ? 'Available ✅' : 'Not Available ❌')
        setInterviewStatus(data.interviewStateMachineAvailable ? 'Available ✅' : 'Not Available ❌')
        setQuestionBankStatus(data.questionBankAvailable ? 'Available ✅' : 'Not Available ❌')
        setEvaluationStatus(data.evaluationServiceAvailable ? 'Available ✅' : 'Not Available ❌')
        setMemoryStatus(data.memoryServiceAvailable ? 'Available ✅' : 'Not Available ❌')
        setAdaptiveAgentStatus(data.adaptiveAgentAvailable ? 'Available ✅' : 'Not Available ❌')
        setReportGeneratorStatus(data.reportGeneratorAvailable ? 'Available ✅' : 'Not Available ❌')
      })
      .catch(() => {
        setBackendStatus('Backend not connected')
        setLlmStatus('Unknown')
        setInterviewStatus('Unknown')
        setQuestionBankStatus('Unknown')
        setEvaluationStatus('Unknown')
        setMemoryStatus('Unknown')
        setAdaptiveAgentStatus('Unknown')
        setReportGeneratorStatus('Unknown')
      })
  }, [])

  const handleChat = async (e) => {
    e.preventDefault()
    if (!chatMessage.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/llm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: chatMessage }),
      })
      
      const data = await response.json()
      if (data.success) {
        setChatResponse(data.content)
      } else {
        setChatResponse(`Error: ${data.error}`)
      }
    } catch (error) {
      setChatResponse(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Mock Excel Interviewer
        </h1>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">System Status</h2>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800">Frontend</h3>
                <p className="text-blue-600">React + Tailwind CSS</p>
                <p className="text-sm text-blue-500">Status: Running ✅</p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">Backend</h3>
                <p className="text-green-600">Node.js + Express</p>
                <p className="text-sm text-green-500">Status: {backendStatus}</p>
              </div>

              <div className={`p-3 rounded-lg ${llmStatus.includes('Available') ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`font-semibold ${llmStatus.includes('Available') ? 'text-green-800' : 'text-red-800'}`}>
                  LLM Service
                </h3>
                <p className={llmStatus.includes('Available') ? 'text-green-600' : 'text-red-600'}>
                  LangChain + OpenAI
                </p>
                <p className={`text-sm ${llmStatus.includes('Available') ? 'text-green-500' : 'text-red-500'}`}>
                  Status: {llmStatus}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${interviewStatus.includes('Available') ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`font-semibold ${interviewStatus.includes('Available') ? 'text-green-800' : 'text-red-800'}`}>
                  Interview State Machine
                </h3>
                <p className={interviewStatus.includes('Available') ? 'text-green-600' : 'text-red-600'}>
                  LangGraph + State Management
                </p>
                <p className={`text-sm ${interviewStatus.includes('Available') ? 'text-green-500' : 'text-red-500'}`}>
                  Status: {interviewStatus}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${questionBankStatus.includes('Available') ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`font-semibold ${questionBankStatus.includes('Available') ? 'text-green-800' : 'text-red-800'}`}>
                  Question Bank
                </h3>
                <p className={questionBankStatus.includes('Available') ? 'text-green-600' : 'text-red-600'}>
                  Excel Questions + Categories
                </p>
                <p className={`text-sm ${questionBankStatus.includes('Available') ? 'text-green-500' : 'text-red-500'}`}>
                  Status: {questionBankStatus}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${evaluationStatus.includes('Available') ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`font-semibold ${evaluationStatus.includes('Available') ? 'text-green-800' : 'text-red-800'}`}>
                  Evaluation Service
                </h3>
                <p className={evaluationStatus.includes('Available') ? 'text-green-600' : 'text-red-600'}>
                  AI Scoring + Feedback
                </p>
                <p className={`text-sm ${evaluationStatus.includes('Available') ? 'text-green-500' : 'text-red-500'}`}>
                  Status: {evaluationStatus}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${memoryStatus.includes('Available') ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`font-semibold ${memoryStatus.includes('Available') ? 'text-green-800' : 'text-red-800'}`}>
                  Memory Service
                </h3>
                <p className={memoryStatus.includes('Available') ? 'text-green-600' : 'text-red-600'}>
                  State Persistence + Storage
                </p>
                <p className={`text-sm ${memoryStatus.includes('Available') ? 'text-green-500' : 'text-red-500'}`}>
                  Status: {memoryStatus}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${adaptiveAgentStatus.includes('Available') ? 'bg-purple-50' : 'bg-red-50'}`}>
                <h3 className={`font-semibold ${adaptiveAgentStatus.includes('Available') ? 'text-purple-800' : 'text-red-800'}`}>
                  Adaptive Agent
                </h3>
                <p className={adaptiveAgentStatus.includes('Available') ? 'text-purple-600' : 'text-red-600'}>
                  AI Memory + Dynamic Question Selection
                </p>
                <p className={`text-sm ${adaptiveAgentStatus.includes('Available') ? 'text-purple-500' : 'text-red-500'}`}>
                  Status: {adaptiveAgentStatus}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${reportGeneratorStatus.includes('Available') ? 'bg-indigo-50' : 'bg-red-50'}`}>
                <h3 className={`font-semibold ${reportGeneratorStatus.includes('Available') ? 'text-indigo-800' : 'text-red-800'}`}>
                  Report Generator
                </h3>
                <p className={reportGeneratorStatus.includes('Available') ? 'text-indigo-600' : 'text-red-600'}>
                  Performance Reports + Transcripts
                </p>
                <p className={`text-sm ${reportGeneratorStatus.includes('Available') ? 'text-indigo-500' : 'text-red-500'}`}>
                  Status: {reportGeneratorStatus}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">LLM Chat Test</h2>
            
            <form onSubmit={handleChat} className="space-y-4">
      <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test the LLM:
                </label>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask something about Excel..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
      </div>
              
              <button
                type="submit"
                disabled={isLoading || !chatMessage.trim()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Message'}
        </button>
            </form>

            {chatResponse && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-700 mb-2">Response:</h4>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{chatResponse}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Complete Excel interview system with adaptive AI agent, performance reports, and comprehensive evaluation! 
            {!interviewStatus.includes('Available') && ' Set your OPENAI_API_KEY to enable all features.'}
          </p>
          
          {interviewStatus.includes('Available') && questionBankStatus.includes('Available') && evaluationStatus.includes('Available') && adaptiveAgentStatus.includes('Available') && reportGeneratorStatus.includes('Available') && (
            <button
              onClick={() => setShowInterview(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 text-lg font-semibold shadow-lg"
            >
              🎯 Start Adaptive Excel Interview
            </button>
          )}
        </div>
      </div>
      
      {showInterview && (
        <InterviewFlow onClose={() => setShowInterview(false)} />
      )}
    </div>
  )
}

export default App
