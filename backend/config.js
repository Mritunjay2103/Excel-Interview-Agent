require('dotenv').config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY,
};

if (!config.openaiApiKey) {
  console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
  console.warn('Please set your OpenAI API key in the .env file or environment variables');
}

module.exports = config;
