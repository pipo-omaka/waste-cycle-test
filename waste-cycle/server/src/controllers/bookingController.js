import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../config/firebaseConfig.js';
import { createNotification } from '../utils/notificationService.js';

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const { productId, buyerId, sellerId, quantity, bookingDate } = req.body;
  const buyer = req.user; // Assuming the logged-in user is the buyer

  if (buyer.uid !== buyerId) {
    res.status(401);
    throw new Error('User not authorized');
  }

  const newBooking = {
    productId,
    buyerId,
    sellerId,
    quantity,
    bookingDate,
    status: 'pending', // e.g., pending, confirmed, cancelled
    createdAt: new Date().toISOString(),
  };

  const bookingRef = await db.collection('bookings').add(newBooking);

  await createNotification(
    sellerId,
    'new_booking',
    `You have a new booking request for product ${productId} from ${buyer.name}`,
    `/bookings/${bookingRef.id}`
  );

  res.status(201).json({
    success: true,
    data: { id: bookingRef.id, ...newBooking },
  });
});

// @desc    Get bookings for a user (both as buyer and seller)
// @route   GET /api/bookings/user/:userId
// @access  Private
const getUserBookings = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (req.user.uid !== userId) {
    res.status(401);
    throw new Error('User not authorized');
  }

  const bookingsAsBuyerSnapshot = await db.collection('bookings').where('buyerId', '==', userId).get();
  const bookingsAsSellerSnapshot = await db.collection('bookings').where('sellerId', '==', userId).get();

  const bookingsAsBuyer = bookingsAsBuyerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const bookingsAsSeller = bookingsAsSellerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  res.status(200).json({
    success: true,
    data: {
      bought: bookingsAsBuyer,
      sold: bookingsAsSeller,
    },
  });
});

// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = asyncHandler(async (req, res) => {
  const bookingId = req.params.id;
  const bookingDoc = await db.collection('bookings').doc(bookingId).get();

  if (!bookingDoc.exists) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const bookingData = bookingDoc.data();

  // Check if the user is part of this booking
  if (req.user.uid !== bookingData.buyerId && req.user.uid !== bookingData.sellerId) {
    res.status(401);
    throw new Error('User not authorized to view this booking');
  }

  res.status(200).json({
    success: true,
    data: { id: bookingDoc.id, ...bookingData },
  });
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private/Seller
const updateBookingStatus = asyncHandler(async (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body; // e.g., confirmed, cancelled
  const seller = req.user;

  const bookingRef = db.collection('bookings').doc(bookingId);
  const bookingDoc = await bookingRef.get();

  if (!bookingDoc.exists) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const bookingData = bookingDoc.data();

  if (bookingData.sellerId !== seller.uid) {
    res.status(401);
    throw new Error('Only the seller can update the booking status');
  }

  await bookingRef.update({ status: status, updatedAt: new Date().toISOString() });

  // Notify the buyer
  await createNotification(
    bookingData.buyerId,
    'booking_update',
    `Your booking for product ${bookingData.productId} has been ${status}.`,
    `/bookings/${bookingId}`
  );

  res.status(200).json({
    success: true,
    data: { id: bookingId, status: status },
  });
});

export {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus
};