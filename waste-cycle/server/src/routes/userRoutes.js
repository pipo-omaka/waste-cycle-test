import express from 'express';
import {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} from '../controllers/userController.js';
import { protect, protectTokenOnly } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * CRITICAL: Route order matters in Express!
 * More specific routes MUST come before parameterized routes.
 * 
 * Correct order:
 * 1. /profile (specific) - MUST come first
 * 2. / (root)
 * 3. /:id (parameterized) - MUST come last
 * 
 * If /:id comes before /profile, Express will match /profile as /:id with id="profile"
 */

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 * @note    Uses protect middleware which requires Firebase ID Token
 */
router.get('/profile', protect, getUserProfile);

/**
 * @route   POST /api/users/profile
 * @desc    Create user profile in Firestore
 * @access  Private
 * @note    Uses protectTokenOnly (doesn't require Firestore user doc to exist)
 */
router.post('/profile', protectTokenOnly, createUserProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/profile', protect, updateUserProfile);

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/', protect, admin, getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (Admin only)
 * @access  Private/Admin
 * @note    This MUST come after /profile to avoid route conflicts
 */
router.get('/:id', protect, admin, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user role (Admin only)
 * @access  Private/Admin
 */
router.put('/:id', protect, admin, updateUserRole);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', protect, admin, deleteUser);

export default router;
