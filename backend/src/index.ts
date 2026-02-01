import app from './app';
import { connectDatabase } from './database/connectDatabase';
import { env } from './config/env';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start server
    app.listen(env.port, () => {
      console.log(`🚀 Server running on port ${env.port}`);
      console.log(`📝 Environment: ${env.nodeEnv}`);
      console.log(`🔗 API: http://localhost:${env.port}/api/v1`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
