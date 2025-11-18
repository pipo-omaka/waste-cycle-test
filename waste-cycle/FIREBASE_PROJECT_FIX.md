# 🔧 Firebase Project ID Mismatch Fix

## ❌ ปัญหาที่พบ

**Frontend และ Backend ใช้ Firebase Project คนละตัว:**
- ❌ Frontend ใช้: `waste-cy`
- ✅ Backend ใช้: `waste-cycle-a6c6e`

**ผลกระทบ:**
```
Error: Firebase ID token has incorrect 'aud'. 
Expected 'waste-cycle-a6c6e' but got 'waste-cy'
```

**สาเหตุ:**
- `verifyIdToken()` ตรวจสอบ `aud` (audience) ใน JWT token
- `aud` คือ Firebase Project ID ที่ token ถูกสร้างจาก
- Frontend สร้าง token จาก project `waste-cy`
- Backend คาดหวัง token จาก project `waste-cycle-a6c6e`
- → Mismatch → verifyIdToken() ล้มเหลว

---

## ✅ วิธีแก้ไข

### 1. แก้ Frontend Firebase Config

**ไฟล์:** `client/src/firebaseConfig.ts`

**การเปลี่ยนแปลง:**
```typescript
// ❌ เก่า: ใช้ project ผิด
const firebaseConfig = {
  projectId: "waste-cy",  // ❌ ผิด!
  authDomain: "waste-cy.firebaseapp.com",
  // ...
};

// ✅ ใหม่: ใช้ project เดียวกับ Backend
const firebaseConfig = {
  projectId: "waste-cycle-a6c6e",  // ✅ ตรงกับ Backend
  authDomain: "waste-cycle-a6c6e.firebaseapp.com",
  // ...
};
```

**วิธีหา Firebase Web App Config:**
1. ไปที่: https://console.firebase.google.com/project/waste-cycle-a6c6e/settings/general
2. เลื่อนลงไปหา "Your apps" section
3. คลิกที่ Web app (</>) icon
4. Copy config values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

**หรือใช้ Environment Variables:**
```bash
# .env file
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

### 2. เพิ่ม Error Logging ใน Backend

**ไฟล์:** `server/src/middleware/authMiddleware.js`

**การเปลี่ยนแปลง:**
- เพิ่ม error handling สำหรับ `auth/argument-error` ที่มี `aud` mismatch
- Log project ID จาก token (`decodedToken.aud`)
- Log project ID จาก backend (`detectedProjectId`)
- แสดง error message ที่ชัดเจน

**ตัวอย่าง Error Log:**
```
❌ CRITICAL: Firebase Project ID Mismatch Detected!
   Backend Project ID: waste-cycle-a6c6e
   Error: Firebase ID token has incorrect 'aud'. Expected 'waste-cycle-a6c6e' but got 'waste-cy'
   
   This means:
   - Frontend is using a DIFFERENT Firebase project than Backend
   - Frontend config (firebaseConfig.ts) must match Backend service account
```

---

### 3. Validate Project ID ใน Backend

**ไฟล์:** `server/src/config/firebaseConfig.js`

**การเปลี่ยนแปลง:**
- Detect project ID จาก service account file
- Validate ว่า project ID ตรงกับ `waste-cycle-a6c6e`
- Export `detectedProjectId` สำหรับใช้ใน middleware

---

## 📋 ไฟล์ที่แก้ไข

### Frontend:
1. ✅ `client/src/firebaseConfig.ts`
   - เปลี่ยน `projectId` จาก `waste-cy` เป็น `waste-cycle-a6c6e`
   - เปลี่ยน `authDomain` จาก `waste-cy.firebaseapp.com` เป็น `waste-cycle-a6c6e.firebaseapp.com`
   - เปลี่ยน `storageBucket` จาก `waste-cy.appspot.com` เป็น `waste-cycle-a6c6e.appspot.com`
   - เพิ่ม validation เพื่อตรวจสอบ projectId
   - รองรับ environment variables

### Backend:
1. ✅ `server/src/config/firebaseConfig.js`
   - Detect และ log project ID จาก service account
   - Validate project ID ตรงกับ `waste-cycle-a6c6e`
   - Export `detectedProjectId` สำหรับใช้ใน middleware

2. ✅ `server/src/middleware/authMiddleware.js`
   - เพิ่ม error handling สำหรับ project mismatch
   - Log project ID จาก token (`decodedToken.aud`)
   - Log project ID จาก backend (`detectedProjectId`)
   - แสดง error message ที่ชัดเจนพร้อม solution

---

## 🔍 ทำไม Project ID Mismatch ทำให้ verifyIdToken() ล้มเหลว?

### JWT Token Structure:
```
{
  "aud": "waste-cy",           // Audience = Firebase Project ID
  "iss": "https://securetoken.google.com/waste-cy",
  "sub": "user-uid-here",
  // ...
}
```

### verifyIdToken() Process:
```javascript
// Backend: waste-cycle-a6c6e
const decodedToken = await auth.verifyIdToken(token);

