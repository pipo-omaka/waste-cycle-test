import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../config/firebaseConfig.js';

// @desc    Find potential matches for waste
// @route   POST /api/matching/find
// @access  Private
const findMatches = asyncHandler(async (req, res) => {
  const { wasteType, quantity, location } = req.body;
  const user = req.user;

  // Simple matching logic: Find users (buyers) who need this waste type
  // This should be much more complex in a real app
  
  let query = db.collection('users')
                .where('needs.wasteType', '==', wasteType)
                .where('needs.quantity', '>=', quantity);
  
  // Add location-based filtering (e.g., within 50km)
  // This requires GeoFire or similar
  
  const matchesSnapshot = await query.get();
  const matches = matchesSnapshot.docs.map(doc => ({
    userId: doc.id,
    name: doc.data().name,
    farmName: doc.data().farmName,
    location: doc.data().location,
  }));

  res.status(200).json({ success: true, data: matches });
});

// @desc    Accept a match
// @route   POST /api/matching/accept
// @access  Private
const acceptMatch = asyncHandler(async (req, res) => {
  const { matchId, wasteProductId } = req.body;
  const user = req.user; // The seller

  // Logic to confirm a match
  // This might create a booking or a chat
  
  // 1. Get Match (Buyer) details
  const matchUserDoc = await db.collection('users').doc(matchId).get();
  if(!matchUserDoc.exists) {
    res.status(404);
    throw new Error('Matched user not found');
  }
  const matchUser = matchUserDoc.data();

  // 2. Create a notification for the buyer
  await db.collection('notifications').add({
    userId: matchId,
    type: 'match_accepted',
    message: `${user.name} has accepted your match for waste product ${wasteProductId}`,
    link: `/products/${wasteProductId}`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.status(200).json({ success: true, message: 'Match accepted, notification sent to buyer.' });
});

export {
  findMatches,
  acceptMatch
};