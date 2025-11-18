# ✅ แก้ไขปัญหา 401 Unauthorized กับ API `/api/chat` - สรุปครบถ้วน

## 🔴 ปัญหาที่พบ

**อาการ:**
- 401 Unauthorized กับ API `/api/chat` ทุกครั้ง
- Frontend ไม่ได้ส่ง Firebase ID Token ใน header
- Backend middleware `verifyToken` ไม่ได้รับ token

**Error:**
```
GET /api/chat 401 (Unauthorized)
Error: No token provided
code: 'NO_TOKEN'
```

---

## 🔍 สาเหตุของปัญหา

### 1. **Frontend Request Interceptor อาจไม่ทำงาน**
- `auth.currentUser` อาจเป็น `null` ในบางกรณี
- Token อาจไม่ได้ refresh ก่อน request
- Interceptor อาจไม่ทำงานในบางกรณี

### 2. **Backend Middleware ตรวจสอบ Header ไม่ครบ**
- ตรวจสอบแค่ `req.headers.authorization` (lowercase)
- ไม่ตรวจสอบ `req.headers.Authorization` (uppercase)
- ไม่มี debug logging เพื่อ troubleshoot

---

## ✅ การแก้ไข

### 1. **Frontend: `client/src/apiServer.ts`**

#### Request Interceptor (แก้ไขแล้ว):
```typescript
// ✅ เพิ่ม logging และ validation
api.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      try {
        // Get fresh token from Firebase Auth
        const token = await currentUser.getIdToken();
        
        // CRITICAL: Set Authorization header
        config.headers.Authorization = `Bearer ${token}`;
        setAuthToken(token);
        
        console.log(`✅ Request interceptor: Token set for ${config.url}`);
      } catch (error) {
        console.error('❌ Error getting token:', error);
        // Fallback to stored token
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
      }
    } else {
      // Fallback to stored token
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      } else {
        console.warn(`⚠️ No token available for ${config.url}`);
      }
    }
    
    // Validate Authorization header exists
    if (!config.headers.Authorization) {
      console.error(`❌ Authorization header missing for ${config.url}`);
    }
    
    return config;
  }
);
```

**Chat API Functions (ไม่ต้องแก้ - ใช้ interceptor):**
```typescript
// ✅ ใช้ api instance ที่มี interceptor แล้ว
export const getChatRooms = () => {
  return api.get('/chat');  // Interceptor จะเพิ่ม Authorization header อัตโนมัติ
};

export const getChatMessages = (chatId: string) => {
  return api.get(`/chat/${chatId}/messages`);  // Interceptor จะเพิ่ม Authorization header อัตโนมัติ
};

export const sendChatMessage = (chatId: string, text: string) => {
  return api.post(`/chat/${chatId}/messages`, { text });  // Interceptor จะเพิ่ม Authorization header อัตโนมัติ
};

export const createChatRoom = (productId: string) => {
  return api.post('/chat', { productId });  // Interceptor จะเพิ่ม Authorization header อัตโนมัติ
};
```

### 2. **Backend: `server/src/middleware/authMiddleware.js`**

#### `firebaseVerifyToken` middleware (แก้ไขแล้ว):
```javascript
const firebaseVerifyToken = async (req, res, next) => {
  try {
    const { auth, db } = await import('../config/firebaseConfig.js');
    
    // Check if Firebase is properly initialized
    if (!auth || !db) {
      return res.status(500).json({
        success: false,
        error: 'Authentication service is not available',
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
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'NO_TOKEN',
        message: 'Authorization header with Bearer token is required'
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // CRITICAL: Validate token is not empty
    if (!token || token.trim() === '') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format',
        code: 'INVALID_TOKEN',
        message: 'Token cannot be empty'
      });
    }
    
    // Verify Firebase Auth token
    const decodedToken = await auth.verifyIdToken(token, true);
    
    // CRITICAL: Validate uid is not a token string
    if (!decodedToken.uid || decodedToken.uid.length > 100) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token - uid appears to be a token string',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'User not found in database',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const userData = userDoc.data();
    
    // CRITICAL FIX: ใช้ decodedToken.uid เท่านั้น (ไม่ใช้ token string)
    req.user = {
      uid: decodedToken.uid,  // ✅ Firebase User UID (NOT token string)
      id: decodedToken.uid,   // ✅ Use uid as id
      email: decodedToken.email,
      displayName: userData.displayName || userData.name || decodedToken.name,
      photoURL: userData.photoURL || userData.avatar || decodedToken.picture,
      emailVerified: decodedToken.email_verified,
      role: userData.role || 'user',
      tokenIssuedAt: new Date(decodedToken.iat * 1000).toISOString(),
      tokenExpireAt: new Date(decodedToken.exp * 1000).toISOString()
    };
    
    console.log(`✅ Firebase Auth Success: ${req.user.email} (UID: ${req.user.uid})`);
    next();
  } catch (error) {
    // Error handling...
  }
};
```

