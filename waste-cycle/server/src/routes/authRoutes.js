import express from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { validateEmail, validatePassword } from '../utils/validation.js';
import asyncHandler from '../middleware/asyncHandler.js';

const router = express.Router();

// Middleware to use validation functions
const validateRegistration = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!validateEmail(email)) {
    res.status(400);
    throw new Error('Invalid email format');
  }
  if (!validatePassword(password)) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }
  next();
});

const validateLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }
  next();
});


router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

export default router;