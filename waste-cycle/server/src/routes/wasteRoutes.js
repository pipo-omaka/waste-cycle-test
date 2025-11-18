import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Track waste generation
// @route   POST /api/waste/track
// @access  Private
router.post('/track', protect, (req, res) => {
  // Controller logic goes here or in wasteController.js
  res.json({ message: 'Waste tracking endpoint' });
});

// @desc    Get waste data
// @route   GET /api/waste
// @access  Private
router.get('/', protect, (req, res) => {
  // Controller logic goes here or in wasteController.js
  res.json({ message: 'Get waste data endpoint' });
});

export default router;