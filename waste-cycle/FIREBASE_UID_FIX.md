# 🔧 Firebase UID Fix - Complete Solution

## ❌ ปัญหาที่พบ

Backend กำลังใช้ Firebase ID Token (JWT ความยาว ~884 ตัว) เป็น `userId` แทนที่จะใช้ `decodedToken.uid` ที่ถูกต้อง (~28 ตัว)

### ผลกระทบ:
- `participants` ใน `chatRoom` กลายเป็น token string ยาวผิดปกติ
- Compare `uid` ผิด → `403 Forbidden`
- `verifyToken` ล้มเหลว → `401 Unauthorized`
- Server crash → `ERR_CONNECTION_REFUSED`
- Chat ของ user ทั้งสองฝั่งไม่ match กัน
- แชทไม่โหลด ข้อความไม่ส่งถึงกัน

---

## ✅ วิธีแก้ไข

### 1. Frontend (`apiServer.ts`)

**✅ ถูกต้องแล้ว:** Frontend ส่ง token ใน header เท่านั้น:
```typescript
config.headers.Authorization = `Bearer ${token}`;
```

**ไม่ส่ง userId ใน body** - Backend จะดึง `uid` จาก `decodedToken.uid` เท่านั้น

---

### 2. Backend Middleware (`authMiddleware.js`)

**CRITICAL FIX:** ใช้ `decodedToken.uid` เท่านั้น (ไม่ใช้ token string)

```javascript
// ✅ ถูกต้อง: ใช้ decodedToken.uid
const decodedToken = await auth.verifyIdToken(token);
req.user = {
  uid: decodedToken.uid,  // ✅ Firebase UID (~28 chars)
  id: decodedToken.uid,   // ✅ Use uid as id
  email: decodedToken.email,
  // ...
};

// ❌ ผิด: ห้ามใช้ token string
// req.user.uid = token;  // ❌ Token string (~884 chars)
```

**Validation:**
- ตรวจสอบ `decodedToken.uid` มีอยู่จริง
- ตรวจสอบ `uid.length <= 100` (UID ~28 chars, Token > 100 chars)

---

### 3. Chat Controller (`chatController.js`)

**CRITICAL FIX:** ทุก function ใช้ `req.user.uid` เท่านั้น

```javascript
// ✅ ถูกต้อง
const userId = String(req.user.uid);  // Firebase UID

// ❌ ผิด
// const userId = req.user.id || req.user.uid;  // อาจได้ token string
```

**Functions ที่แก้ไข:**
- `getChatRooms()` - ใช้ `req.user.uid` สำหรับ query
- `createChatRoom()` - ใช้ `req.user.uid` เป็น `buyerId`
- `getChatRoomById()` - ใช้ `req.user.uid` สำหรับ authorization
- `postMessage()` - ใช้ `req.user.uid` เป็น `senderId`
- `getMessages()` - ใช้ `req.user.uid` สำหรับ authorization

**Participants Array:**
```javascript
// ✅ ถูกต้อง: เก็บ UIDs เท่านั้น
participants: [String(buyerId), String(sellerId)]
// Example: ["VsFDNKyJYofK7HpUuz6RPwE5O8X2", "HAN3AMvyAOR2yE9XCs0KTAbqqxB3"]

// ❌ ผิด: ห้ามเก็บ token strings
// participants: [token1, token2]  // ❌ Token strings (~884 chars each)
```

---

## 📋 ไฟล์ที่แก้ไข

### Backend:
1. ✅ `server/src/middleware/authMiddleware.js`
   - `firebaseVerifyToken()` - ใช้ `decodedToken.uid` เท่านั้น
   - `protectTokenOnly()` - ใช้ `decodedToken.uid` เท่านั้น
   - Validation: ตรวจสอบ `uid.length <= 100`

2. ✅ `server/src/controllers/chatController.js`
   - ทุก function ใช้ `req.user.uid` เท่านั้น
   - Validation: ตรวจสอบ `req.user.uid.length <= 100`
   - `participants` array เก็บ UIDs เท่านั้น

### Frontend:
1. ✅ `client/src/apiServer.ts`
   - ส่ง token ใน header เท่านั้น: `Authorization: Bearer <token>`
   - ไม่ส่ง `userId` ใน body

