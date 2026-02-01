# Project Structure & User Flow

## 📁 Complete Project Structure

```
OpenAI Project/
├── backend/                          # Express TypeScript Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts               # Environment configuration
│   │   ├── controllers/
│   │   │   ├── aiController.ts       # AI interaction endpoints
│   │   │   ├── authController.ts    # Authentication endpoints
│   │   │   ├── conversationController.ts  # Conversation management
│   │   │   └── googleAuthController.ts    # Google OAuth
│   │   ├── database/
│   │   │   └── connectDatabase.ts   # MongoDB connection
│   │   ├── middlewares/
│   │   │   └── authMiddleware.ts    # JWT authentication middleware
│   │   ├── models/
│   │   │   ├── User.ts              # User model
│   │   │   └── Conversation.ts     # Conversation model
│   │   ├── routes/
│   │   │   ├── aiRoutes.ts          # AI API routes
│   │   │   ├── authRoutes.ts        # Auth API routes
│   │   │   └── conversationRoutes.ts # Conversation API routes
│   │   ├── services/
│   │   │   └── openaiService.ts    # OpenAI API service layer
│   │   ├── app.ts                   # Express app configuration
│   │   └── index.ts                 # Server entry point
│   ├── .env                         # Environment variables (dummy)
│   ├── .env.example                 # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── frontend/                        # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Main chat dashboard
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Login page
│   │   │   ├── signup/
│   │   │   │   └── page.tsx        # Signup page
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── providers.tsx       # React Query & Theme providers
│   │   │   └── globals.css         # Global styles
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   └── ChatInterface.tsx  # Main chat component
│   │   │   └── ui/
│   │   │       ├── button.tsx      # Button component
│   │   │       └── card.tsx        # Card component
│   │   ├── lib/
│   │   │   └── utils.ts            # Utility functions
│   │   ├── services/
│   │   │   ├── api.ts              # Axios instance
│   │   │   ├── auth.ts             # Auth service
│   │   │   ├── ai.ts               # AI service
│   │   │   └── conversations.ts    # Conversation service
│   │   └── config.ts               # Frontend configuration
│   ├── .env.local                   # Frontend environment variables
│   ├── components.json              # shadcn/ui config
│   ├── next.config.js
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── postcss.config.js
│
└── README.md                        # Main project documentation
```

## 🔄 User Flow

### 1. Authentication Flow

```
Landing Page (/)
    ↓
[User clicks "Get Started" or "Sign Up"]
    ↓
Sign Up Page (/signup)
    ├── Option 1: Email/Password Registration
    │   ├── Fill form (name, email, password)
    │   ├── Submit → Backend creates user
    │   └── JWT token stored → Redirect to Dashboard
    │
    └── Option 2: Google OAuth
        ├── Click "Continue with Google"
        ├── Redirect to Google OAuth
        ├── User authorizes
        ├── Callback → Backend creates/updates user
        └── JWT token stored → Redirect to Dashboard

Login Page (/login)
    ├── Option 1: Email/Password Login
    │   ├── Enter credentials
    │   ├── Submit → Backend validates
    │   └── JWT token stored → Redirect to Dashboard
    │
    └── Option 2: Google OAuth
        └── [Same as Sign Up Option 2]
```

### 2. Chat Interaction Flow

```
Dashboard (/dashboard)
    ↓
[User opens chat interface]
    ↓
ChatInterface Component
    ├── Display conversation history (if any)
    ├── Input field for messages
    │
    ├── Text Input Flow:
    │   ├── User types message
    │   ├── Press Enter or Click Send
    │   ├── POST /api/v1/ai/text/stream
    │   ├── Server streams response via SSE
    │   ├── Frontend displays chunks in real-time
    │   └── Save to conversation (if conversationId exists)
    │
    ├── Image Analysis Flow:
    │   ├── User uploads image
    │   ├── User enters prompt
    │   ├── POST /api/v1/ai/image/analyze
    │   ├── Backend calls OpenAI vision API
    │   └── Display analysis result
    │
    ├── Image Generation Flow:
    │   ├── User enters text prompt
    │   ├── POST /api/v1/ai/image/generate
    │   ├── Backend calls OpenAI image generation
    │   └── Display generated image
    │
    ├── Text-to-Speech Flow:
    │   ├── User selects text
    │   ├── POST /api/v1/ai/audio/text-to-speech
    │   ├── Backend generates audio
    │   └── Play audio to user
    │
    └── Speech-to-Text Flow:
        ├── User clicks microphone
        ├── Record audio
        ├── POST /api/v1/ai/audio/speech-to-text
        ├── Backend transcribes audio
        └── Display transcribed text
```

### 3. Conversation Management Flow

