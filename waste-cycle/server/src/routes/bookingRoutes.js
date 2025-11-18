import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { seller } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createBooking);

router.route('/user/:userId')
  .get(protect, getUserBookings);

router.route('/:id')
  .get(protect, getBookingById);

router.route('/:id/status')
  .put(protect, seller, updateBookingStatus);

export default router;