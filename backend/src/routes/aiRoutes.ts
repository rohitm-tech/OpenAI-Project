import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  generateText,
  generateTextStream,
  analyzeImage,
  generateImage,
  textToSpeech,
  speechToText,
} from '../controllers/aiController';
import { createRealtimeClientSecret, handleRealtimeSDP } from '../controllers/realtimeController';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// All routes require authentication
router.use(authMiddleware);

// Text generation
router.post('/text', generateText);
router.post('/text/stream', generateTextStream);

// Image operations
router.post('/image/analyze', analyzeImage);
router.post('/image/generate', generateImage);

// Audio operations
router.post('/audio/text-to-speech', textToSpeech);
router.post('/audio/speech-to-text', upload.single('audio'), speechToText);

// Realtime API
router.post('/realtime/client-secret', createRealtimeClientSecret);
router.post('/realtime/sdp', handleRealtimeSDP);

export default router;