---

## 🧹 Cleanup Script

**ลบ chat rooms เก่าที่เก็บ token strings:**

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

## 🔍 ทำไม Token Length 884 จึงผิด?

### Firebase ID Token (JWT):
- **Length:** ~884 characters
- **Format:** `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ...` (base64 encoded)
- **Purpose:** สำหรับ authentication (ส่งใน header)
- **Changes:** Token เปลี่ยนทุกครั้งที่ refresh (ประมาณทุกชั่วโมง)

### Firebase User UID:
- **Length:** ~28 characters
- **Format:** `VsFDNKyJYofK7HpUuz6RPwE5O8X2` (alphanumeric)
- **Purpose:** สำหรับ identify user (เก็บใน database)
- **Stable:** UID ไม่เปลี่ยนตลอดชีวิตของ user

### ปัญหา:
```javascript
// ❌ ผิด: ใช้ token string เป็น userId
participants: ["eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...", "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."]
// Length: ~884 chars each → Firestore document ID limit (1500 bytes) exceeded!

// ✅ ถูกต้อง: ใช้ UID
participants: ["VsFDNKyJYofK7HpUuz6RPwE5O8X2", "HAN3AMvyAOR2yE9XCs0KTAbqqxB3"]
// Length: ~28 chars each → ปลอดภัย
```

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
   body: {
     productId: "..."  // ✅ ไม่ส่ง userId ใน body
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
   // Example: ["VsFDNKyJYofK7HpUuz6RPwE5O8X2", "HAN3AMvyAOR2yE9XCs0KTAbqqxB3"]
   ```

6. **Authorization Check:**
   ```javascript
   const userId = String(req.user.uid);  // ✅ UID
   const isParticipant = participants.some(p => String(p) === userId);
   // ✅ Match! เพราะทั้งสองฝั่งเป็น UID
   ```

7. **Send Message:**
   ```javascript
   const senderId = String(req.user.uid);  // ✅ UID
   const receiverId = participants.find(id => String(id) !== senderId);  // ✅ UID
   
   message: {
     senderId: senderId,    // ✅ UID
     receiverId: receiverId  // ✅ UID
   }
   ```

### ผลลัพธ์:
- ✅ `participants` array เก็บ UIDs เท่านั้น (~28 chars each)
- ✅ Authorization checks ทำงานถูกต้อง (compare UID === UID)
- ✅ Chat rooms match กันทั้งสองฝั่ง
- ✅ Messages ส่งถึงกันได้
- ✅ ไม่มี 401/403 errors

---

## 🧪 การทดสอบ

### 1. ตรวจสอบ Frontend:
```bash
# เปิด Browser DevTools → Network tab
# เรียก API `/api/chat`
# ตรวจสอบ Request Headers:
#   ✅ Authorization: Bearer <token> (length ~884)
#   ✅ ไม่มี userId ใน body
```

### 2. ตรวจสอบ Backend:
```bash
# ดู backend console logs
# ควรเห็น:
#   ✅ Firebase Auth Success: <email> (UID: <uid>, length: 28)
#   ✅ createChatRoom - buyerId (uid): <uid> (length: 28)
```

### 3. ตรวจสอบ Firestore:
```bash
# เปิด Firebase Console → Firestore
# ตรวจสอบ chatRooms collection:
#   ✅ participants: ["<uid1>", "<uid2>"] (แต่ละตัว ~28 chars)
#   ❌ ไม่ควรมี: participants: ["<token1>", "<token2>"] (แต่ละตัว ~884 chars)
```

---

## 📝 สรุป

**ปัญหา:** Backend ใช้ token string (~884 chars) แทน UID (~28 chars)

**วิธีแก้:**
1. ✅ Middleware ใช้ `decodedToken.uid` เท่านั้น
2. ✅ Controller ใช้ `req.user.uid` เท่านั้น
3. ✅ `participants` array เก็บ UIDs เท่านั้น
4. ✅ Validation: ตรวจสอบ `uid.length <= 100`

**ผลลัพธ์:**
- ✅ Chat ทำงานปกติ
- ✅ Authorization checks ถูกต้อง
- ✅ ไม่มี 401/403 errors
- ✅ Messages ส่งถึงกันได้

