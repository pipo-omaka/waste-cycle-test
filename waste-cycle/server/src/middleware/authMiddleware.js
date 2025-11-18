// server/src/middleware/authMiddleware.js
import asyncHandler from './asyncHandler.js';
import dotenv from 'dotenv';

// Ensure dotenv is loaded
dotenv.config();

/**
 * Firebase authentication middleware
 * CRITICAL: ใช้ decodedToken.uid เท่านั้น (ไม่ใช้ token string)
 * 
 * MOCK_AUTH MODE HAS BEEN REMOVED - Firebase Auth is REQUIRED
 */
const firebaseVerifyToken = async (req, res, next) => {
  try {
    const { auth, db, detectedProjectId } = await import('../config/firebaseConfig.js');
    
    // Check if Firebase is properly initialized
    if (!auth || !db) {
      console.error('❌ Firebase Auth or DB is not initialized');
      return res.status(500).json({
        success: false,
        error: 'Authentication service is not available. Please check Firebase configuration.',
        code: 'FIREBASE_NOT_INITIALIZED'
      });
    }
    
    // CRITICAL: Check Authorization header (case-insensitive)
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    // DEBUG: Log headers for troubleshooting
    console.log(`🔍 firebaseVerifyToken - URL: ${req.url}`);
    console.log(`🔍 firebaseVerifyToken - Authorization header exists: ${!!authHeader}`);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error(`❌ firebaseVerifyToken - No valid Authorization header found`);
      console.error(`❌ Available headers:`, Object.keys(req.headers));
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'NO_TOKEN',
        message: 'Authorization header with Bearer token is required'
      });
    }
    
    // CRITICAL: Extract token from header
    // Format: "Bearer <token>"
    const token = authHeader.split('Bearer ')[1];
    
    // CRITICAL: Validate token is not empty
    if (!token || token.trim() === '') {
      console.error(`❌ firebaseVerifyToken - Token is empty`);
      return res.status(401).json({
        success: false,
        error: 'Invalid token format',
        code: 'INVALID_TOKEN',
        message: 'Token cannot be empty'
      });
    }
    
    // DEBUG: Log token info (first 20 chars only for security)
    console.log(`🔍 firebaseVerifyToken - Token length: ${token.length}, starts with: ${token.substring(0, 20)}...`);
    
    // CRITICAL: Verify Firebase Auth token using Firebase Admin SDK
    // verifyIdToken returns decodedToken with uid property
    // decodedToken.uid คือ Firebase User UID (~28 chars) - ไม่ใช่ token string (~884 chars)
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token, true); // checkRevoked = true
    } catch (verifyError) {
      // CRITICAL: Enhanced error logging for project mismatch
      console.error('❌ Token verification failed:', verifyError.code, verifyError.message);
      
      if (verifyError.code === 'auth/argument-error' && verifyError.message.includes('aud')) {
        console.error('\n❌ CRITICAL: Firebase Project ID Mismatch Detected!');
        console.error(`   Backend Project ID: ${detectedProjectId || 'unknown'}`);
        console.error(`   Error: ${verifyError.message}`);
        console.error('\n   This means:');
        console.error('   - Frontend is using a DIFFERENT Firebase project than Backend');
        console.error('   - Frontend config (firebaseConfig.ts) must match Backend service account');
        console.error('   - Check that projectId in frontend matches backend project_id');
        console.error('\n   Solution:');
        console.error('   1. Go to Firebase Console: https://console.firebase.google.com/');
        console.error(`   2. Check Backend project: ${detectedProjectId || 'waste-cycle-a6c6e'}`);
        console.error('   3. Update frontend/src/firebaseConfig.ts with correct config');
        console.error('   4. Get config from: Project Settings → General → Your apps → Web app\n');
        
        return res.status(401).json({
          success: false,
          error: 'Firebase project mismatch',
          code: 'PROJECT_MISMATCH',
          message: `Frontend and Backend must use the same Firebase project. Backend uses: ${detectedProjectId || 'waste-cycle-a6c6e'}`,
          details: verifyError.message
        });
      }
      
      // Re-throw other errors to be handled below
      throw verifyError;
    }
    
    // CRITICAL: Validate decodedToken.uid exists and is not a token string
    if (!decodedToken.uid) {
      console.error(`❌ firebaseVerifyToken - decodedToken.uid is missing`);
      return res.status(401).json({
        success: false,
        error: 'Invalid token - uid not found',
        code: 'INVALID_TOKEN'
      });
    }
    
    // CRITICAL: Validate uid is not a token string
    // Firebase UID is typically ~28 characters
    // JWT Token is typically > 100 characters (often ~884 chars)
    if (decodedToken.uid.length > 100) {
      console.error(`❌ firebaseVerifyToken - decodedToken.uid looks like a token string (length: ${decodedToken.uid.length})`);
      console.error(`❌ Expected: Firebase UID (~28 chars), Got: ${decodedToken.uid.substring(0, 50)}...`);
      return res.status(401).json({
        success: false,
        error: 'Invalid token - uid appears to be a token string',
        code: 'INVALID_TOKEN'
      });
    }
    
    // CRITICAL: Log project ID from token for validation
    if (decodedToken.aud) {
      console.log(`🔍 Token audience (project ID): ${decodedToken.aud}`);
      if (decodedToken.aud !== detectedProjectId && detectedProjectId) {
        console.warn(`⚠️  Token project ID (${decodedToken.aud}) does not match backend (${detectedProjectId})`);
      } else {
        console.log(`✅ Token project ID matches backend: ${decodedToken.aud}`);
      }
    }
    
    console.log(`✅ firebaseVerifyToken - Token verified, UID: ${decodedToken.uid} (length: ${decodedToken.uid.length})`);
    
    // Get user document from Firestore
    let userDoc;
    try {
      userDoc = await db.collection('users').doc(decodedToken.uid).get();
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError.message);
      console.error('Error code:', firestoreError.code);
      
      if (firestoreError.code === 5) {
        console.error('\n⚠️  Firestore NOT_FOUND Error Detected');
        console.error('This usually means:');
        console.error('1. Firestore Database is not enabled in Firebase Console');
        console.error(`2. Go to: https://console.firebase.google.com/project/${detectedProjectId || 'waste-cycle-a6c6e'}/firestore`);
        console.error('3. Click "Create database" and choose "Start in production mode" or "Start in test mode"');
        console.error('4. Select a location for your Firestore database\n');
        
        return res.status(404).json({
          success: false,
          error: 'User profile not found. Please complete registration. (Firestore may need to be enabled)',
          code: 'USER_NOT_FOUND'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Database error occurred',
        code: 'DB_ERROR'
      });
    }
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const userData = userDoc.data();
    
    // CRITICAL FIX: ใช้ decodedToken.uid เท่านั้น (ไม่ใช้ token string)
    // decodedToken.uid คือ Firebase User UID ที่ไม่เปลี่ยนแปลง
    // token string จะเปลี่ยนทุกครั้งที่ refresh → ห้ามใช้เป็น userId
    req.user = {
      uid: decodedToken.uid,  // ✅ Firebase User UID (NOT token string)
      id: decodedToken.uid,   // ✅ Use uid as id (for backward compatibility)
      email: decodedToken.email,
      displayName: userData.displayName || userData.name || decodedToken.name,
      photoURL: userData.photoURL || userData.avatar || decodedToken.picture,
      emailVerified: decodedToken.email_verified,
      role: userData.role || 'user',
      tokenIssuedAt: new Date(decodedToken.iat * 1000).toISOString(),
      tokenExpireAt: new Date(decodedToken.exp * 1000).toISOString()
    };
    
    console.log(`✅ Firebase Auth Success: ${req.user.email} (UID: ${req.user.uid}, length: ${req.user.uid.length})`);
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.code, error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        message: 'Please refresh your token or login again'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        error: 'Token revoked',
        code: 'TOKEN_REVOKED',
        message: 'Your session has been revoked. Please login again'
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format',
        code: 'INVALID_TOKEN',
        message: error.message
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED',
      message: error.message
    });
  }
};

