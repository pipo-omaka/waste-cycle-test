# ✅ แก้ไขปัญหา 401 Unauthorized กับ API `/api/chat`

## 🔴 ปัญหาที่พบ

**อาการ:**
- 401 Unauthorized กับ API `/api/chat` ทุกครั้ง
- Frontend ไม่ได้ส่ง Firebase ID Token ใน header
- Backend middleware `verifyToken` ไม่ได้รับ token

**Error:**
```
GET /api/chat 401 (Unauthorized)
Error: No token provided
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

#### แก้ไข Request Interceptor:
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

### 2. **Backend: `server/src/middleware/authMiddleware.js`**

#### แก้ไข `firebaseVerifyToken`:
```javascript
// ✅ ตรวจสอบ header ทั้ง lowercase และ uppercase
const authHeader = req.headers.authorization || req.headers.Authorization;

// ✅ เพิ่ม debug logging
console.log(`🔍 firebaseVerifyToken - URL: ${req.url}`);
console.log(`🔍 firebaseVerifyToken - Authorization header exists: ${!!authHeader}`);

if (!authHeader || !authHeader.startsWith('Bearer ')) {
  console.error(`❌ No valid Authorization header found`);
  return res.status(401).json({
    success: false,
    error: 'No token provided',
    code: 'NO_TOKEN',
    message: 'Authorization header with Bearer token is required'
  });
}

const token = authHeader.split('Bearer ')[1];

// ✅ Validate token is not empty
if (!token || token.trim() === '') {
  return res.status(401).json({
    success: false,
    error: 'Invalid token format',
    code: 'INVALID_TOKEN'
  });
}

// ✅ Verify token and extract uid
const decodedToken = await auth.verifyIdToken(token, true);

// ✅ Validate uid is not a token string
if (!decodedToken.uid || decodedToken.uid.length > 100) {
  return res.status(401).json({
    success: false,
    error: 'Invalid token - uid appears to be a token string',
    code: 'INVALID_TOKEN'
  });
}

// ✅ Set req.user with uid (NOT token string)
req.user = {
  uid: decodedToken.uid,  // ✅ Firebase User UID
  id: decodedToken.uid,
  ...
};
```

---

## 📝 ไฟล์ที่แก้ไข

### Frontend (1 ไฟล์):
1. ✅ `client/src/apiServer.ts`
   - เพิ่ม logging ใน request interceptor
   - Validate Authorization header exists
   - Improve error handling

### Backend (1 ไฟล์):
2. ✅ `server/src/middleware/authMiddleware.js`
   - ตรวจสอบ header ทั้ง lowercase และ uppercase
   - เพิ่ม debug logging
   - Validate token และ uid
   - ใช้ `decodedToken.uid` เท่านั้น

---

## 🔍 สาเหตุที่เกิด 401

### ปัญหา 1: Frontend ไม่ส่ง Token
- `auth.currentUser` เป็น `null` → ไม่มี token
- Request interceptor ไม่ทำงาน → ไม่ได้ set Authorization header
- Token หมดอายุ → ไม่ได้ refresh

### ปัญหา 2: Backend ไม่รับ Token
- Header เป็น `Authorization` (uppercase) แต่ backend ตรวจแค่ `authorization` (lowercase)
- Token format ไม่ถูกต้อง → ไม่ผ่าน validation
- Token หมดอายุ → verifyIdToken fail

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

---

## 🧪 การทดสอบ

1. **ตรวจสอบ Frontend**:
   - เปิด Browser DevTools → Network tab
   - เรียก API `/api/chat`
   - ตรวจสอบ Request Headers: ควรมี `Authorization: Bearer <token>`

2. **ตรวจสอบ Backend**:
   - ดู backend console logs
   - ควรเห็น: `✅ Request interceptor: Token set for /api/chat`
   - ควรเห็น: `✅ Firebase Auth Success: <email> (UID: <uid>)`

3. **ทดสอบ Chat API**:
   - Login
   - เปิด chat page
   - ตรวจสอบว่า chat rooms โหลดได้ (ไม่ควรได้ 401)

---

**แก้ไขเสร็จแล้ว! กรุณา restart server และทดสอบอีกครั้ง** 🚀

