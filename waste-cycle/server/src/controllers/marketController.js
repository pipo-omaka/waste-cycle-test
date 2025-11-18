import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../config/firebaseConfig.js';

// @desc    Search marketplace
// @route   GET /api/market/search
// @access  Public
const searchMarket = asyncHandler(async (req, res) => {
  const { q, wasteType, location, sortBy, order = 'desc' } = req.query;

  let query = db.collection('products').where('status', '==', 'available');

  if (wasteType) {
    query = query.where('wasteType', '==', wasteType);
  }
  if (q) {
    // Firestore doesn't support full-text search natively.
    // This is a very simple "startsWith" search.
    // For real search, use Algolia or another search service.
    query = query.where('title', '>=', q).where('title', '<=', q + '\uf8ff');
  }
  
  if (sortBy) {
    query = query.orderBy(sortBy, order);
  } else {
    query = query.orderBy('createdAt', 'desc');
  }

  const productsSnapshot = await query.get();
  const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  res.status(200).json({ success: true, data: products });
});

// @desc    Get product details
// @route   GET /api/market/product/:id
// @access  Public
const getProductDetails = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const productDoc = await db.collection('products').doc(productId).get();

  if (!productDoc.exists) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  const productData = productDoc.data();
  
  // Get seller info
  const sellerDoc = await db.collection('users').doc(productData.userId).get();
  let sellerInfo = null;
  if(sellerDoc.exists) {
    const seller = sellerDoc.data();
    sellerInfo = {
      name: seller.name,
      farmName: seller.farmName,
      avatar: seller.avatar,
      verified: seller.verified,
    };
  }

  res.status(200).json({ success: true, data: { id: productDoc.id, ...productData, seller: sellerInfo } });
});

export {
  searchMarket,
  getProductDetails
};