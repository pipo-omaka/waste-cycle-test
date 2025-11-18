import asyncHandler from '../middleware/asyncHandler.js';
import { db } from '../config/firebaseConfig.js';
import crypto from 'crypto';

/**
 * Generate unique chat room ID from two user IDs and product ID
 * MULTI-USER: Creates consistent room ID regardless of who initiates
 * Uses SHA-256 hash to ensure ID is under 1500 bytes (Firestore limit)
 * 
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @param {string} productId - Product ID
 * @returns {string} Unique chat room ID (hashed, max 64 chars)
 */
const generateChatRoomId = (userId1, userId2, productId) => {
  // Sort user IDs alphabetically to ensure consistency
  const sortedIds = [userId1, userId2].sort();
  
  // Create a unique string from participants and product
  const uniqueString = `${sortedIds[0]}_${sortedIds[1]}_${productId}`;
  
  // Use SHA-256 hash to create a short, unique ID (64 characters)
  // This ensures the ID is always under 1500 bytes (Firestore limit)
  const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');
  
  // Use first 32 characters of hash (still unique enough, and much shorter)
  // This gives us a 32-character ID instead of potentially very long string
  return hash.substring(0, 32);
};

/**
 * @desc    Get all chat rooms for the logged-in user
 * @route   GET /api/chat
 * @access  Private
 * @note    MULTI-USER: Returns only chat rooms where user is a participant
 */
const getChatRooms = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('User not authenticated');
  }

  // CRITICAL FIX: ใช้ req.user.uid เท่านั้น (ไม่ใช้ req.user.id)
  // req.user.uid มาจาก decodedToken.uid ซึ่งเป็น Firebase User UID ที่ไม่เปลี่ยนแปลง
  if (!req.user || !req.user.uid) {
    console.error("🔥 getChatRooms error: req.user.uid is missing", req.user);
    res.status(401);
    throw new Error('User ID not found - uid is required');
  }
  
  // Validate that uid is not a token string
  if (req.user.uid.length > 100) {
    console.error(`🔥 getChatRooms error: req.user.uid looks like a token string (length: ${req.user.uid.length})`);
    res.status(401);
    throw new Error('Invalid user ID - uid appears to be a token string');
  }
  
  const userId = String(req.user.uid); // ✅ ใช้ uid เท่านั้น

  // MULTI-USER: Get chat rooms where user is buyer or seller
  const chatsAsBuyerSnapshot = await db.collection('chatRooms')
    .where('participants', 'array-contains', userId)
    .get();

  const chatRooms = chatsAsBuyerSnapshot.docs.map(doc => {
    const data = doc.data();
    // SAFETY CHECK: Ensure participants is an array and convert to strings
    const participants = Array.isArray(data.participants) 
      ? data.participants.map(p => String(p)) 
      : [];
    const userIdStr = String(userId);
    const participantIndex = participants.findIndex(id => String(id) !== userIdStr);
    
    return {
      id: doc.id,
      ...data,
      // Ensure participants are strings
      participants: participants,
      // Determine other participant
      otherParticipantId: participants.find(id => String(id) !== userIdStr) || null,
      otherParticipantName: (data.participantNames && Array.isArray(data.participantNames) && participantIndex >= 0) 
        ? data.participantNames[participantIndex] 
        : 'Unknown',
    };
  });

  // Sort by last message timestamp (newest first)
  chatRooms.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  res.status(200).json({ success: true, data: chatRooms });
});

/**
 * @desc    Create or get existing chat room
 * @route   POST /api/chat
 * @access  Private
 * @note    MULTI-USER: Creates unique chat room ID based on participants
 *          If room exists, returns existing room
 */