```
Dashboard
    ↓
[User interacts with chat]
    ↓
Create New Conversation:
    ├── POST /api/v1/conversations
    ├── Backend creates conversation document
    └── Store conversationId in state
    ↓
Continue Existing Conversation:
    ├── GET /api/v1/conversations/:id
    ├── Load messages from database
    └── Display in chat interface
    ↓
Update Conversation:
    ├── PATCH /api/v1/conversations/:id
    └── Update title or other metadata
    ↓
Delete Conversation:
    ├── DELETE /api/v1/conversations/:id
    └── Remove from database
```

## 🗄️ Database Models

### User Model
```typescript
{
  email: string (unique, required)
  password: string (optional, required if provider='local')
  name: string (required)
  avatar: string (optional)
  provider: 'local' | 'google' (default: 'local')
  providerId: string (optional, for OAuth)
  isEmailVerified: boolean (default: false)
  createdAt: Date
  updatedAt: Date
}
```

### Conversation Model
```typescript
{
  userId: ObjectId (ref: User, required)
  title: string (required, default: 'New Conversation')
  messages: Array<{
    role: 'user' | 'assistant' | 'developer'
    content: string
    type: 'text' | 'image' | 'audio'
    metadata?: {
      imageUrl?: string
      audioUrl?: string
      fileId?: string
    }
    timestamp: Date
  }>
  model: string (default: 'gpt-5')
  createdAt: Date
  updatedAt: Date
}
```

## 🔐 Authentication Flow Details

### JWT Token Flow
1. User registers/logs in
2. Backend generates JWT token with `{ userId: user._id }`
3. Token stored in:
   - HTTP-only cookie (backend)
   - localStorage (frontend, for Authorization header)
4. Subsequent requests include token in:
   - Cookie (automatic)
   - Authorization header: `Bearer <token>`
5. `authMiddleware` validates token on protected routes

### Google OAuth Flow
1. User clicks "Continue with Google"
2. Frontend redirects to `/api/v1/auth/google`
3. Backend redirects to Google OAuth consent screen
4. User authorizes
5. Google redirects to `/api/v1/auth/google/callback?code=...`
6. Backend exchanges code for user info
7. Backend creates/updates user in database
8. Backend generates JWT token
9. Backend redirects to frontend with token

## 🚀 API Request Flow

### Text Generation with Streaming
```
Frontend:
  POST /api/v1/ai/text/stream
  Body: { input: string, conversationId?: string }
  ↓
Backend (aiController.generateTextStream):
  ├── Validate request
  ├── Call OpenAIService.generateTextStream()
  ├── Set SSE headers
  ├── Stream events:
  │   ├── response.output_text.delta → Send chunk
  │   ├── response.completed → Save to DB, send done
  │   └── response.error → Send error
  └── Close connection
  ↓
Frontend:
  ├── Read SSE stream
  ├── Update UI with each chunk
  └── Mark complete when done
```

### Image Analysis
```
Frontend:
  POST /api/v1/ai/image/analyze
  Body: { imageUrl: string, prompt: string }
  ↓
Backend (aiController.analyzeImage):
  ├── Validate request
  ├── Call OpenAIService.analyzeImage()
  ├── OpenAI API processes image
  └── Return analysis result
  ↓
Frontend:
  └── Display result in chat
```

## 📝 Key Features Implementation

### Real-time Streaming
- Uses Server-Sent Events (SSE)
- Backend streams OpenAI response chunks
- Frontend updates UI incrementally
- Provides ChatGPT-like experience

### Multi-Modal Support
- **Text**: Standard Responses API
- **Images**: Vision models for analysis, GPT Image for generation
- **Audio**: TTS and STT APIs
- All modalities integrated in single chat interface

### Conversation Persistence
- All messages saved to MongoDB
- Conversations can be resumed
- History maintained per user
- Efficient querying with indexes

### Error Handling
- Try-catch blocks in all controllers
- Validation with Zod schemas
- User-friendly error messages
- Proper HTTP status codes

## 🔧 Environment Variables

### Backend (.env)
- `PORT`: Server port
- `MONGODB_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret for JWT signing
- `OPENAI_API_KEY`: OpenAI API key
- `GOOGLE_OAUTH_*`: Google OAuth credentials

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL

## 🎯 Next Steps for Enhancement

1. **WebSocket Support**: Add WebSocket for bi-directional real-time communication
2. **File Upload**: Implement file upload for images/audio
3. **Voice Recording**: Add browser-based audio recording
4. **Conversation Sidebar**: Show conversation list
5. **Model Selection**: Allow users to choose AI model
6. **Rate Limiting**: Add rate limiting for API protection
7. **Error Recovery**: Better error handling and retry logic
8. **Caching**: Add Redis for conversation caching
9. **Analytics**: Track usage and performance
10. **Testing**: Add unit and integration tests
