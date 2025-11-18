import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../config/firebaseConfig.js';

// @desc    Get farm profile
// @route   GET /api/farms/profile
// @access  Private/Seller
const getFarmProfile = asyncHandler(async (req, res) => {
  const farmId = req.user.uid; // Assuming farm ID is the user ID for a seller
  const farmDoc = await db.collection('farms').doc(farmId).get();

  if (farmDoc.exists) {
    res.status(200).json({ success: true, data: farmDoc.data() });
  } else {
    // If farm profile doesn't exist, maybe create a default one or return user data
    res.status(200).json({ success: true, data: { ...req.user, isFarmProfile: false } });
  }
});

// @desc    Update farm profile
// @route   PUT /api/farms/profile
// @access  Private/Seller
const updateFarmProfile = asyncHandler(async (req, res) => {
  const farmId = req.user.uid;
  const { farmName, location, description, farmType } = req.body;

  const farmRef = db.collection('farms').doc(farmId);
  
  const profileData = {
    farmName: farmName || req.user.farmName, // Fallback to user profile farmName
    location: location,
    description: description,
    farmType: farmType,
    updatedAt: new Date().toISOString(),
  };

  await farmRef.set(profileData, { merge: true });

  // Also update the user document if farmName changed
  if (farmName && farmName !== req.user.farmName) {
    await db.collection('users').doc(farmId).update({ farmName: farmName });
  }

  res.status(200).json({ success: true, data: profileData });
});

export {
  getFarmProfile,
  updateFarmProfile
};