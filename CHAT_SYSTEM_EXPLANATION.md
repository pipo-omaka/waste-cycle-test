# 📚 อธิบายระบบแชท Multi-User แบบ Real-time

## 🎯 ภาพรวมระบบ

ระบบแชทนี้รองรับผู้ใช้งานหลายบัญชี โดยแยกข้อมูลตาม `userId` อย่างชัดเจน และใช้ Firestore real-time listeners เพื่อให้ข้อความปรากฏทันที

---

## 📊 โครงสร้างข้อมูลใน Firestore

### 1. Chat Rooms Collection
```
chatRooms/
  {chatRoomId}/  (e.g., "userA_userB" - sorted alphabetically)
    - participants: ["userA", "userB"]        // MULTI-USER: Array of user IDs
    - participantNames: ["นายเอ", "นายบี"]     // Names corresponding to participants
    - productId: "product123"
    - productTitle: "มูลวัวแห้ง"
    - productImage: "https://..."
    - createdAt: "2024-01-01T00:00:00Z"
    - updatedAt: "2024-01-01T00:00:00Z"
    - lastMessage: "สวัสดีครับ"
    - lastMessageSenderId: "userA"
    
    messages/  (subcollection)
      {messageId}/
        - chatRoomId: "userA_userB"
        - senderId: "userA"        // MULTI-USER: Who sent
        - receiverId: "userB"       // MULTI-USER: Who receives
        - text: "สวัสดีครับ"
        - timestamp: "2024-01-01T00:00:00Z"
        - read: false
```

### 2. Unique Chat Room ID
- **Format**: `"userId1_userId2"` (sorted alphabetically)
- **Example**: 
  - นายเอ (userA) + นายบี (userB) → `"userA_userB"`
  - นายบี (userB) + นายเอ (userA) → `"userA_userB"` (same!)
- **ประโยชน์**: ป้องกันสร้างห้องซ้ำ ไม่ว่าใครจะเป็นคนเริ่มแชท

---

## 🔄 Flow การทำงาน

### Scenario 1: นายบีเริ่มแชทกับนายเอ

1. **นายบี login** → เห็นโพสต์ของนายเอใน Marketplace
2. **นายบีกดแชท** → เรียก `createChatRoom(productId)`
3. **Backend สร้าง/หา Chat Room**:
   ```javascript
   const buyerId = "userB";  // จาก req.user.uid
   const sellerId = "userA"; // จาก product.userId
   const chatRoomId = generateChatRoomId(buyerId, sellerId); // "userA_userB"
   ```
4. **ถ้ามีห้องอยู่แล้ว** → Return ห้องเดิม
5. **ถ้ายังไม่มี** → สร้างห้องใหม่ใน `chatRooms/userA_userB`
6. **Frontend เปิด ChatPage** → Subscribe to messages real-time

### Scenario 2: นายบีส่งข้อความ

1. **นายบีพิมพ์ข้อความ** → กดส่ง
2. **Frontend เรียก `sendMessage()`**:
   ```typescript
   await sendMessage(
     chatRoomId,    // "userA_userB"
     senderId,      // "userB"
     receiverId,    // "userA"
     text           // "สวัสดีครับ"
   );
   ```
3. **Message ถูกบันทึกใน Firestore**:
   ```
   chatRooms/userA_userB/messages/{messageId}
   ```
4. **Chat Room ถูกอัปเดต**:
   - `lastMessage`: "สวัสดีครับ"
   - `lastMessageSenderId`: "userB"
   - `updatedAt`: timestamp ปัจจุบัน

### Scenario 3: นายเอเห็นข้อความ (Real-time)

1. **นายเอ login** → เปิด ChatPage
2. **ChatPage Subscribe to Chat Rooms**:
   ```typescript
   subscribeToChatRooms("userA", (rooms) => {
     // rooms = ห้องที่ participants.includes("userA")
     setChatRooms(rooms);
   });
   ```
3. **นายเอเลือกห้องแชท** → Subscribe to Messages:
   ```typescript
   subscribeToMessages("userA_userB", "userA", (messages) => {
     // messages = ข้อความทั้งหมดในห้องนี้
     setMessages(messages);
   });
   ```
4. **เมื่อนายบีส่งข้อความ** → Firestore trigger `onSnapshot`
5. **Frontend ได้รับข้อความใหม่ทันที** → อัปเดต UI อัตโนมัติ
6. **นายเอเห็นข้อความทันที** → ไม่ต้อง refresh

---

## 🔐 Security & Data Separation