const createChatRoom = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('User not authenticated');
  }

  const { productId } = req.body;
  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required');
  }

  // CRITICAL FIX: ใช้ req.user.uid เท่านั้น (ไม่ใช้ req.user.id)
  // req.user.uid มาจาก decodedToken.uid ซึ่งเป็น Firebase User UID ที่ไม่เปลี่ยนแปลง
  // ห้ามใช้ token string เป็น userId
  if (!req.user || !req.user.uid) {
    console.error("🔥 createChatRoom error: req.user.uid is missing", req.user);
    res.status(401);
    throw new Error('User ID not found - uid is required');
  }
  
  // Validate that uid is not a token string (tokens are usually > 100 chars, uid is ~28 chars)
  if (req.user.uid.length > 100) {
    console.error(`🔥 createChatRoom error: req.user.uid looks like a token string (length: ${req.user.uid.length})`);
    res.status(401);
    throw new Error('Invalid user ID - uid appears to be a token string');
  }
  
  const buyerId = String(req.user.uid); // ✅ ใช้ uid เท่านั้น
  
  console.log(`📝 createChatRoom - buyerId (uid): ${buyerId} (length: ${buyerId.length}, type: ${typeof buyerId})`);

  // Get product to find seller
  const productDoc = await db.collection('products').doc(productId).get();
  if (!productDoc.exists) {
    res.status(404);
    throw new Error('Product not found');
  }

  const product = productDoc.data();
  // CRITICAL FIX: Normalize sellerId to string
  const sellerId = String(product.userId || '');

  // Prevent users from chatting with themselves
  if (sellerId === buyerId) {
    res.status(400);
    throw new Error("You cannot start a chat for your own product");
  }

  // MULTI-USER: Generate unique chat room ID (using hash to prevent 1500-byte limit error)
  const chatRoomId = generateChatRoomId(buyerId, sellerId, productId);

  // Check if chat room already exists
  const chatRoomRef = db.collection('chatRooms').doc(chatRoomId);
  const chatRoomDoc = await chatRoomRef.get();

  if (chatRoomDoc.exists) {
    // Room exists, return it
    const existingData = chatRoomDoc.data();
    
    // CRITICAL FIX: Normalize participants and buyerId to strings for comparison
    const participants = Array.isArray(existingData.participants) 
      ? existingData.participants.map(p => String(p)) 
      : [];
    const buyerIdStr = String(buyerId);
    
    res.status(200).json({
      success: true,
      data: {
        id: chatRoomId,
        ...existingData,
        participants: participants, // Ensure participants are strings
        otherParticipantId: participants.find(id => String(id) !== buyerIdStr) || null,
      },
      message: "Chat room already exists"
    });
    return;
  }

  // Get user names for the chat room
  const buyerDoc = await db.collection('users').doc(buyerId).get();
  const sellerDoc = await db.collection('users').doc(sellerId).get();
  
  // SAFETY CHECK: Get user names with fallbacks
  const buyerData = buyerDoc.exists ? buyerDoc.data() : null;
  const buyerName = (buyerData && buyerData.name) || req.user.displayName || req.user.name || 'Buyer';
  
  const sellerData = sellerDoc.exists ? sellerDoc.data() : null;
  const sellerName = (sellerData && sellerData.name) || product.farmName || 'Seller';

  // Create new chat room
  // IMPORTANT: Ensure participants are stored as strings (not mixed types)
  const newChatRoom = {
    participants: [String(buyerId), String(sellerId)], // MULTI-USER: Array of participant IDs (as strings)
    participantNames: [buyerName, sellerName], // Names corresponding to participants array
    productId: String(productId), // Ensure productId is string
    productTitle: product.title || '',
    productImage: (product.images && Array.isArray(product.images) && product.images.length > 0) 
      ? product.images[0] 
      : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessage: '',
    lastMessageSenderId: null,
    // Legacy fields for backward compatibility
    buyerId: String(buyerId),
    sellerId: String(sellerId),
    buyerName: buyerName,
    sellerName: sellerName,
  };
  
  // DEBUG: Log for troubleshooting
  console.log(`📝 Creating chat room - chatRoomId: ${chatRoomId}`);
  console.log(`📝 Participants: ${JSON.stringify(newChatRoom.participants)}`);

  await chatRoomRef.set(newChatRoom);

  res.status(201).json({
    success: true,
    data: {
      id: chatRoomId,
      ...newChatRoom,
      otherParticipantId: sellerId,
    },
  });
});

/**
 * @desc    Get a single chat room by ID
 * @route   GET /api/chat/:id
 * @access  Private
 * @note    MULTI-USER: Only participants can access the room
 */
