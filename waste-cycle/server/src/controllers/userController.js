import asyncHandler from '../middleware/asyncHandler.js';
import { db, auth } from '../config/firebaseConfig.js';

/**
 * @desc    Get user profile from Firestore
 * @route   GET /api/users/profile
 * @access  Private
 * @note    MULTI-USER: Returns profile for the authenticated user only
 *          Uses req.user.uid from verifyToken middleware (decodedToken.uid)
 */
const getUserProfile = asyncHandler(async (req, res) => {
  console.log('🔍 getUserProfile called');
  console.log('🔍 req.user:', req.user ? { uid: req.user.uid, email: req.user.email } : 'null');
  
  // CRITICAL: req.user.uid comes from verifyToken middleware (decodedToken.uid)
  if (!req.user || !req.user.uid) {
    console.error('❌ getUserProfile: req.user.uid is missing', req.user);
    res.status(401);
    throw new Error('Not authorized - user ID not found');
  }

  // Validate that uid is not a token string
  if (req.user.uid.length > 100) {
    console.error(`❌ getUserProfile: req.user.uid looks like a token string (length: ${req.user.uid.length})`);
    res.status(401);
    throw new Error('Invalid user ID - uid appears to be a token string');
  }

  const userId = String(req.user.uid); // ✅ Use uid from decodedToken
  
  console.log(`🔍 getUserProfile - userId (uid): ${userId} (length: ${userId.length})`);

  // MULTI-USER: Get user profile from Firestore using uid
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.log(`⚠️ getUserProfile - User profile not found for uid: ${userId}`);
    res.status(404).json({
      success: false,
      error: 'User profile not found. Please complete registration.',
      code: 'USER_NOT_FOUND',
      message: 'User profile not found. Please complete registration.'
    });
    return;
  }

  const userData = userDoc.data();
  
  console.log(`✅ getUserProfile - User found: ${userData.name || userData.email}`);
  
  // Return user profile with consistent data structure
  res.status(200).json({
    success: true,
    user: {
      id: userId,
      uid: userId,
      email: userData.email || req.user.email || '',
      name: userData.name || userData.displayName || '',
      role: userData.role || 'user',
      farmName: userData.farmName || '',
      location: userData.location || null,
      verified: userData.verified || false,
      avatar: userData.avatar || userData.photoURL || '',
      createdAt: userData.createdAt || null,
      updatedAt: userData.updatedAt || null,
    },
  });
});

/**
 * @desc    Create user profile in Firestore
 * @route   POST /api/users/profile
 * @access  Private
 * @note    MULTI-USER: Creates profile for the authenticated user
 *          Auto-creates profile if it doesn't exist (used by client)
 *          Uses Firebase uid as document ID for data separation
 *          Uses protectTokenOnly (doesn't require Firestore user doc to exist)
 */
const createUserProfile = asyncHandler(async (req, res) => {
  console.log('🔍 createUserProfile called');
  const { name, farmName, role } = req.body;
  
  // CRITICAL: req.user.uid comes from verifyToken middleware (decodedToken.uid)
  if (!req.user || !req.user.uid) {
    console.error('❌ createUserProfile: req.user.uid is missing', req.user);
    res.status(401);
    throw new Error('Not authorized - user ID not found');
  }

  // Validate that uid is not a token string
  if (req.user.uid.length > 100) {
    console.error(`❌ createUserProfile: req.user.uid looks like a token string (length: ${req.user.uid.length})`);
    res.status(401);
    throw new Error('Invalid user ID - uid appears to be a token string');
  }

  const userId = String(req.user.uid); // ✅ Use uid from decodedToken
  console.log(`🔍 createUserProfile - userId (uid): ${userId}`);

  // MULTI-USER: Use uid as document ID to ensure data separation
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  // If profile already exists, return existing profile instead of error
  if (userDoc.exists) {
    console.log(`✅ createUserProfile - Profile already exists, returning existing`);
    const existingData = userDoc.data();
    res.status(200).json({
      success: true,
      user: {
        id: userId,
        uid: userId,
        email: existingData.email || req.user.email || '',
        name: existingData.name || name || '',
        farmName: existingData.farmName || farmName || '',
        role: existingData.role || role || 'user',
        verified: existingData.verified || false,
        avatar: existingData.avatar || '',
        createdAt: existingData.createdAt || new Date().toISOString(),
        updatedAt: existingData.updatedAt || new Date().toISOString(),
      },
    });
    return;
  }

  // Create new profile
  console.log(`📝 createUserProfile - Creating new profile for uid: ${userId}`);
  const newUserProfile = {
    uid: userId,
    email: req.user.email || '', 
    name: name || req.user.displayName || req.user.email?.split('@')[0] || 'ผู้ใช้',
    farmName: farmName || '',
    role: role || 'user',
    verified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await userRef.set(newUserProfile);
  console.log(`✅ createUserProfile - Profile created successfully`);

  res.status(201).json({
    success: true,
    user: {
      id: userId,
      ...newUserProfile,
    },
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, farmName, location } = req.body;
  
  // CRITICAL: req.user.uid comes from verifyToken middleware (decodedToken.uid)
  if (!req.user || !req.user.uid) {
    console.error('❌ updateUserProfile: req.user.uid is missing', req.user);
    res.status(401);
    throw new Error('Not authorized - user ID not found');
  }

  const userId = String(req.user.uid); // ✅ Use uid from decodedToken

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    res.status(404);
    throw new Error('User profile not found');
  }

  const updatedProfile = {
    name: name !== undefined ? name : userDoc.data().name,
    farmName: farmName !== undefined ? farmName : userDoc.data().farmName,
    location: location !== undefined ? location : userDoc.data().location,
    updatedAt: new Date().toISOString(),
  };

  await userRef.update(updatedProfile);
  const newDoc = await userRef.get();

  res.status(200).json({
    success: true,
    user: {
      id: userId,
      uid: userId,
      ...newDoc.data(),
    },
  });
});

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const usersSnapshot = await db.collection('users').get();
  const users = usersSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    uid: doc.id,
    ...doc.data() 
  }));
  res.status(200).json({ success: true, count: users.length, users });
});

/**
 * @desc    Get user by ID (Admin only)
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const userDoc = await db.collection('users').doc(userId).get();

  if (userDoc.exists) {
    res.status(200).json({ 
      success: true, 
      user: { 
        id: userDoc.id,
        uid: userDoc.id,
        ...userDoc.data() 
      } 
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Update user role (Admin only)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!role) {
    res.status(400);
    throw new Error('Role is required');
  }

  const userRef = db.collection('users').doc(userId);
  await userRef.update({ role, updatedAt: new Date().toISOString() });

  // Update Firebase Auth custom claims
  try {
    await auth.setCustomUserClaims(userId, { role });
  } catch (error) {
    console.error('Error updating custom claims:', error);
    // Continue even if custom claims update fails
  }

  res.status(200).json({ success: true, message: 'User role updated' });
});

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  await db.collection('users').doc(userId).delete();
  
  // Delete from Firebase Auth
  try {
    await auth.deleteUser(userId);
  } catch (error) {
    console.error('Error deleting user from Auth:', error);
    // Continue even if Auth deletion fails
  }

  res.status(200).json({ success: true, message: 'User deleted' });
});

export {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};
