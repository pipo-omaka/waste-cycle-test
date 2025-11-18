// src/controllers/productController.js
import admin from "firebase-admin";

const db = admin.firestore();

/**
 * @desc    Get all products (for Marketplace - shows posts from all users)
 * @route   GET /api/products/all
 * @access  Private
 * @note    This endpoint returns ALL posts from ALL users for the marketplace view
 */
export const getAllProducts = async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();
    const products = [];

    snapshot.forEach((doc) => {
      const productData = doc.data();
      // Ensure images is always an array
      if (!Array.isArray(productData.images)) {
        productData.images = [];
      }
      // CRITICAL FIX: Ensure userId is always a string in response
      // This prevents type mismatch issues on frontend
      if (productData.userId) {
        productData.userId = String(productData.userId);
      }
      products.push({ id: doc.id, ...productData });
    });

    console.log(`📦 getAllProducts: Returning ${products.length} products from all users`);
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("🔥 getAllProducts error:", err);
    console.error("🔥 Error details:", {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get products for the current logged-in user only
 * @route   GET /api/products/my-posts
 * @access  Private
 * @note    This endpoint filters products by userId to show only the current user's posts
 *          Used in Profile page and Dashboard
 */
export const getMyProducts = async (req, res) => {
  try {
    // Get user ID from authenticated request
    if (!req.user) {
      console.error("🔥 getMyProducts error: req.user is undefined");
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // CRITICAL FIX: Always use string for userId to prevent type mismatch issues
    // Get userId from Firebase Auth (req.user.uid is the source of truth)
    const userId = String(req.user.uid || req.user.id);
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error("🔥 getMyProducts error: User ID not found in req.user", req.user);
      return res.status(401).json({ success: false, message: "User ID not found" });
    }

    // DEBUG: Log userId for troubleshooting
    console.log(`📝 getMyProducts - userId: ${userId} (type: ${typeof userId})`);

    // Filter products by userId - only get posts belonging to this user
    // IMPORTANT: Use string comparison to ensure type consistency
    const snapshot = await db.collection("products").where("userId", "==", userId).get();
    const products = [];

    snapshot.forEach((doc) => {
      const productData = doc.data();
      // Ensure images is always an array
      if (!Array.isArray(productData.images)) {
        productData.images = [];
      }
      // CRITICAL FIX: Ensure userId is always a string in response
      // This prevents type mismatch issues on frontend
      if (productData.userId) {
        productData.userId = String(productData.userId);
      }
      products.push({ id: doc.id, ...productData });
    });

    console.log(`📦 getMyProducts: Returning ${products.length} products for user ${userId}`);
    res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("🔥 getMyProducts error:", err);
    console.error("🔥 Error details:", {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc    Get all products (legacy endpoint - kept for backward compatibility)
 * @route   GET /api/products
 * @access  Private
 * @note    This is kept for backward compatibility but now calls getAllProducts
 */
export const getProducts = getAllProducts;

export const createProduct = async (req, res) => {
  try {
    const data = req.body;

    // Get user ID - handle both id and uid from auth middleware
    if (!req.user) {
      console.error("🔥 createProduct error: req.user is undefined");
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // CRITICAL FIX: Always use string for userId to prevent type mismatch issues
    // Get userId from Firebase Auth (req.user.uid is the source of truth)
    // IMPORTANT: Use req.user.uid FIRST (not req.user.id) because uid is from Firebase Auth token
    const userId = String(req.user.uid || req.user.id);
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error("🔥 createProduct error: User ID not found in req.user", req.user);
      console.error("🔥 createProduct - req.user object:", JSON.stringify(req.user, null, 2));
      return res.status(401).json({ success: false, message: "User ID not found" });
    }
    
    // IMPORTANT: Store userId as string to ensure consistency
    data.userId = userId;
    
    // DEBUG: Log userId for troubleshooting
    console.log(`📝 createProduct - req.user.uid: ${req.user.uid}, req.user.id: ${req.user.id}`);
    console.log(`📝 createProduct - Final userId: ${userId} (type: ${typeof userId})`);
    console.log(`📝 createProduct - Storing userId in product: ${data.userId}`);

    data.createdDate = new Date().toISOString();
    data.rating = 0;
    data.reviewCount = 0;
    // Ensure images is always an array
    data.images = Array.isArray(data.images) ? data.images : [];

    // FIREBASE FIRESTORE LIMIT CHECK:
    // Firestore has a limit of ~1MB per array field
    // Calculate total size of images array (base64 strings)
    if (data.images.length > 0) {
      const imagesSize = JSON.stringify(data.images).length;
      const maxSize = 1000000; // ~1MB in bytes (Firestore limit is 1,048,487 bytes)
      
      console.log(`📊 Images array size: ${imagesSize} bytes (max: ${maxSize} bytes)`);
      
      if (imagesSize > maxSize) {
        console.error(`🔥 createProduct error: Images array too large (${imagesSize} bytes > ${maxSize} bytes)`);
        return res.status(400).json({
          success: false,
          message: `รูปภาพมีขนาดใหญ่เกินไป (${Math.round(imagesSize / 1024)}KB > ${Math.round(maxSize / 1024)}KB). กรุณาลดจำนวนหรือขนาดรูปภาพ`,
          error: `Images array size (${imagesSize} bytes) exceeds Firestore limit (${maxSize} bytes)`
        });
      }
    }

    // Validate and ensure location is properly formatted
    if (data.location) {
      if (typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number') {
        console.error("🔥 createProduct error: Invalid location format", data.location);
        return res.status(400).json({ 
          success: false, 
          message: "Invalid location format. lat and lng must be numbers." 
        });
      }
    }

    // Ensure npk is an object with numbers
    if (!data.npk || typeof data.npk !== 'object') {
      data.npk = { n: 0, p: 0, k: 0 };
    } else {
      data.npk = {
        n: typeof data.npk.n === 'number' ? data.npk.n : 0,
        p: typeof data.npk.p === 'number' ? data.npk.p : 0,
        k: typeof data.npk.k === 'number' ? data.npk.k : 0
      };
    }

    // Ensure numeric fields are numbers
    data.quantity = typeof data.quantity === 'number' ? data.quantity : 0;
    data.price = typeof data.price === 'number' ? data.price : 0;
    data.distance = typeof data.distance === 'number' ? data.distance : 0;

    // Ensure boolean fields are booleans
    data.verified = typeof data.verified === 'boolean' ? data.verified : false;
    data.sold = typeof data.sold === 'boolean' ? data.sold : false;

    console.log("📦 Creating product with data:", {
      title: data.title,
      userId: data.userId,
      imagesCount: data.images.length,
      hasLocation: !!data.location,
      location: data.location
    });

    const ref = await db.collection("products").add(data);

    res.status(201).json({
      success: true,
      data: { id: ref.id, ...data },
    });
  } catch (err) {
    console.error("🔥 createProduct error:", err);
    console.error("🔥 Error details:", {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    res.status(500).json({ 
      success: false, 
      message: "Create failed",
      error: err.message || "Unknown error"
    });
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private
 * @note    Only the owner of the product (userId matches) can update it
 *          This ensures multi-user security - users can only edit their own posts
 */
export const updateProduct = async (req, res) => {
  try {
    // Get user ID from authenticated request
    if (!req.user) {
      console.error("🔥 updateProduct error: req.user is undefined");
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // CRITICAL FIX: Always use string for userId to prevent type mismatch issues
    // Get userId from Firebase Auth (req.user.uid is the source of truth)
    // IMPORTANT: Use req.user.uid FIRST (not req.user.id) because uid is from Firebase Auth token
    const userId = String(req.user.uid || req.user.id);
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error("🔥 updateProduct error: User ID not found in req.user", req.user);
      console.error("🔥 updateProduct - req.user object:", JSON.stringify(req.user, null, 2));
      return res.status(401).json({ success: false, message: "User ID not found" });
    }
    
    // DEBUG: Log userId source
    console.log(`📝 updateProduct - req.user.uid: ${req.user.uid}, req.user.id: ${req.user.id}`);
    console.log(`📝 updateProduct - Final userId: ${userId} (type: ${typeof userId})`);

    const id = req.params.id;
    const data = req.body;

    // Check if product exists and belongs to this user
    const productDoc = await db.collection("products").doc(id).get();
    if (!productDoc.exists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const productData = productDoc.data();
    
    // CRITICAL FIX: Use String() for comparison to handle type mismatches
    // Convert both to strings to ensure consistent comparison
    const storedUserId = String(productData.userId || '');
    const currentUserId = String(userId);
    
    // DEBUG: Log for troubleshooting
    console.log(`🔍 updateProduct - productId: ${id}`);
    console.log(`🔍 updateProduct - storedUserId: ${storedUserId} (type: ${typeof productData.userId})`);
    console.log(`🔍 updateProduct - currentUserId: ${currentUserId} (type: ${typeof userId})`);
    console.log(`🔍 updateProduct - Match: ${storedUserId === currentUserId}`);
    
    // Authorization check: Only the owner can update their product
    if (storedUserId !== currentUserId) {
      console.error(`🔥 updateProduct error: User ${currentUserId} tried to update product ${id} owned by ${storedUserId}`);
      return res.status(403).json({ 
        success: false, 
        message: "Forbidden: You can only update your own products" 
      });
    }

    // Ensure images is always an array if provided
    if (data.images !== undefined) {
      data.images = Array.isArray(data.images) ? data.images : [];
      
      // FIREBASE FIRESTORE LIMIT CHECK:
      // Firestore has a limit of ~1MB per array field
      if (data.images.length > 0) {
        const imagesSize = JSON.stringify(data.images).length;
        const maxSize = 1000000; // ~1MB in bytes
        
        console.log(`📊 Update: Images array size: ${imagesSize} bytes (max: ${maxSize} bytes)`);
        
        if (imagesSize > maxSize) {
          console.error(`🔥 updateProduct error: Images array too large (${imagesSize} bytes > ${maxSize} bytes)`);
          return res.status(400).json({
            success: false,
            message: `รูปภาพมีขนาดใหญ่เกินไป (${Math.round(imagesSize / 1024)}KB > ${Math.round(maxSize / 1024)}KB). กรุณาลดจำนวนหรือขนาดรูปภาพ`,
            error: `Images array size (${imagesSize} bytes) exceeds Firestore limit (${maxSize} bytes)`
          });
        }
      }
    }

    // Prevent userId from being changed (security measure)
    delete data.userId;

    await db.collection("products").doc(id).update(data);

    console.log(`📦 updateProduct: User ${userId} updated product ${id}`);
    res.status(200).json({ success: true, message: "Updated" });
  } catch (err) {
    console.error("🔥 updateProduct error:", err);
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private
 * @note    Only the owner of the product (userId matches) can delete it
 *          This ensures multi-user security - users can only delete their own posts
 */
export const deleteProduct = async (req, res) => {
  try {
    // Get user ID from authenticated request
    if (!req.user) {
      console.error("🔥 deleteProduct error: req.user is undefined");
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // CRITICAL FIX: Always use string for userId to prevent type mismatch issues
    // Get userId from Firebase Auth (req.user.uid is the source of truth)
    const userId = String(req.user.uid || req.user.id);
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error("🔥 deleteProduct error: User ID not found in req.user", req.user);
      return res.status(401).json({ success: false, message: "User ID not found" });
    }

    const id = req.params.id;

    // Check if product exists and belongs to this user
    const productDoc = await db.collection("products").doc(id).get();
    if (!productDoc.exists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const productData = productDoc.data();
    
    // CRITICAL FIX: Use String() for comparison to handle type mismatches
    // Convert both to strings to ensure consistent comparison
    const storedUserId = String(productData.userId || '');
    const currentUserId = String(userId);
    
    // DEBUG: Log for troubleshooting
    console.log(`🔍 deleteProduct - productId: ${id}`);
    console.log(`🔍 deleteProduct - storedUserId: ${storedUserId} (type: ${typeof productData.userId})`);
    console.log(`🔍 deleteProduct - currentUserId: ${currentUserId} (type: ${typeof userId})`);
    console.log(`🔍 deleteProduct - Match: ${storedUserId === currentUserId}`);
    
    // Authorization check: Only the owner can delete their product
    if (storedUserId !== currentUserId) {
      console.error(`🔥 deleteProduct error: User ${currentUserId} tried to delete product ${id} owned by ${storedUserId}`);
      return res.status(403).json({ 
        success: false, 
        message: "Forbidden: You can only delete your own products" 
      });
    }

    await db.collection("products").doc(id).delete();

    console.log(`📦 deleteProduct: User ${userId} deleted product ${id}`);
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("🔥 deleteProduct error:", err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};