### 1. Authorization Checks
```javascript
// Backend: ตรวจสอบว่า user เป็น participant
if (!chatRoomData.participants.includes(userId)) {
  res.status(403);
  throw new Error('Not authorized to access this chat room');
}
```

### 2. Data Filtering
```typescript
// Frontend: Filter chat rooms by current user
const chatRooms = allRooms.filter(room => 
  room.participants.includes(currentUserId)
);
```

### 3. Unique Room ID
```javascript
// ป้องกันสร้างห้องซ้ำ
const chatRoomId = generateChatRoomId(userId1, userId2);
// ไม่ว่าใครเริ่มแชท → ได้ห้องเดียวกัน
```

---

## 📱 UI Components

### 1. ChatPage.tsx
- **หน้าที่**: แสดงรายการห้องแชทและข้อความ
- **Real-time**: ใช้ `subscribeToChatRooms()` และ `subscribeToMessages()`
- **Filter**: แสดงเฉพาะห้องที่ user เป็น participant

### 2. MessageInput.tsx
- **หน้าที่**: Input field สำหรับพิมพ์ข้อความ
- **Features**: 
  - รองรับ Enter key
  - Disable state
  - Validation (ไม่ให้ส่งข้อความว่าง)

### 3. chatService.ts
- **หน้าที่**: จัดการ real-time listeners และส่งข้อความ
- **Functions**:
  - `subscribeToChatRooms()` - Real-time chat rooms
  - `subscribeToMessages()` - Real-time messages
  - `sendMessage()` - ส่งข้อความ
  - `markMessagesAsRead()` - Mark as read

---

## ✅ Safety Checks

### 1. Array Access
```typescript
// ✅ ถูกต้อง
{messages && Array.isArray(messages) && messages.length > 0 ? (
  messages.map(...)
) : (
  <div>ยังไม่มีข้อความ</div>
)}

// ❌ ผิด
{messages[0]}  // อาจ crash ถ้า messages เป็น undefined
```

### 2. Optional Chaining
```typescript
// ✅ ถูกต้อง
{room.otherParticipantName?.[0] || 'U'}

// ❌ ผิด
{room.otherParticipantName[0]}  // อาจ crash
```

### 3. Null Checks
```typescript
// ✅ ถูกต้อง
if (!currentUserId) {
  console.error('userId is required');
  return;
}

// ❌ ผิด
const userId = user.id;  // อาจเป็น undefined
```

---

## 🎯 ตัวอย่างการใช้งาน

### นายเอ login:
1. เปิด ChatPage → เห็นเฉพาะห้องที่ `participants.includes("userA")`
2. เลือกห้อง "userA_userB" → เห็นข้อความทั้งหมด
3. พิมพ์ข้อความ → ส่งไปถึงนายบีทันที

### นายบี login:
1. เปิด ChatPage → เห็นเฉพาะห้องที่ `participants.includes("userB")`
2. เลือกห้อง "userA_userB" → เห็นข้อความทั้งหมด (ห้องเดียวกัน!)
3. พิมพ์ข้อความ → ส่งไปถึงนายเอทันที

### ผลลัพธ์:
- ✅ ทั้งสองฝ่ายเห็นข้อความเดียวกัน
- ✅ ข้อความปรากฏทันที (real-time)
- ✅ ข้อมูลแยกตาม userId ชัดเจน
- ✅ ไม่มีข้อมูลปะปนกัน

---

## 📝 ไฟล์ที่เกี่ยวข้อง

### Backend:
- `server/src/controllers/chatController.js` - API endpoints
- `server/src/routes/chatRoutes.js` - Routes

### Frontend:
- `client/src/services/chatService.ts` - Real-time service
- `client/src/components/ChatPage.tsx` - Chat UI
- `client/src/components/MessageInput.tsx` - Message input
- `client/src/firebaseConfig.ts` - Firestore config
- `client/src/App.tsx` - Main app (uses currentUser.uid)

---

## 🚀 การทดสอบ

1. **Login เป็นนายเอ** → สร้างโพสต์
2. **Login เป็นนายบี** → เห็นโพสต์ของนายเอ → กดแชท
3. **นายบีพิมพ์ข้อความ** → ข้อความถูกส่ง
4. **Login เป็นนายเอ** → เห็นข้อความที่นายบีส่งมา
5. **ทั้งสองฝ่ายพิมพ์โต้ตอบ** → ข้อความปรากฏทันที
6. **ตรวจสอบ Firestore** → ข้อความถูกจัดเก็บแยกตามคู่สนทนา

---

**ระบบพร้อมใช้งานแล้ว!** 🎉

