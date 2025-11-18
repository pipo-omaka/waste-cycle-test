import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../config/firebaseConfig.js';

// @desc    Analyze user's waste production and potential
// @route   GET /api/analyze/waste
// @access  Private
const analyzeWaste = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  // Check for existing analysis
  const analysisDoc = await db.collection('analysis').doc(userId).get();
  if (analysisDoc.exists && analysisDoc.data().updatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) {
    // Return cached analysis if less than 24h old
    res.status(200).json({ success: true, data: analysisDoc.data(), source: 'cache' });
    return;
  }

  // Run new analysis
  const wasteSnapshot = await db.collection('products').where('userId', '==', userId).get();
  const wasteEntries = wasteSnapshot.docs.map(doc => doc.data());

  const totalWaste = wasteEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  const potentialEarnings = wasteEntries.reduce((sum, entry) => sum + (entry.price * entry.quantity), 0);
  
  const wasteByType = wasteEntries.reduce((acc, entry) => {
    const type = entry.wasteType || 'unknown';
    acc[type] = (acc[type] || 0) + entry.quantity;
    return acc;
  }, {});

  const analysisResult = {
    totalWaste,
    potentialEarnings,
    wasteByType,
    totalProducts: wasteEntries.length,
    updatedAt: new Date().toISOString(),
  };

  // Save the new analysis
  await db.collection('analysis').doc(userId).set(analysisResult);

  res.status(200).json({ success: true, data: analysisResult, source: 'new' });
});

export {
  analyzeWaste
};