### 3. **Backend: `server/src/controllers/chatController.js`**

#### ทุก function ใช้ `req.user.uid` เท่านั้น (แก้ไขแล้ว):
```javascript
// ✅ getChatRooms
const userId = String(req.user.uid); // ใช้ uid เท่านั้น

// ✅ createChatRoom
const buyerId = String(req.user.uid); // ใช้ uid เท่านั้น

// ✅ getChatRoomById
const userId = String(req.user.uid); // ใช้ uid เท่านั้น

// ✅ postMessage
const senderId = String(req.user.uid); // ใช้ uid เท่านั้น

// ✅ getMessages
const userId = String(req.user.uid); // ใช้ uid เท่านั้น
```

---

## 📝 ไฟล์ที่แก้ไข

### Frontend (1 ไฟล์):
1. ✅ `client/src/apiServer.ts`
   - เพิ่ม logging ใน request interceptor
   - Validate Authorization header exists
   - Improve error handling

### Backend (2 ไฟล์):
2. ✅ `server/src/middleware/authMiddleware.js`
   - ตรวจสอบ header ทั้ง lowercase และ uppercase
   - เพิ่ม debug logging
   - Validate token และ uid
   - ใช้ `decodedToken.uid` เท่านั้น

3. ✅ `server/src/controllers/chatController.js`
   - ทุก function ใช้ `req.user.uid` เท่านั้น
   - เพิ่ม validation เพื่อป้องกัน token string

---

## 🔍 สาเหตุที่เกิด 401

### ปัญหา 1: Frontend ไม่ส่ง Token
**สาเหตุ:**
- `auth.currentUser` เป็น `null` → ไม่มี token
- Request interceptor ไม่ทำงาน → ไม่ได้ set Authorization header
- Token หมดอายุ → ไม่ได้ refresh

**วิธีแก้:**
- Request interceptor ดึง token จาก `auth.currentUser.getIdToken()`
- Set `Authorization: Bearer ${token}` ใน header
- Fallback ไปใช้ stored token ถ้า currentUser เป็น null

### ปัญหา 2: Backend ไม่รับ Token
**สาเหตุ:**
- Header เป็น `Authorization` (uppercase) แต่ backend ตรวจแค่ `authorization` (lowercase)
- Token format ไม่ถูกต้อง → ไม่ผ่าน validation
- Token หมดอายุ → verifyIdToken fail

**วิธีแก้:**
- ตรวจสอบ header ทั้ง `authorization` และ `Authorization`
- Validate token format
- Verify token ด้วย `admin.auth().verifyIdToken()`
- Extract `decodedToken.uid` (ไม่ใช้ token string)

---

## ✅ วิธีแก้ไข

### 1. **Frontend ส่ง Token**
- Request interceptor ดึง token จาก `auth.currentUser.getIdToken()`
- Set `Authorization: Bearer ${token}` ใน header
- Fallback ไปใช้ stored token ถ้า currentUser เป็น null

### 2. **Backend รับ Token**
- ตรวจสอบ header ทั้ง `authorization` และ `Authorization`
- Validate token format
- Verify token ด้วย `admin.auth().verifyIdToken()`
- Extract `decodedToken.uid` (ไม่ใช้ token string)

### 3. **Chat Routes ใช้ UID**
- ทุก function ใช้ `req.user.uid` เท่านั้น
- ไม่ใช้ token string เป็น userId
- Validate uid ไม่ใช่ token string

---

## 🧪 การทดสอบ

1. **ตรวจสอบ Frontend**:
   - เปิด Browser DevTools → Network tab
   - เรียก API `/api/chat`
   - ตรวจสอบ Request Headers: ควรมี `Authorization: Bearer <token>`
   - ตรวจสอบ Console: ควรเห็น `✅ Request interceptor: Token set for /api/chat`

2. **ตรวจสอบ Backend**:
   - ดู backend console logs
   - ควรเห็น: `🔍 firebaseVerifyToken - Authorization header exists: true`
   - ควรเห็น: `✅ Firebase Auth Success: <email> (UID: <uid>)`

3. **ทดสอบ Chat API**:
   - Login
   - เปิด chat page
   - ตรวจสอบว่า chat rooms โหลดได้ (ไม่ควรได้ 401)

---

## 📌 Best Practices

1. **Always use `decodedToken.uid`** (ไม่ใช้ token string)
2. **Check both `authorization` and `Authorization` headers** (case-insensitive)
3. **Validate token before using** (ไม่ empty, format ถูกต้อง)
4. **Use request interceptor** (auto-add Authorization header)
5. **Add debug logging** (เพื่อ troubleshoot)

---

**แก้ไขเสร็จแล้ว! กรุณา restart server และทดสอบอีกครั้ง** 🚀

