import express from 'express';
import {
  findMatches,
  acceptMatch,
} from '../controllers/matchingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/find', protect, findMatches);
router.post('/accept', protect, acceptMatch);

export default router;