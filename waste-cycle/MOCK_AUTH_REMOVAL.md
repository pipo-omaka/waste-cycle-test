# 🔧 MOCK_AUTH Removal - Complete Solution

## ❌ ปัญหาที่พบ

Backend กำลังรันใน **MOCK_AUTH mode** ทำให้:
- ไม่ใช้ Firebase Auth จริง
- `req.user.uid` กลายเป็น ID Token ยาว ~884 ตัวอักษรแทนที่จะเป็น Firebase UID จริง (~28 ตัวอักษร)
- `chatRoom.participants` เก็บ token strings แทน UIDs
- Authorization checks ล้มเหลว → `403 Forbidden`
- Chat rooms ไม่ match กันระหว่าง users

---

## ✅ วิธีแก้ไข

### 1. ปิด MOCK_AUTH ทั้งหมด

**ไฟล์ที่แก้ไข:**
- ✅ `server/src/middleware/authMiddleware.js` - ลบ `USE_MOCK_AUTH` และ `mockVerifyToken`
- ✅ `server/src/config/firebaseConfig.js` - ลบ MOCK_AUTH fallback logic
- ✅ `server/server.js` - ลบ MOCK_AUTH log message

**การเปลี่ยนแปลง:**
```javascript
// ❌ เก่า: มี MOCK_AUTH mode
const USE_MOCK_AUTH = process.env.USE_MOCK_AUTH === 'true';
export const verifyToken = USE_MOCK_AUTH ? mockVerifyToken : firebaseVerifyToken;

// ✅ ใหม่: ใช้ Firebase Auth เท่านั้น
export const verifyToken = firebaseVerifyToken;
```

---

### 2. ใช้ Firebase Admin SDK จริง

**ไฟล์:** `server/src/middleware/authMiddleware.js`

```javascript
// CRITICAL: Verify Firebase Auth token using Firebase Admin SDK
const decodedToken = await auth.verifyIdToken(token, true);

// CRITICAL: ใช้ decodedToken.uid เท่านั้น (ไม่ใช้ token string)
req.user = {
  uid: decodedToken.uid,  // ✅ Firebase UID (~28 chars)
  id: decodedToken.uid,   // ✅ Use uid as id
  email: decodedToken.email,
  // ...
};
```

**Validation:**
- ตรวจสอบ `decodedToken.uid` มีอยู่จริง
- ตรวจสอบ `uid.length <= 100` (UID ~28 chars, Token > 100 chars)

---

### 3. Chat Routes ใช้ req.user.uid เท่านั้น

**ไฟล์:** `server/src/controllers/chatController.js`

**Functions ที่แก้ไข:**
- ✅ `getChatRooms()` - ใช้ `req.user.uid` สำหรับ query
- ✅ `createChatRoom()` - ใช้ `req.user.uid` เป็น `buyerId`
- ✅ `getChatRoomById()` - ใช้ `req.user.uid` สำหรับ authorization
- ✅ `postMessage()` - ใช้ `req.user.uid` เป็น `senderId`
- ✅ `getMessages()` - ใช้ `req.user.uid` สำหรับ authorization

**Participants Array:**
```javascript
// ✅ ถูกต้อง: เก็บ UIDs เท่านั้น
participants: [String(buyerId), String(sellerId)]
// Example: ["VsFDNKyJYofK7HpUuz6RPwE5O8X2", "HAN3AMvyAOR2yE9XCs0KTAbqqxB3"]

// ❌ ผิด: ห้ามเก็บ token strings
// participants: [token1, token2]  // ❌ Token strings (~884 chars each)
```

---

### 4. Cleanup Script

**ไฟล์:** `server/scripts/cleanup-chat-rooms.js`

**Usage:**
```bash
cd waste-cycle/server
node scripts/cleanup-chat-rooms.js
```

**Script นี้จะ:**
- ค้นหา chat rooms ที่มี `participants` เป็น token strings (length > 100)
- ลบ chat rooms เหล่านั้นออก
- แสดงสรุปผลการลบ

**⚠️ WARNING:** Backup Firestore database ก่อนรัน script!

---

## 📋 ไฟล์ที่แก้ไข

### Backend:
1. ✅ `server/src/middleware/authMiddleware.js`
   - ลบ `USE_MOCK_AUTH` และ `mockVerifyToken`
   - ใช้ `firebaseVerifyToken` เท่านั้น
   - Validation: ตรวจสอบ `uid.length <= 100`

2. ✅ `server/src/config/firebaseConfig.js`
   - ลบ MOCK_AUTH fallback logic
   - Firebase initialization เป็น required (exit if failed)

3. ✅ `server/server.js`
   - ลบ MOCK_AUTH log message
   - แสดง "Using Firebase Auth" message

4. ✅ `server/src/controllers/chatController.js`
   - ทุก function ใช้ `req.user.uid` เท่านั้น
   - Validation: ตรวจสอบ `req.user.uid.length <= 100`
   - `participants` array เก็บ UIDs เท่านั้น

5. ✅ `server/scripts/cleanup-chat-rooms.js`
   - Script สำหรับลบ chat rooms เก่าที่เก็บ token strings