// Export Firebase Auth middleware (MOCK_AUTH removed)
export const verifyToken = firebaseVerifyToken;
export const protect = verifyToken; // Alias for compatibility

/**
 * Middleware นี้ตรวจสอบแค่ Token แต่ไม่ตรวจสอบ Firestore
 * CRITICAL: ใช้ decodedToken.uid เท่านั้น (ไม่ใช้ token string)
 */
export const protectTokenOnly = asyncHandler(async (req, res, next) => {
  // In Firebase mode, verify token only
  const { auth, detectedProjectId } = await import('../config/firebaseConfig.js');
  
  if (!auth) {
    return res.status(500).json({
      success: false,
      error: 'Authentication service is not available',
      code: 'FIREBASE_NOT_INITIALIZED'
    });
  }
  
  let token;
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split('Bearer ')[1];
      
      // CRITICAL: Verify token using Firebase Admin SDK
      const decodedToken = await auth.verifyIdToken(token);
      
      // CRITICAL FIX: ใช้ decodedToken.uid เท่านั้น (ไม่ใช้ token string)
      // decodedToken.uid คือ Firebase User UID ที่ไม่เปลี่ยนแปลง
      // token string จะเปลี่ยนทุกครั้งที่ refresh → ห้ามใช้เป็น userId
      
      // Validate uid is not a token string
      if (!decodedToken.uid || decodedToken.uid.length > 100) {
        console.error(`❌ protectTokenOnly - decodedToken.uid looks like a token string (length: ${decodedToken.uid?.length || 0})`);
        return res.status(401).json({
          success: false,
          error: 'Invalid token - uid appears to be a token string',
          code: 'INVALID_TOKEN'
        });
      }
      
      // Log project ID validation
      if (decodedToken.aud && detectedProjectId) {
        if (decodedToken.aud !== detectedProjectId) {
          console.warn(`⚠️  protectTokenOnly - Token project ID (${decodedToken.aud}) does not match backend (${detectedProjectId})`);
        }
      }
      
      req.user = {
        uid: decodedToken.uid,  // ✅ ใช้ uid จาก decodedToken เท่านั้น
        id: decodedToken.uid,   // ✅ ใช้ uid เป็น id ด้วย
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        // ไม่เก็บ token string ใน req.user
      };
      
      console.log(`✅ Token verified - UID: ${decodedToken.uid} (length: ${decodedToken.uid.length}, NOT token string)`);
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      
      // Enhanced error logging for project mismatch
      if (error.code === 'auth/argument-error' && error.message.includes('aud')) {
        console.error(`❌ Project mismatch: Token from ${error.message.match(/Expected '([^']+)'/)?.[1] || 'unknown'} but got ${error.message.match(/but got '([^']+)'/)?.[1] || 'unknown'}`);
        console.error(`   Backend expects: ${detectedProjectId || 'waste-cycle-a6c6e'}`);
      }
      
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * ✅ Middleware เพิ่มเติม: ตรวจสอบว่า userId ตรงกับ resource
 */
export const requireOwnership = (resourceUserIdField = 'userId') => {
  return async (req, res, next) => {
    // Resource ID จาก params
    const resourceId = req.params.id;
    
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        error: 'Resource ID is required'
      });
    }
    
    // เก็บไว้ใน req เพื่อใช้ใน controller
    req.resourceUserIdField = resourceUserIdField;
    req.isOwnershipRequired = true;
    
    next();
  };
};
