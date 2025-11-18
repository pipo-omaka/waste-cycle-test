import express from 'express';
import {
  searchMarket,
  getProductDetails,
} from '../controllers/marketController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/search', searchMarket); // Public search
router.get('/product/:id', getProductDetails); // Public view

export default router;