---

## 🔍 ทำไม MOCK_AUTH ทำให้ระบบพัง?

### MOCK_AUTH Mode:
```javascript
// ❌ MOCK_AUTH: ใช้ token string เป็น uid
const token = authHeader.split('Bearer ')[1];  // Token ~884 chars
req.user = {
  uid: token,  // ❌ ใช้ token string เป็น uid!
  id: token
};
```

**ผลกระทบ:**
1. **req.user.uid เป็น token string (~884 chars)** แทน Firebase UID (~28 chars)
2. **chatRoom.participants เก็บ token strings** → Firestore document ID limit (1500 bytes) exceeded
3. **Authorization checks ล้มเหลว** → `participants.includes(userId)` ไม่ match เพราะ compare token !== uid
4. **Chat rooms ไม่ match กัน** → User A สร้าง room ด้วย token, User B query ด้วย uid → ไม่เจอ room

### Firebase Auth Mode (ถูกต้อง):
```javascript
// ✅ Firebase Auth: ใช้ decodedToken.uid
const decodedToken = await auth.verifyIdToken(token);
req.user = {
  uid: decodedToken.uid,  // ✅ Firebase UID (~28 chars)
  id: decodedToken.uid
};
```

**ผลลัพธ์:**
- ✅ `req.user.uid` เป็น Firebase UID จริง (~28 chars)
- ✅ `chatRoom.participants` เก็บ UIDs เท่านั้น
- ✅ Authorization checks ทำงานถูกต้อง
- ✅ Chat rooms match กันทั้งสองฝั่ง

---

## ✅ หลังแก้แล้ว Chat จะทำงานปกติอย่างไร?

### Flow การทำงาน:

1. **User Login:**
   ```
   Frontend → Firebase Auth → ได้ Firebase User (มี uid)
   ```

2. **Get ID Token:**
   ```typescript
   const token = await currentUser.getIdToken();
   // Token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." (~884 chars)
   ```

3. **Send Request:**
   ```typescript
   headers: {
     Authorization: `Bearer ${token}`  // ✅ ส่ง token ใน header
   }
   ```

4. **Backend Verify Token:**
   ```javascript
   const decodedToken = await auth.verifyIdToken(token);
   // decodedToken.uid: "VsFDNKyJYofK7HpUuz6RPwE5O8X2" (~28 chars)
   
   req.user = {
     uid: decodedToken.uid,  // ✅ ใช้ uid เท่านั้น
     id: decodedToken.uid
   };
   ```

5. **Create Chat Room:**
   ```javascript
   const buyerId = String(req.user.uid);  // ✅ UID (~28 chars)
   const sellerId = String(product.userId);  // ✅ UID (~28 chars)
   
   participants: [buyerId, sellerId]  // ✅ Array of UIDs
   ```

6. **Authorization Check:**
   ```javascript
   const userId = String(req.user.uid);  // ✅ UID
   const isParticipant = participants.some(p => String(p) === userId);
   // ✅ Match! เพราะทั้งสองฝั่งเป็น UID
   ```

### ผลลัพธ์:
- ✅ `participants` array เก็บ UIDs เท่านั้น (~28 chars each)
- ✅ Authorization checks ทำงานถูกต้อง (compare UID === UID)
- ✅ Chat rooms match กันทั้งสองฝั่ง
- ✅ Messages ส่งถึงกันได้
- ✅ ไม่มี 401/403 errors

---

## 🧪 การทดสอบ

### 1. ตรวจสอบ Backend:
```bash
cd waste-cycle/server
npm start
# ควรเห็น: "✅ Using Firebase Auth (MOCK_AUTH mode has been removed)"
# ไม่ควรเห็น: "⚠️ Running in MOCK_AUTH mode"
```

### 2. ตรวจสอบ Firestore:
```bash
# เปิด Firebase Console → Firestore
# ตรวจสอบ chatRooms collection:
#   ✅ participants: ["<uid1>", "<uid2>"] (แต่ละตัว ~28 chars)
#   ❌ ไม่ควรมี: participants: ["<token1>", "<token2>"] (แต่ละตัว ~884 chars)
```

### 3. รัน Cleanup Script:
```bash
cd waste-cycle/server
node scripts/cleanup-chat-rooms.js
# ควรลบ chat rooms ที่มี token strings ใน participants
```

---

## 📝 สรุป

**ปัญหา:** MOCK_AUTH mode ทำให้ `req.user.uid` เป็น token string (~884 chars) แทน Firebase UID (~28 chars)

**วิธีแก้:**
1. ✅ ปิด MOCK_AUTH ทั้งหมด
2. ✅ ใช้ Firebase Admin SDK จริง
3. ✅ ใช้ `decodedToken.uid` เท่านั้น
4. ✅ `participants` array เก็บ UIDs เท่านั้น
5. ✅ Validation: ตรวจสอบ `uid.length <= 100`

**ผลลัพธ์:**
- ✅ Chat ทำงานปกติ
- ✅ Authorization checks ถูกต้อง
- ✅ ไม่มี 401/403 errors
- ✅ Messages ส่งถึงกันได้

