# OpenAI Multi-Modal Interaction Platform

A full-stack application for interacting with OpenAI's API through multiple modalities including text, images, and voice in real-time.

## 🚀 Features

- **Text Generation** - Generate text responses with real-time streaming
- **Image Analysis** - Analyze images using vision models
- **Image Generation** - Generate images from text prompts
- **Text-to-Speech** - Convert text to natural-sounding speech
- **Speech-to-Text** - Transcribe audio to text
- **Real-time Streaming** - Server-sent events for streaming AI responses
- **Conversation Management** - Save and manage conversation history
- **Authentication** - JWT-based auth with Google OAuth SSO
- **Modern UI** - Beautiful, responsive interface with dark mode

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Query
- Framer Motion

### Backend
- Express.js
- TypeScript
- MongoDB Atlas with Mongoose
- OpenAI API (Responses API)
- JWT Authentication
- Google OAuth
- WebSocket support for real-time features

## 📁 Project Structure

```
.
├── backend/          # Express TypeScript backend
│   ├── src/
│   │   ├── config/      # Configuration
│   │   ├── controllers/ # Route controllers
│   │   ├── database/    # Database connection
│   │   ├── middlewares/ # Express middlewares
│   │   ├── models/      # MongoDB models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic (OpenAI service)
│   │   ├── app.ts       # Express app
│   │   └── index.ts     # Entry point
│   └── package.json
├── frontend/        # Next.js frontend
│   ├── src/
│   │   ├── app/         # App router pages
│   │   ├── components/  # React components
│   │   ├── lib/         # Utilities
│   │   └── services/    # API services
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- OpenAI API key
- Google OAuth credentials (for SSO)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```env
PORT=3001
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

5. Run development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file (or copy from `.env.example`):
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your backend URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Note:** The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser. Make sure your backend URL is correct.

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user
- `GET /api/v1/auth/google` - Initiate Google OAuth
- `GET /api/v1/auth/google/callback` - Google OAuth callback

### AI Interactions
- `POST /api/v1/ai/text` - Generate text response
- `POST /api/v1/ai/text/stream` - Stream text response (SSE)
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

## 🔒 Environment Variables

### Backend
- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - JWT expiration time
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_OAUTH_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth client secret
- `CORS_ORIGIN` - CORS allowed origin
- `FRONTEND_URL` - Frontend URL

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 🎨 Features in Detail

### Real-time Streaming
The application uses Server-Sent Events (SSE) to stream AI responses in real-time, providing a ChatGPT-like experience.

### Multi-Modal Interactions
- **Text**: Standard text generation with streaming
- **Images**: Upload and analyze images, or generate images from prompts
- **Voice**: Convert text to speech or transcribe audio to text

### Conversation Management
All conversations are saved to MongoDB, allowing users to:
- View conversation history
- Continue previous conversations
- Delete conversations
- Update conversation titles

### Authentication
- Email/password registration and login
- Google OAuth SSO
- JWT token-based authentication
- Protected routes

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License
