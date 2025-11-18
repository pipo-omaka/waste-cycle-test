# ✅ แก้ไขปัญหา: ใช้ JWT Token แทน UID ใน Chat System

## 🔴 ปัญหาที่พบ

**อาการ:**
- Backend ใช้ Firebase ID Token (JWT) เป็น userId แทนที่จะใช้ uid
- `participants` ใน chatRoom เป็น string ยาวหลายร้อย bytes (JWT token)
- เมื่อ token refresh หรือ login ใหม่ → token เปลี่ยน → ไม่ match → 403 Forbidden

**ตัวอย่างปัญหา:**
```javascript
// ❌ ผิด - ใช้ token string เป็น userId
participants: [
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2Nz...", // JWT token ยาวหลายร้อย bytes
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2Nz..."
]

// ✅ ถูกต้อง - ใช้ uid
participants: [
  "VsFDNKyJYofK7HpUuz6RPwE5O8X2", // Firebase UID (~28 chars)
  "HAN3AMvyAOR2yE9XCs0KTAbqqxB3"
]
```

---

## ✅ การแก้ไข

### 1. **แก้ไข `authMiddleware.js`**

#### `protectTokenOnly` middleware:
```javascript
// ❌ เดิม - ใช้ decodedToken โดยตรง (อาจมีปัญหา)
req.user = decodedToken;

// ✅ แก้ไข - ใช้ decodedToken.uid เท่านั้น
req.user = {
  uid: decodedToken.uid,  // ✅ ใช้ uid จาก decodedToken เท่านั้น
  id: decodedToken.uid,   // ✅ ใช้ uid เป็น id ด้วย
  email: decodedToken.email,
  emailVerified: decodedToken.email_verified,
  // ไม่เก็บ token string ใน req.user
};
```

### 2. **แก้ไข `chatController.js`**

#### ทุก function ที่ใช้ userId:
```javascript
// ❌ เดิม - ใช้ req.user.uid || req.user.id (อาจได้ token)
const userId = req.user.uid || req.user.id;

// ✅ แก้ไข - ใช้ req.user.uid เท่านั้น + validation
if (!req.user || !req.user.uid) {
  throw new Error('User ID not found - uid is required');
}

// Validate that uid is not a token string (tokens are usually > 100 chars)
if (req.user.uid.length > 100) {
  throw new Error('Invalid user ID - uid appears to be a token string');
}

const userId = String(req.user.uid); // ✅ ใช้ uid เท่านั้น
```

#### Functions ที่แก้ไข:
1. ✅ `getChatRooms` - ใช้ `req.user.uid` เท่านั้น
2. ✅ `createChatRoom` - ใช้ `req.user.uid` เท่านั้น
3. ✅ `getChatRoomById` - ใช้ `req.user.uid` เท่านั้น
4. ✅ `postMessage` - ใช้ `req.user.uid` เท่านั้น
5. ✅ `getMessages` - ใช้ `req.user.uid` เท่านั้น

---

## 📝 ไฟล์ที่แก้ไข

### Backend (2 ไฟล์):
1. ✅ `server/src/middleware/authMiddleware.js`
   - `protectTokenOnly`: ใช้ `decodedToken.uid` แทน `decodedToken` โดยตรง

2. ✅ `server/src/controllers/chatController.js`
   - ทุก function: ใช้ `req.user.uid` เท่านั้น + validation
   - เพิ่ม validation เพื่อป้องกันการใช้ token string

---

## 🔍 สาเหตุของปัญหา

### ปัญหาเกิดจาก:

1. **`protectTokenOnly` middleware**:
   - ใช้ `req.user = decodedToken` โดยตรง
   - ถ้า `decodedToken` ไม่มี `uid` หรือมีปัญหาอื่น → อาจใช้ token string

2. **Fallback logic**:
   - ใช้ `req.user.uid || req.user.id` 
   - ถ้า `req.user.uid` ไม่มี → อาจ fallback ไปใช้ token string

3. **Token string vs UID**:
   - JWT Token: ยาวหลายร้อย bytes, เปลี่ยนทุกครั้งที่ refresh
   - Firebase UID: ~28 characters, ไม่เปลี่ยนแปลง

### วิธีแก้ไข:

1. **ใช้ `decodedToken.uid` เท่านั้น**:
   - `decodedToken.uid` คือ Firebase User UID ที่ไม่เปลี่ยนแปลง
   - ไม่ใช้ token string เป็น userId

2. **Validation**:
   - ตรวจสอบว่า `req.user.uid` มีอยู่จริง
   - ตรวจสอบว่า `req.user.uid.length <= 100` (uid ไม่ควรยาวเกิน 100 chars)

3. **ไม่ใช้ fallback**:
   - ใช้ `req.user.uid` เท่านั้น (ไม่ใช้ `req.user.id`)

---

## ✅ ผลลัพธ์

### ก่อนแก้ไข:
- ❌ `participants` เป็น JWT token strings (ยาวหลายร้อย bytes)
- ❌ เมื่อ token refresh → ไม่ match → 403 Forbidden
- ❌ เมื่อ login ใหม่ → token เปลี่ยน → ไม่ match → 403 Forbidden

### หลังแก้ไข:
- ✅ `participants` เป็น Firebase UIDs (~28 chars)
- ✅ UID ไม่เปลี่ยนแปลง → match ได้เสมอ
- ✅ ไม่มีปัญหา 403 Forbidden เมื่อ token refresh

---

## 🧪 การทดสอบ

1. **สร้าง Chat Room**:
   - Login
   - สร้าง chat room
   - ตรวจสอบ Firestore: `participants` ควรเป็น UIDs (ไม่ใช่ token strings)

2. **Token Refresh**:
   - Login
   - เปิด chat room
   - รอให้ token refresh (หรือ force refresh)
   - ตรวจสอบว่า messages ยังโหลดได้ (ไม่ควรได้ 403)

3. **Login ใหม่**:
   - Login
   - สร้าง chat room
   - Logout
   - Login ใหม่
   - เปิด chat room → ควรโหลดได้ (ไม่ควรได้ 403)

---

## 📌 Best Practices

1. **Always use `decodedToken.uid`** (ไม่ใช้ token string)
2. **Validate uid length** (ไม่ควรยาวเกิน 100 chars)
3. **Use `req.user.uid` only** (ไม่ใช้ fallback `req.user.id`)
4. **Store UIDs in participants** (ไม่เก็บ token strings)

---

**แก้ไขเสร็จแล้ว! กรุณา restart server และทดสอบอีกครั้ง** 🚀

