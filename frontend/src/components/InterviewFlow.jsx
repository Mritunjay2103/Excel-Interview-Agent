import { useState, useEffect } from 'react';
import PerformanceReport from './PerformanceReport';

const InterviewFlow = ({ onClose }) => {
  const [interviewState, setInterviewState] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Start a new interview
  const startInterview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: 'Test Candidate',
          topic: 'Excel',
          difficulty: 'intermediate',
          totalQuestions: 3,
          timeLimit: 15
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setInterviewState(data.state);
        setSessionId(data.sessionId);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit an answer
  const submitAnswer = async () => {
    if (!answer.trim() || !interviewState || !sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/interview/${sessionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: interviewState,
          answer: answer.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setInterviewState(data.state);
        setAnswer('');
        
        // Check if interview is completed
        if (data.state.currentState === 'completed' || data.state.currentState === 'summary') {
          setShowSummary(true);
          // Show report after a short delay
          setTimeout(() => {
            setShowReport(true);
          }, 2000);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Continue to next step
  const continueInterview = async () => {
    if (!interviewState || !sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/interview/${sessionId}/continue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: interviewState
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setInterviewState(data.state);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Get current question
  const getCurrentQuestion = () => {
    if (!interviewState || !interviewState.questions) return null;
    return interviewState.questions[interviewState.currentQuestionIndex];
  };

  // Get progress percentage
  const getProgressPercentage = () => {
    if (!interviewState) return 0;
    return Math.round((interviewState.progress.questionsAnswered / interviewState.session.totalQuestions) * 100);
  };

  // Render different states
  const renderInterviewContent = () => {
    if (!interviewState) return null;

    const currentQuestion = getCurrentQuestion();
    const { currentState, progress, session } = interviewState;

    switch (currentState) {
      case 'intro':
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Welcome to the Excel Interview!</h3>
            <p className="text-gray-600 mb-6">{interviewState.ui.currentMessage}</p>
            <button
              onClick={continueInterview}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : 'Start Interview'}
            </button>
          </div>
        );

      case 'asking_questions':
        return (
          <div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Question {progress.questionsAsked + 1} of {session.totalQuestions}
                </span>
                <span className="text-sm text-gray-500">
                  {getProgressPercentage()}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {currentQuestion && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
                <div className="text-sm text-gray-600 mb-4">
                  <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                    {currentQuestion.difficulty}
                  </span>
                  <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                    {currentQuestion.category}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer:
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                  disabled={isLoading}
                />
              </div>
              
              <button
                onClick={submitAnswer}
                disabled={isLoading || !answer.trim()}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Submitting...' : 'Submit Answer'}
              </button>
            </div>
          </div>
        );

      case 'evaluating':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{interviewState.ui.currentMessage}</p>
          </div>
        );

      case 'summary':
      case 'completed':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4">Interview Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Questions:</span> {session.totalQuestions}
                </div>
                <div>
                  <span className="font-medium">Questions Answered:</span> {progress.questionsAnswered}
                </div>
                <div>
                  <span className="font-medium">Average Score:</span> {progress.averageScore.toFixed(1)}/100
                </div>
                <div>
                  <span className="font-medium">Total Score:</span> {progress.totalScore}/100
                </div>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div 
                className="whitespace-pre-wrap text-sm"
                dangerouslySetInnerHTML={{ 
                  __html: interviewState.ui.currentMessage.replace(/\n/g, '<br>') 
                }}
              />
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center text-red-600">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="mb-4">{interviewState.ui.errorMessage}</p>
            <button
              onClick={startInterview}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <p className="text-gray-600">Unknown state: {currentState}</p>
            <button
              onClick={continueInterview}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Excel Interview</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!interviewState ? (
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Ready to Start?</h3>
              <p className="text-gray-600 mb-6">
                This interview will test your Excel knowledge with 3 intermediate-level questions.
              </p>
              <button
                onClick={startInterview}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 text-lg"
              >
                {isLoading ? 'Starting Interview...' : 'Start Interview'}
              </button>
            </div>
          ) : (
            renderInterviewContent()
          )}
        </div>
      </div>
      
      {showReport && (
        <PerformanceReport 
          sessionId={sessionId} 
          onClose={() => setShowReport(false)} 
        />
      )}
    </div>
  );
};

export default InterviewFlow;
