import asyncHandler from '../middleware/asyncHandler.js';
import { calculateFertilizer } from '../utils/fertilizerCalculator.js';

// @desc    Calculate NPK from waste
// @route   POST /api/fertilizer/calculate
// @access  Private
const calculateNPK = asyncHandler(async (req, res) => {
  const { wasteType, quantity, animalType, feedType } = req.body;

  // This is a simplified example. Real logic should be in fertilizerCalculator.js
  const npkResult = {
    n: quantity * 0.5, // Example calculation
    p: quantity * 0.2,
    k: quantity * 0.3,
  };

  res.status(200).json({ success: true, data: npkResult });
});

// @desc    Get fertilizer recommendation
// @route   POST /api/fertilizer/recommend
// @access  Private
const getFertilizerRecommendation = asyncHandler(async (req, res) => {
  const { cropType, area, soilType } = req.body;
  const user = req.user;

  // Example: Call the utility function
  const recommendation = calculateFertilizer(cropType, area, soilType, user.availableWaste);

  res.status(200).json({ success: true, data: recommendation });
});

export {
  calculateNPK,
  getFertilizerRecommendation
};