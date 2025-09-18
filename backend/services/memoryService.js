const fs = require('fs');
const path = require('path');

class MemoryService {
  constructor() {
    this.memoryDir = path.join(__dirname, '../data/memory');
    this.ensureMemoryDir();
  }

  ensureMemoryDir() {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  // Save interview session to memory
  async saveInterviewSession(sessionId, interviewState) {
    try {
      const filePath = path.join(this.memoryDir, `session_${sessionId}.json`);
      const sessionData = {
        sessionId,
        timestamp: Date.now(),
        state: interviewState,
        metadata: {
          version: '1.0',
          savedAt: new Date().toISOString()
        }
      };
      
      fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
      console.log(`✅ Interview session ${sessionId} saved to memory`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save interview session:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Load interview session from memory
  async loadInterviewSession(sessionId) {
    try {
      const filePath = path.join(this.memoryDir, `session_${sessionId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Session not found' };
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      const sessionData = JSON.parse(data);
      
      console.log(`✅ Interview session ${sessionId} loaded from memory`);
      return { success: true, data: sessionData };
    } catch (error) {
      console.error('❌ Failed to load interview session:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Save evaluation results
  async saveEvaluation(sessionId, questionId, evaluation) {
    try {
      const evaluationData = {
        sessionId,
        questionId,
        evaluation,
        timestamp: Date.now(),
        metadata: {
          version: '1.0',
          savedAt: new Date().toISOString()
        }
      };
      
      const filePath = path.join(this.memoryDir, `evaluation_${sessionId}_${questionId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(evaluationData, null, 2));
      
      console.log(`✅ Evaluation saved for session ${sessionId}, question ${questionId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save evaluation:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Load evaluation results
  async loadEvaluation(sessionId, questionId) {
    try {
      const filePath = path.join(this.memoryDir, `evaluation_${sessionId}_${questionId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Evaluation not found' };
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      const evaluationData = JSON.parse(data);
      
      return { success: true, data: evaluationData };
    } catch (error) {
      console.error('❌ Failed to load evaluation:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get all evaluations for a session
  async getSessionEvaluations(sessionId) {
    try {
      const files = fs.readdirSync(this.memoryDir);
      const evaluationFiles = files.filter(file => 
        file.startsWith(`evaluation_${sessionId}_`) && file.endsWith('.json')
      );
      
      const evaluations = [];
      
      for (const file of evaluationFiles) {
        const filePath = path.join(this.memoryDir, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const evaluationData = JSON.parse(data);
        evaluations.push(evaluationData);
      }
      
      return { success: true, evaluations };
    } catch (error) {
      console.error('❌ Failed to get session evaluations:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Save interview summary
  async saveInterviewSummary(sessionId, summary) {
    try {
      const summaryData = {
        sessionId,
        summary,
        timestamp: Date.now(),
        metadata: {
          version: '1.0',
          savedAt: new Date().toISOString()
        }
      };
      
      const filePath = path.join(this.memoryDir, `summary_${sessionId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(summaryData, null, 2));
      
      console.log(`✅ Interview summary saved for session ${sessionId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save interview summary:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Load interview summary
  async loadInterviewSummary(sessionId) {
    try {
      const filePath = path.join(this.memoryDir, `summary_${sessionId}.json`);
      
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Summary not found' };
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      const summaryData = JSON.parse(data);
      
      return { success: true, data: summaryData };
    } catch (error) {
      console.error('❌ Failed to load interview summary:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get all sessions
  async getAllSessions() {
    try {
      const files = fs.readdirSync(this.memoryDir);
      const sessionFiles = files.filter(file => 
        file.startsWith('session_') && file.endsWith('.json')
      );
      
      const sessions = [];
      
      for (const file of sessionFiles) {
        const filePath = path.join(this.memoryDir, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const sessionData = JSON.parse(data);
        sessions.push({
          sessionId: sessionData.sessionId,
          timestamp: sessionData.timestamp,
          state: sessionData.state.currentState,
          progress: sessionData.state.progress,
          metadata: sessionData.metadata
        });
      }
      
      // Sort by timestamp (newest first)
      sessions.sort((a, b) => b.timestamp - a.timestamp);
      
      return { success: true, sessions };
    } catch (error) {
      console.error('❌ Failed to get all sessions:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Delete session and related data
  async deleteSession(sessionId) {
    try {
      const files = fs.readdirSync(this.memoryDir);
      const sessionFiles = files.filter(file => file.includes(sessionId));
      
      for (const file of sessionFiles) {
        const filePath = path.join(this.memoryDir, file);
        fs.unlinkSync(filePath);
      }
      
      console.log(`✅ Session ${sessionId} and related data deleted`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete session:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get memory statistics
  async getMemoryStats() {
    try {
      const files = fs.readdirSync(this.memoryDir);
      const stats = {
        totalFiles: files.length,
        sessionFiles: files.filter(f => f.startsWith('session_')).length,
        evaluationFiles: files.filter(f => f.startsWith('evaluation_')).length,
        summaryFiles: files.filter(f => f.startsWith('summary_')).length,
        totalSize: 0
      };
      
      // Calculate total size
      for (const file of files) {
        const filePath = path.join(this.memoryDir, file);
        const stat = fs.statSync(filePath);
        stats.totalSize += stat.size;
      }
      
      stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
      
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Failed to get memory stats:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Clean up old sessions (older than specified days)
  async cleanupOldSessions(daysOld = 30) {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      const files = fs.readdirSync(this.memoryDir);
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.memoryDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      console.log(`✅ Cleaned up ${deletedCount} old files`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('❌ Failed to cleanup old sessions:', error.message);
      return { success: false, error: error.message };
    }
  }

  isAvailable() {
    return fs.existsSync(this.memoryDir);
  }
}

module.exports = new MemoryService();
