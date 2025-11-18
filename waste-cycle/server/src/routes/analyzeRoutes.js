import express from 'express';
import { analyzeWaste } from '../controllers/analyzeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/waste', protect, analyzeWaste);

export default router;