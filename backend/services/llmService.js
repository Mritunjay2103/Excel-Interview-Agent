const { ChatOpenAI } = require('@langchain/openai');
const config = require('../config');

class LLMService {
  constructor() {
    this.llm = null;
    this.initializeLLM();
  }

  initializeLLM() {
    if (!config.openaiApiKey) {
      console.warn('OpenAI API key not configured. LLM service will not be available.');
      return;
    }

    try {
      this.llm = new ChatOpenAI({
        apiKey: config.openaiApiKey,
        modelName: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
      });
      console.log('✅ LLM service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize LLM service:', error.message);
    }
  }

  async generateResponse(prompt, options = {}) {
    if (!this.llm) {
      throw new Error('LLM service not initialized. Please check your OpenAI API key.');
    }

    try {
      const response = await this.llm.invoke(prompt);
      return {
        success: true,
        content: response.content,
        usage: response.response_metadata?.usage || null,
      };
    } catch (error) {
      console.error('LLM generation error:', error);
      return {
        success: false,
        error: error.message,
        content: null,
      };
    }
  }

  async generateExcelInterviewQuestions(topic, difficulty = 'intermediate', count = 5) {
    const prompt = `Generate ${count} Excel interview questions about "${topic}" at ${difficulty} difficulty level. 
    
    Format the response as a JSON array where each question has:
    - question: The interview question
    - difficulty: ${difficulty}
    - category: The Excel feature/function being tested
    - expectedAnswer: A brief expected answer or key points
    
    Make the questions practical and relevant to real-world Excel usage.`;

    const response = await this.generateResponse(prompt);
    
    if (response.success) {
      try {
        const questions = JSON.parse(response.content);
        return {
          success: true,
          questions: questions,
          metadata: {
            topic,
            difficulty,
            count: questions.length,
          },
        };
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse LLM response as JSON',
          content: response.content,
        };
      }
    }

    return response;
  }

  async evaluateAnswer(question, userAnswer) {
    const prompt = `Evaluate this Excel interview answer:

    Question: ${question}
    User Answer: ${userAnswer}

    Provide a JSON response with:
    - score: A number from 0-100
    - feedback: Constructive feedback on the answer
    - strengths: Array of what the user did well
    - improvements: Array of areas for improvement
    - isCorrect: Boolean indicating if the answer is fundamentally correct

    Be encouraging but honest in your evaluation.`;

    const response = await this.generateResponse(prompt);
    
    if (response.success) {
      try {
        const evaluation = JSON.parse(response.content);
        return {
          success: true,
          evaluation: evaluation,
        };
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse evaluation response as JSON',
          content: response.content,
        };
      }
    }

    return response;
  }

  isAvailable() {
    return this.llm !== null;
  }
}

module.exports = new LLMService();