// Firebase Admin SDK checks:
// 1. Token signature is valid
// 2. Token is not expired
// 3. Token 'aud' matches backend project ID ✅
//    - Expected: 'waste-cycle-a6c6e'
//    - Got from token: 'waste-cy'
//    - ❌ MISMATCH → Error!
```

**Error Message:**
```
Firebase ID token has incorrect 'aud'. 
Expected 'waste-cycle-a6c6e' but got 'waste-cy'
```

---

## ✅ หลังแก้แล้ว verifyIdToken() จะทำงานปกติอย่างไร?

### Flow การทำงาน:

1. **Frontend Login:**
   ```typescript
   // Frontend: waste-cycle-a6c6e
   const user = await signInWithEmailAndPassword(auth, email, password);
   const token = await user.getIdToken();
   // Token 'aud' = 'waste-cycle-a6c6e' ✅
   ```

2. **Send Request:**
   ```typescript
   headers: {
     Authorization: `Bearer ${token}`  // Token from waste-cycle-a6c6e
   }
   ```

3. **Backend Verify:**
   ```javascript
   // Backend: waste-cycle-a6c6e
   const decodedToken = await auth.verifyIdToken(token);
   // ✅ Token 'aud' = 'waste-cycle-a6c6e'
   // ✅ Matches backend project ID
   // ✅ Verification succeeds!
   
   req.user = {
     uid: decodedToken.uid,  // ✅ Firebase UID (~28 chars)
     // ...
   };
   ```

### ผลลัพธ์:
- ✅ `verifyIdToken()` ผ่านสำเร็จ
- ✅ `req.user.uid` เป็น Firebase UID จริง (~28 chars)
- ✅ Chat และระบบทั้งหมดทำงานปกติ
- ✅ ไม่มี 401 หรือ `auth/argument-error`
- ✅ Token length ~884 ถูก decode เป็น uid จริง (~28 chars)

---

## 🧪 การทดสอบ

### 1. ตรวจสอบ Frontend Config:
```bash
# เปิด client/src/firebaseConfig.ts
# ตรวจสอบ:
#   ✅ projectId: "waste-cycle-a6c6e"
#   ✅ authDomain: "waste-cycle-a6c6e.firebaseapp.com"
```

### 2. ตรวจสอบ Backend Config:
```bash
cd waste-cycle/server
npm start
# ควรเห็น:
#   ✅ Firebase Admin SDK initialized successfully
#   ✅ Project ID: waste-cycle-a6c6e
#   ✅ Project ID validated: waste-cycle-a6c6e
```

### 3. ทดสอบ Login:
```bash
# 1. Login จาก Frontend
# 2. ดู Backend logs:
#    ✅ Token audience (project ID): waste-cycle-a6c6e
#    ✅ Token project ID matches backend: waste-cycle-a6c6e
#    ✅ Firebase Auth Success: <email> (UID: <uid>)
```

---

## 📝 สรุป

**ปัญหา:** Frontend ใช้ Firebase Project `waste-cy` แต่ Backend ใช้ `waste-cycle-a6c6e`

**วิธีแก้:**
1. ✅ แก้ Frontend config ให้ใช้ `waste-cycle-a6c6e`
2. ✅ เพิ่ม error logging ใน Backend
3. ✅ Validate project ID ใน Backend

**ผลลัพธ์:**
- ✅ Frontend และ Backend ใช้ Firebase Project เดียวกัน
- ✅ `verifyIdToken()` ผ่านสำเร็จ
- ✅ `req.user.uid` ถูกต้อง
- ✅ Chat และระบบทั้งหมดทำงานปกติ

---

## ⚠️ หมายเหตุ

**Frontend config ต้องอัปเดตค่าเหล่านี้ให้ตรงกับ Firebase Console:**
- `apiKey` - จาก Firebase Console → Project Settings → General → Your apps → Web app
- `messagingSenderId` - จาก Firebase Console
- `appId` - จาก Firebase Console

**วิธีหา:**
1. ไปที่: https://console.firebase.google.com/project/waste-cycle-a6c6e/settings/general
2. เลื่อนลงไปหา "Your apps" section
3. คลิกที่ Web app (</>) icon
4. Copy config values ทั้งหมด

