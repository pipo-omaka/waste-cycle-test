import express from 'express';
import {
  getChatRooms,
  createChatRoom,
  getChatRoomById,
  postMessage,
  getMessages,
  deleteChatRoom,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// IMPORTANT: Order matters! More specific routes must come before parameterized routes
// Routes for messages (more specific) must come before /:id route

router.get('/', protect, getChatRooms);
router.post('/', protect, createChatRoom);

// Messages routes (more specific - must come before /:id)
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, postMessage);

// Chat room routes (less specific - must come after /:id/messages)
router.get('/:id', protect, getChatRoomById);
router.delete('/:id', protect, admin, deleteChatRoom);

export default router;