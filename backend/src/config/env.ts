import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the backend directory
// When compiled, __dirname will be in dist/config, so go up two levels
// When running with tsx, __dirname will be in src/config, so go up two levels
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

// Also try loading from process.cwd() as fallback (for different execution contexts)
if (result.error) {
  const fallbackPath = path.resolve(process.cwd(), '.env');
  const fallbackResult = dotenv.config({ path: fallbackPath });
  
  if (fallbackResult.error) {
    console.warn('⚠️  Warning: .env file not found. Using environment variables or defaults.');
    console.warn(`   Tried: ${envPath}`);
    console.warn(`   Tried: ${fallbackPath}`);
  }
}

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'MONGODB_URI', 'JWT_SECRET'];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error(`\n   Please create a .env file in the backend directory with these variables.`);
  console.error(`   Expected location: ${envPath}\n`);
}

export const env = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  googleOAuth: {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || '',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
};

// Log API key status (without exposing the key)
if (env.openaiApiKey) {
  const keyPreview = env.openaiApiKey.substring(0, 7) + '...' + env.openaiApiKey.substring(env.openaiApiKey.length - 4);
  console.log(`✅ OpenAI API Key loaded: ${keyPreview}`);
} else {
  console.error('❌ OpenAI API Key is missing! Please set OPENAI_API_KEY in your .env file.');
}
