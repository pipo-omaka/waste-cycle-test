import express from 'express';
import {
  calculateNPK,
  getFertilizerRecommendation,
} from '../controllers/fertilizerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/calculate', protect, calculateNPK);
router.post('/recommend', protect, getFertilizerRecommendation);

export default router;