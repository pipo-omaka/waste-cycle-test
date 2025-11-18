import express from 'express';
import {
  getAdminDashboard,
  manageUsers, // Corrected: Changed 'getAllUsers' to 'manageUsers'
  manageContent,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js'; // Corrected: Changed 'authenticateUser' back to 'protect'
import { admin } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect, admin); // Corrected: Use 'protect'

router.get('/dashboard', getAdminDashboard);
router.get('/users', manageUsers); // Corrected: Use the imported 'manageUsers'
router.post('/content', manageContent);

export default router;