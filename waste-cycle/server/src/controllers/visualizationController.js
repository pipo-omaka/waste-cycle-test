import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../config/firebaseConfig.js';

// @desc    Get waste data for visualization
// @route   GET /api/visualization/waste-flow
// @access  Public
const getWasteDataForViz = asyncHandler(async (req, res) => {
  // This should aggregate data to show the flow of waste
  // Example: Group by waste type and sum quantity
  
  const productsSnapshot = await db.collection('products').get();
  const wasteData = productsSnapshot.docs.map(doc => doc.data());
  
  const flow = wasteData.reduce((acc, product) => {
    const type = product.wasteType || 'unknown';
    if (!acc[type]) {
      acc[type] = {
        totalQuantity: 0,
        available: 0,
        sold: 0,
      };
    }
    acc[type].totalQuantity += product.quantity;
    if (product.status === 'sold') {
      acc[type].sold += product.quantity;
    } else {
      acc[type].available += product.quantity;
    }
    return acc;
  }, {});
  
  // Format for visualization (e.g., Sankey diagram)
  const nodes = [{ id: 'source' }];
  const links = [];
  Object.keys(flow).forEach(type => {
    nodes.push({ id: type });
    links.push({
      source: 'source',
      target: type,
      value: flow[type].totalQuantity,
    });
  });

  res.status(200).json({ success: true, data: { nodes, links, details: flow } });
});

export {
  getWasteDataForViz
};