const getChatRoomById = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('User not authenticated');
  }

  // CRITICAL FIX: ใช้ req.user.uid เท่านั้น (ไม่ใช้ req.user.id)
  // req.user.uid มาจาก decodedToken.uid ซึ่งเป็น Firebase User UID ที่ไม่เปลี่ยนแปลง
  if (!req.user || !req.user.uid) {
    console.error("🔥 getChatRoomById error: req.user.uid is missing", req.user);
    res.status(401);
    throw new Error('User ID not found - uid is required');
  }
  
  // Validate that uid is not a token string
  if (req.user.uid.length > 100) {
    console.error(`🔥 getChatRoomById error: req.user.uid looks like a token string (length: ${req.user.uid.length})`);
    res.status(401);
    throw new Error('Invalid user ID - uid appears to be a token string');
  }
  
  const userId = String(req.user.uid); // ✅ ใช้ uid เท่านั้น

  const chatRoomId = req.params.id;
  const chatRoomDoc = await db.collection('chatRooms').doc(chatRoomId).get();

  if (!chatRoomDoc.exists) {
    res.status(404);
    throw new Error('Chat room not found');
  }

  const chatRoomData = chatRoomDoc.data();
  
  // MULTI-USER: Check if user is a participant
  // SAFETY CHECK: Ensure participants is an array and convert to strings
  const participants = Array.isArray(chatRoomData.participants) 
    ? chatRoomData.participants.map(p => String(p)) 
    : [];
  const userIdStr = String(userId);
  
  const isParticipant = participants.some(participantId => String(participantId) === userIdStr);
  if (!isParticipant) {
    console.error(`❌ getChatRoomById - User ${userId} is not a participant in room ${chatRoomId}`);
    res.status(403);
    throw new Error('Not authorized to access this chat room');
  }

  res.status(200).json({
    success: true,
    data: {
      id: chatRoomDoc.id,
      ...chatRoomData,
      participants: participants, // Ensure participants are strings
      otherParticipantId: participants.find(id => String(id) !== userIdStr) || null,
    }
  });
});

/**
 * @desc    Post a new message
 * @route   POST /api/chat/:id/messages
 * @access  Private
 * @note    MULTI-USER: Message includes senderId and receiverId
 */
const postMessage = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('User not authenticated');
  }

  // CRITICAL FIX: ใช้ req.user.uid เท่านั้น (ไม่ใช้ req.user.id)
  // req.user.uid มาจาก decodedToken.uid ซึ่งเป็น Firebase User UID ที่ไม่เปลี่ยนแปลง
  if (!req.user || !req.user.uid) {
    console.error("🔥 postMessage error: req.user.uid is missing", req.user);
    res.status(401);
    throw new Error('User ID not found - uid is required');
  }
  
  // Validate that uid is not a token string
  if (req.user.uid.length > 100) {
    console.error(`🔥 postMessage error: req.user.uid looks like a token string (length: ${req.user.uid.length})`);
    res.status(401);
    throw new Error('Invalid user ID - uid appears to be a token string');
  }
  
  const senderId = String(req.user.uid); // ✅ ใช้ uid เท่านั้น

  const chatRoomId = req.params.id;
  const { text } = req.body;

  if (!text || text.trim() === '') {
    res.status(400);
    throw new Error('Message text is required');
  }

  // Get chat room
  const chatRoomRef = db.collection('chatRooms').doc(chatRoomId);
  const chatRoomDoc = await chatRoomRef.get();

  if (!chatRoomDoc.exists) {
    res.status(404);
    throw new Error('Chat room not found');
  }

  const chatRoomData = chatRoomDoc.data();
  
  // MULTI-USER: Check if user is a participant
  // SAFETY CHECK: Ensure participants is an array and convert to strings
  const participants = Array.isArray(chatRoomData.participants) 
    ? chatRoomData.participants.map(p => String(p)) 
    : [];
  const senderIdStr = String(senderId);
  
  const isParticipant = participants.some(participantId => String(participantId) === senderIdStr);
  if (!isParticipant) {
    console.error(`❌ postMessage - User ${senderId} is not a participant in room ${chatRoomId}`);
    res.status(403);
    throw new Error('Not authorized to post in this chat room');
  }

  // MULTI-USER: Determine receiver (the other participant)
  const receiverId = participants.find(id => String(id) !== senderIdStr);
  if (!receiverId) {
    res.status(400);
    throw new Error('Cannot determine receiver');
  }

  // Create message with senderId and receiverId
  const newMessage = {
    chatRoomId,
    senderId,        // MULTI-USER: Who sent the message
    receiverId,      // MULTI-USER: Who receives the message
    text: text.trim(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  // MULTI-USER: Store message in subcollection
  const messageRef = await chatRoomRef.collection('messages').add(newMessage);
  
  // Update chat room with last message
  await chatRoomRef.update({
    lastMessage: text.trim(),
    lastMessageSenderId: senderId,
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    data: {
      id: messageRef.id,
      ...newMessage
    }
  });
});

