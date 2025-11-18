import express from 'express';
import {
  getFarmProfile,
  updateFarmProfile,
} from '../controllers/farmController.js';
import { protect } from '../middleware/authMiddleware.js';
import { seller } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/profile')
  .get(protect, seller, getFarmProfile)
  .put(protect, seller, updateFarmProfile);

export default router;