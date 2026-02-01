import app from './app';
import { connectDatabase } from './database/connectDatabase';
import { env } from './config/env';

const startServer = async () => {
  try {
    // Validate critical environment variables
    if (!env.openaiApiKey) {
      console.error('❌ Cannot start server: OPENAI_API_KEY is missing!');
      console.error('   Please add OPENAI_API_KEY to your .env file in the backend directory.');
      process.exit(1);
    }

    if (!env.mongodbUri) {
      console.error('❌ Cannot start server: MONGODB_URI is missing!');
      console.error('   Please add MONGODB_URI to your .env file in the backend directory.');
      process.exit(1);
    }

    if (!env.jwtSecret) {
      console.error('❌ Cannot start server: JWT_SECRET is missing!');
      console.error('   Please add JWT_SECRET to your .env file in the backend directory.');
      process.exit(1);
    }

    // Connect to MongoDB
    await connectDatabase();

    // Start server
    app.listen(env.port, () => {
      console.log(`🚀 Server running on port ${env.port}`);
      console.log(`📝 Environment: ${env.nodeEnv}`);
      console.log(`🔗 API: http://localhost:${env.port}/api/v1`);
      console.log(`🔑 OpenAI API Key: ${env.openaiApiKey ? '✅ Set' : '❌ Missing'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
