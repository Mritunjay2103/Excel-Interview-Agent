import { useState, useEffect } from 'react';

const PerformanceReport = ({ sessionId, onClose }) => {
  const [report, setReport] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    loadReport();
  }, [sessionId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/reports/${sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        setReport(data.data.report);
        setTranscript(data.data.transcript);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating your performance report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Report</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report || !transcript) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6 text-center">
            <div className="text-gray-500 text-4xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Report Available</h3>
            <p className="text-gray-600 mb-4">The performance report is not available for this session.</p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Performance Report</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Candidate Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Candidate:</span>
                <p className="text-gray-800">{transcript.sessionInfo.candidateName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Session ID:</span>
                <p className="text-gray-800 font-mono text-xs">{sessionId}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Date:</span>
                <p className="text-gray-800">{new Date(transcript.sessionInfo.startTime).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Duration:</span>
                <p className="text-gray-800">{transcript.sessionInfo.duration} minutes</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['summary', 'breakdown', 'strengths', 'weaknesses', 'recommendations', 'transcript'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* Executive Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Executive Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-2xl font-bold ${getGradeColor(report.executiveSummary.overallGrade)}`}>
                        {report.executiveSummary.overallGrade}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Overall Grade</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(report.executiveSummary.totalScore)}`}>
                        {report.executiveSummary.totalScore}/100
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Total Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-800">
                        {transcript.summary.accuracy}%
                      </div>
                      <p className="text-sm text-gray-600 mt-2">Accuracy</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-800 mb-2">Key Highlights</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {report.executiveSummary.keyHighlights.map((highlight, index) => (
                        <li key={index}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Main Takeaway</h4>
                    <p className="text-gray-700">{report.executiveSummary.mainTakeaway}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-800">{transcript.summary.totalQuestions}</div>
                    <div className="text-sm text-gray-600">Questions</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-800">{transcript.summary.questionsAnswered}</div>
                    <div className="text-sm text-gray-600">Answered</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-800">{transcript.summary.correctAnswers}</div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-800">{transcript.sessionInfo.duration}m</div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'breakdown' && (
              <div className="space-y-6">
                {/* Performance by Category */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance by Category</h3>
                  <div className="space-y-4">
                    {Object.entries(report.performanceBreakdown.byCategory).map(([category, data]) => (
                      <div key={category} className="bg-white p-4 rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-800">{category}</h4>
                          <div className={`text-lg font-bold ${getScoreColor(data.score)}`}>
                            {data.score}/100
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {data.questions} question{data.questions !== 1 ? 's' : ''}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              data.score >= 80 ? 'bg-green-500' :
                              data.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${data.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance by Difficulty */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance by Difficulty</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(report.performanceBreakdown.byDifficulty).map(([difficulty, data]) => (
                      <div key={difficulty} className="bg-white p-4 rounded-lg border text-center">
                        <div className="text-sm text-gray-600 capitalize mb-1">{difficulty}</div>
                        <div className={`text-2xl font-bold ${getScoreColor(data.score)}`}>
                          {data.score}/100
                        </div>
                        <div className="text-xs text-gray-500">{data.questions} questions</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'strengths' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Strengths</h3>
                {report.strengths.length > 0 ? (
                  report.strengths.map((strength, index) => (
                    <div key={index} className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-start">
                        <div className="text-green-500 text-xl mr-3">✓</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-green-800 mb-1">{strength.category}</h4>
                          <p className="text-green-700 mb-2">{strength.description}</p>
                          <p className="text-sm text-green-600 mb-2">
                            <strong>Evidence:</strong> {strength.evidence}
                          </p>
                          <p className="text-sm text-green-600">
                            <strong>Recommendation:</strong> {strength.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No specific strengths identified in this interview.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'weaknesses' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Areas for Improvement</h3>
                {report.weaknesses.length > 0 ? (
                  report.weaknesses.map((weakness, index) => (
                    <div key={index} className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-start">
                        <div className="text-orange-500 text-xl mr-3">⚠</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-800 mb-1">{weakness.category}</h4>
                          <p className="text-orange-700 mb-2">{weakness.description}</p>
                          <p className="text-sm text-orange-600 mb-2">
                            <strong>Evidence:</strong> {weakness.evidence}
                          </p>
                          <p className="text-sm text-orange-600">
                            <strong>Recommendation:</strong> {weakness.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No specific weaknesses identified in this interview.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h3>
                
                {/* Immediate Recommendations */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Immediate Actions</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside text-blue-800 space-y-1">
                      {report.recommendations.immediate.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Long-term Recommendations */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Long-term Development</h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside text-green-800 space-y-1">
                      {report.recommendations.longTerm.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Recommended Resources</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {report.recommendations.resources.map((resource, index) => (
                        <li key={index}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Next Steps */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Next Steps</h4>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-purple-800">Priority:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          report.nextSteps.priority === 'high' ? 'bg-red-100 text-red-800' :
                          report.nextSteps.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {report.nextSteps.priority}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-purple-800">Timeline:</span>
                        <span className="ml-2 text-purple-700">{report.nextSteps.timeline}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-medium text-purple-800">Focus Areas:</span>
                        <span className="ml-2 text-purple-700">{report.nextSteps.focusAreas.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Interview Transcript</h3>
                <div className="space-y-6">
                  {transcript.questions.map((q, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border">
                      <div className="mb-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800">Question {q.questionNumber}</h4>
                          <div className="text-sm text-gray-500">
                            {q.category} • {q.difficulty}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{q.question}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-600 mb-2">Your Answer:</h5>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded">{q.userAnswer}</p>
                      </div>
                      
                      {q.evaluation && (
                        <div className="border-t pt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="text-center">
                              <div className={`text-lg font-bold ${getScoreColor(q.evaluation.overallScore)}`}>
                                {q.evaluation.overallScore}/100
                              </div>
                              <div className="text-xs text-gray-500">Overall</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-sm font-bold ${getScoreColor(q.evaluation.correctness.score)}`}>
                                {q.evaluation.correctness.score}/100
                              </div>
                              <div className="text-xs text-gray-500">Correctness</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-sm font-bold ${getScoreColor(q.evaluation.depth.score)}`}>
                                {q.evaluation.depth.score}/100
                              </div>
                              <div className="text-xs text-gray-500">Depth</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-sm font-bold ${getScoreColor(q.evaluation.clarity.score)}`}>
                                {q.evaluation.clarity.score}/100
                              </div>
                              <div className="text-xs text-gray-500">Clarity</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <strong>Feedback:</strong> {q.evaluation.feedback}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Report generated on {new Date(report.metadata?.generatedAt || Date.now()).toLocaleString()}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => window.print()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                Print Report
              </button>
              <button
                onClick={onClose}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReport;