/**
 * @desc    Get messages for a chat room
 * @route   GET /api/chat/:id/messages
 * @access  Private
 * @note    MULTI-USER: Only participants can access messages
 */
const getMessages = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('User not authenticated');
  }

  // CRITICAL FIX: ใช้ req.user.uid เท่านั้น (ไม่ใช้ req.user.id)
  // req.user.uid มาจาก decodedToken.uid ซึ่งเป็น Firebase User UID ที่ไม่เปลี่ยนแปลง
  // ห้ามใช้ token string เป็น userId
  if (!req.user || !req.user.uid) {
    console.error("🔥 getMessages error: req.user.uid is missing", req.user);
    res.status(401);
    throw new Error('User ID not found - uid is required');
  }
  
  // Validate that uid is not a token string (tokens are usually > 100 chars, uid is ~28 chars)
  if (req.user.uid.length > 100) {
    console.error(`🔥 getMessages error: req.user.uid looks like a token string (length: ${req.user.uid.length})`);
    res.status(401);
    throw new Error('Invalid user ID - uid appears to be a token string');
  }
  
  const userId = String(req.user.uid); // ✅ ใช้ uid เท่านั้น

  const chatRoomId = req.params.id;
  const chatRoomDoc = await db.collection('chatRooms').doc(chatRoomId).get();

  if (!chatRoomDoc.exists) {
    res.status(404);
    throw new Error('Chat room not found');
  }

  const chatRoomData = chatRoomDoc.data();
  
  // DEBUG: Log for troubleshooting
  console.log(`🔍 getMessages - chatRoomId: ${chatRoomId}`);
  console.log(`🔍 getMessages - req.user.uid: ${req.user.uid}, req.user.id: ${req.user.id}`);
  console.log(`🔍 getMessages - Final userId: ${userId} (type: ${typeof userId})`);
  console.log(`🔍 getMessages - participants (raw):`, chatRoomData.participants);
  console.log(`🔍 getMessages - participants types:`, 
    chatRoomData.participants ? chatRoomData.participants.map(p => `${p} (${typeof p})`) : 'N/A');
  
  // MULTI-USER: Check if user is a participant
  // SAFETY CHECK: Ensure participants is an array and convert to strings
  const participants = Array.isArray(chatRoomData.participants) 
    ? chatRoomData.participants.map(p => String(p)) 
    : [];
  const userIdStr = String(userId);
  
  console.log(`🔍 getMessages - participants (normalized):`, participants);
  console.log(`🔍 getMessages - userIdStr: ${userIdStr}`);
  
  // Check if user is in participants (support both string and number comparison)
  const isParticipant = participants.some(participantId => {
    // Convert both to strings for comparison (handles type mismatches)
    const match = String(participantId) === userIdStr;
    if (match) {
      console.log(`✅ getMessages - Match found: ${participantId} === ${userIdStr}`);
    }
    return match;
  });
  
  if (!isParticipant) {
    console.error(`❌ getMessages - User ${userIdStr} is not a participant in room ${chatRoomId}`);
    console.error(`❌ Stored participants: ${JSON.stringify(participants)}`);
    console.error(`❌ Current userId: ${userIdStr}`);
    console.error(`❌ Comparison details:`, participants.map(p => ({
      participant: p,
      userId: userIdStr,
      match: String(p) === userIdStr
    })));
    res.status(403);
    throw new Error('Not authorized to access this chat room');
  }
  
  console.log(`✅ getMessages - User ${userIdStr} is authorized to access room ${chatRoomId}`);

  // MULTI-USER: Get messages from subcollection
  const messagesSnapshot = await db.collection('chatRooms')
    .doc(chatRoomId)
    .collection('messages')
    .orderBy('timestamp', 'asc')
    .get();

  const messages = messagesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  res.status(200).json({ success: true, data: messages });
});

/**
 * @desc    Delete a chat room (Admin only)
 * @route   DELETE /api/chat/:id
 * @access  Private/Admin
 */
const deleteChatRoom = asyncHandler(async (req, res) => {
  const chatRoomId = req.params.id;

  // TODO: Add logic to delete subcollection (messages) if needed, or use a Firebase Function
  await db.collection('chatRooms').doc(chatRoomId).delete();

  res.status(200).json({ success: true, message: 'Chat room deleted' });
});

export {
  getChatRooms,
  createChatRoom,
  getChatRoomById,
  postMessage,
  getMessages,
  deleteChatRoom
};
