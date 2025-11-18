import express from 'express';
import { getWasteDataForViz } from '../controllers/visualizationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/waste-flow', getWasteDataForViz); // Public or private? Decided on public for now.

export default router;