import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
} from '../controllers/conversationController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', createConversation);
router.get('/', getConversations);
router.get('/:id', getConversation);
router.patch('/:id', updateConversation);
router.delete('/:id', deleteConversation);

export default router;
