# OpenAI Interaction Backend

Express TypeScript backend for multi-modal AI interactions using OpenAI API.

## Features

- **Text Generation** - Generate text responses with streaming support
- **Image Analysis** - Analyze images using vision models
- **Image Generation** - Generate images from text prompts
- **Text-to-Speech** - Convert text to natural-sounding speech
- **Speech-to-Text** - Transcribe audio to text
- **Conversation Management** - Save and manage conversation history
- **Authentication** - JWT-based auth with Google OAuth SSO
- **Real-time Streaming** - Server-sent events for streaming responses

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

3. Run development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - Google OAuth callback

### AI Interactions
- `POST /api/v1/ai/text` - Generate text response
- `POST /api/v1/ai/text/stream` - Stream text response
- `POST /api/v1/ai/image/analyze` - Analyze image
- `POST /api/v1/ai/image/generate` - Generate image
- `POST /api/v1/ai/audio/text-to-speech` - Convert text to speech
- `POST /api/v1/ai/audio/speech-to-text` - Transcribe audio

### Conversations
- `POST /api/v1/conversations` - Create conversation
- `GET /api/v1/conversations` - Get all conversations
- `GET /api/v1/conversations/:id` - Get conversation
- `PATCH /api/v1/conversations/:id` - Update conversation
- `DELETE /api/v1/conversations/:id` - Delete conversation
