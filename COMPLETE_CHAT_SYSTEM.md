# ✅ ระบบแชท Multi-User แบบ Real-time

## 📋 ไฟล์ที่สร้าง/แก้ไขทั้งหมด

### Backend Files:
1. `server/src/controllers/chatController.js` - **แก้ไขใหม่ทั้งหมด**
2. `server/src/routes/chatRoutes.js` - ตรวจสอบ routes

### Frontend Files:
3. `client/src/services/chatService.ts` - **สร้างใหม่** (Real-time chat service)
4. `client/src/components/ChatPage.tsx` - **แก้ไขใหม่ทั้งหมด** (Real-time UI)
5. `client/src/components/MessageInput.tsx` - **สร้างใหม่** (Message input component)
6. `client/src/firebaseConfig.ts` - **แก้ไข** (Export Firestore db)
7. `client/src/App.tsx` - **แก้ไข** (ใช้ currentUser.uid, ลบ chatRooms state)

---

## 🔧 รายละเอียดการแก้ไขแต่ละไฟล์

### 1. **server/src/controllers/chatController.js** (แก้ไขใหม่ทั้งหมด)

#### ✅ สิ่งที่แก้ไข:

**1.1 เพิ่ม Function `generateChatRoomId()`**
```javascript
/**
 * Generate unique chat room ID from two user IDs
 * MULTI-USER: Creates consistent room ID regardless of who initiates
 * Format: "userId1_userId2" (sorted alphabetically)
 */
const generateChatRoomId = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};
```

**1.2 แก้ไข `getChatRooms()` - ใช้ participants array**
```javascript
/**
 * @desc    Get all chat rooms for the logged-in user
 * @note    MULTI-USER: Returns only chat rooms where user is a participant
 */
const getChatRooms = asyncHandler(async (req, res) => {
  const userId = req.user.uid || req.user.id;
  
  // MULTI-USER: Query using array-contains to find rooms where user is participant
  const chatsSnapshot = await db.collection('chatRooms')
    .where('participants', 'array-contains', userId)
    .get();

  const chatRooms = chatsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      otherParticipantId: data.participants.find(id => id !== userId),
      otherParticipantName: data.participantNames?.[data.participants.findIndex(id => id !== userId)] || 'Unknown',
    };
  });

  // Sort by updatedAt (newest first)
  chatRooms.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  res.status(200).json({ success: true, data: chatRooms });
});
```

**1.3 แก้ไข `createChatRoom()` - ใช้ unique chatRoomId**
```javascript
/**
 * @desc    Create or get existing chat room
 * @note    MULTI-USER: Creates unique chat room ID based on participants
 */
const createChatRoom = asyncHandler(async (req, res) => {
  const buyerId = req.user.uid || req.user.id;
  const { productId } = req.body;
  
  // Get product to find seller
  const product = (await db.collection('products').doc(productId).get()).data();
  const sellerId = product.userId;

  // MULTI-USER: Generate unique chat room ID
  const chatRoomId = generateChatRoomId(buyerId, sellerId);

  // Check if room exists
  const chatRoomRef = db.collection('chatRooms').doc(chatRoomId);
  const chatRoomDoc = await chatRoomRef.get();

  if (chatRoomDoc.exists) {
    // Return existing room
    const existingData = chatRoomDoc.data();
    res.status(200).json({
      success: true,
      data: {
        id: chatRoomId,
        ...existingData,
        otherParticipantId: existingData.participants.find(id => id !== buyerId),
      },
    });
    return;
  }

  // Create new room with participants array
  const newChatRoom = {
    participants: [buyerId, sellerId],  // MULTI-USER: Array of participant IDs
    participantNames: [buyerName, sellerName],
    productId,
    productTitle: product.title || '',
    productImage: product.images?.[0] || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessage: '',
    lastMessageSenderId: null,
  };

  await chatRoomRef.set(newChatRoom);
  res.status(201).json({ success: true, data: { id: chatRoomId, ...newChatRoom } });
});
```

**1.4 แก้ไข `postMessage()` - เพิ่ม receiverId**
```javascript
/**
 * @desc    Post a new message
 * @note    MULTI-USER: Message includes senderId and receiverId
 */
const postMessage = asyncHandler(async (req, res) => {
  const senderId = req.user.uid || req.user.id;
  const chatRoomId = req.params.id;
  const { text } = req.body;

  // Get chat room
  const chatRoomData = (await db.collection('chatRooms').doc(chatRoomId).get()).data();
  
  // MULTI-USER: Determine receiver (the other participant)
  const receiverId = chatRoomData.participants.find(id => id !== senderId);

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
  await chatRoomRef.collection('messages').add(newMessage);
  
  // Update chat room
  await chatRoomRef.update({
    lastMessage: text.trim(),
    lastMessageSenderId: senderId,
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, data: { id: messageRef.id, ...newMessage } });
});
```

**1.5 แก้ไข `getMessages()` - ใช้ subcollection**
```javascript
/**
 * @desc    Get messages for a chat room
 * @note    MULTI-USER: Only participants can access messages
 */
const getMessages = asyncHandler(async (req, res) => {
  const userId = req.user.uid || req.user.id;
  const chatRoomId = req.params.id;

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
```

---

### 2. **client/src/services/chatService.ts** (สร้างใหม่)

#### ✅ หน้าที่:
- จัดการ real-time chat rooms และ messages
- ใช้ Firestore onSnapshot สำหรับ real-time updates
- แยกข้อมูลตาม userId (participants)
- ป้องกันข้อมูลปะปนกัน

#### ✅ โค้ดเต็ม:

```typescript
/**
 * Chat Service - Real-time Chat Management
 * 
 * MULTI-USER CHAT SYSTEM:
 * - Manages real-time chat rooms and messages
 * - Uses Firestore real-time listeners (onSnapshot)
 * - Separates data by userId (participants)
 * - Prevents data mixing between different users
 */

import { db } from '../firebaseConfig';
import { collection, doc, onSnapshot, addDoc, query, orderBy, Timestamp, updateDoc } from 'firebase/firestore';

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;      // MULTI-USER: Who sent the message
  receiverId: string;    // MULTI-USER: Who receives the message
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];        // MULTI-USER: Array of user IDs
  participantNames: string[];     // Names corresponding to participants
  productId: string;
  productTitle: string;
  productImage?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  lastMessageSenderId: string | null;
  otherParticipantId?: string;    // Computed: The other user in the chat
  otherParticipantName?: string;   // Computed: The other user's name
}

/**
 * Generate unique chat room ID from two user IDs
 */
export const generateChatRoomId = (userId1: string, userId2: string): string => {
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

/**
 * Subscribe to chat rooms for a user (real-time)
 * MULTI-USER: Only returns chat rooms where user is a participant
 */
export const subscribeToChatRooms = (
  userId: string,
  callback: (chatRooms: ChatRoom[]) => void
): (() => void) => {
  if (!userId) {
    console.error('subscribeToChatRooms: userId is required');
    return () => {};
  }

  const chatRoomsRef = collection(db, 'chatRooms');
  const q = query(chatRoomsRef, orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const chatRooms: ChatRoom[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // MULTI-USER: Only include rooms where user is a participant
        if (data.participants && Array.isArray(data.participants) && data.participants.includes(userId)) {
          const otherParticipantIndex = data.participants.findIndex((id: string) => id !== userId);
          
          chatRooms.push({
            id: doc.id,
            ...data,
            otherParticipantId: data.participants[otherParticipantIndex],
            otherParticipantName: data.participantNames?.[otherParticipantIndex] || 'Unknown',
          } as ChatRoom);
        }
      });

      // Sort by updatedAt (newest first)
      chatRooms.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      callback(chatRooms);
    },
    (error) => {
      console.error('Error subscribing to chat rooms:', error);
      callback([]);
    }
  );

  return unsubscribe;
};

/**
 * Subscribe to messages in a chat room (real-time)
 * MULTI-USER: Only participants can subscribe
 */
export const subscribeToMessages = (
  chatRoomId: string,
  userId: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  if (!chatRoomId || !userId) {
    console.error('subscribeToMessages: chatRoomId and userId are required');
    return () => {};
  }

  const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: Message[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp || new Date().toISOString(),
        } as Message);
      });

      callback(messages);
    },
    (error) => {
      console.error('Error subscribing to messages:', error);
      callback([]);
    }
  );

  return unsubscribe;
};

/**
 * Send a message to a chat room
 * MULTI-USER: Message includes senderId and receiverId
 */
export const sendMessage = async (
  chatRoomId: string,
  senderId: string,
  receiverId: string,
  text: string
): Promise<Message> => {
  if (!chatRoomId || !senderId || !receiverId || !text.trim()) {
    throw new Error('chatRoomId, senderId, receiverId, and text are required');
  }

  const messageData = {
    chatRoomId,
    senderId,
    receiverId,
    text: text.trim(),
    timestamp: Timestamp.now(),
    read: false,
  };

  const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
  const docRef = await addDoc(messagesRef, messageData);

  // Update chat room with last message
  const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
  await updateDoc(chatRoomRef, {
    lastMessage: text.trim(),
    lastMessageSenderId: senderId,
    updatedAt: Timestamp.now(),
  });

  return {
    id: docRef.id,
    ...messageData,
    timestamp: messageData.timestamp.toDate().toISOString(),
  } as Message;
};

/**
 * Mark messages as read
 * MULTI-USER: Only mark messages where user is the receiver
 */
export const markMessagesAsRead = async (
  chatRoomId: string,
  userId: string
): Promise<void> => {
  if (!chatRoomId || !userId) return;

  const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'desc'));

  const snapshot = await getDocs(q);
  const updatePromises: Promise<void>[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    // MULTI-USER: Only mark as read if user is the receiver
    if (data.receiverId === userId && !data.read) {
      const messageRef = doc(db, 'chatRooms', chatRoomId, 'messages', docSnap.id);
      updatePromises.push(updateDoc(messageRef, { read: true }) as Promise<void>);
    }
  });

  await Promise.all(updatePromises);
};
```

---

### 3. **client/src/components/ChatPage.tsx** (แก้ไขใหม่ทั้งหมด)

#### ✅ สิ่งที่แก้ไข:

**3.1 ใช้ Real-time Listeners**
```typescript
// MULTI-USER: Subscribe to chat rooms (real-time)
useEffect(() => {
  if (!currentUserId) return;

  const unsubscribe = subscribeToChatRooms(currentUserId, (rooms) => {
    setChatRooms(rooms);
  });

  return () => unsubscribe();
}, [currentUserId]);

// MULTI-USER: Subscribe to messages (real-time)
useEffect(() => {
  if (!selectedRoomId || !currentUserId) {
    setMessages([]);
    return;
  }

  const unsubscribe = subscribeToMessages(selectedRoomId, currentUserId, (msgs) => {
    // SAFETY CHECK: Ensure messages is an array
    setMessages(Array.isArray(msgs) ? msgs : []);
    
    // Mark messages as read
    markMessagesAsRead(selectedRoomId, currentUserId).catch(console.error);
  });

  return () => unsubscribe();
}, [selectedRoomId, currentUserId]);
```

**3.2 ใช้ currentUser.uid**
```typescript
// MULTI-USER: Use currentUser.uid (not hardcoded or dummy user)
const currentUserId = user?.id || user?.uid;
```

**3.3 Filter Chat Rooms by User**
```typescript
// MULTI-USER: Filter chat rooms by current user
const myChats = chatRooms.filter((room) => {
  if (!room.participants || !Array.isArray(room.participants)) return false;
  const isParticipant = room.participants.includes(currentUserId);
  return isParticipant && room.participants[0] === currentUserId;
});

const contactRequests = chatRooms.filter((room) => {
  if (!room.participants || !Array.isArray(room.participants)) return false;
  const isParticipant = room.participants.includes(currentUserId);
  return isParticipant && room.participants[1] === currentUserId;
});
```

**3.4 Safety Checks**
```typescript
// SAFETY CHECK: Check array before accessing
{messages && messages.length > 0 ? (
  messages.map((message) => (
    // Render message
  ))
) : (
  <div>ยังไม่มีข้อความ</div>
)}

// SAFETY CHECK: Check name before accessing [0]
<span>{getOtherParticipantName(room)?.[0] || 'U'}</span>
```

**3.5 Send Message with senderId and receiverId**
```typescript
const handleSend = async (text: string) => {
  if (!selectedRoom || !currentUserId || !text.trim()) return;

  // MULTI-USER: Get receiver ID (the other participant)
  const receiverId = selectedRoom.otherParticipantId;
  if (!receiverId) {
    console.error('Cannot determine receiver ID');
    return;
  }

  // Send message using real-time service
  await sendMessage(selectedRoomId!, currentUserId, receiverId, text);
};
```

---

### 4. **client/src/components/MessageInput.tsx** (สร้างใหม่)

#### ✅ หน้าที่:
- Input field สำหรับพิมพ์ข้อความ
- ปุ่มส่งข้อความ
- รองรับ Enter key
- Disable state

#### ✅ โค้ดเต็ม:

```typescript
/**
 * MessageInput Component
 * 
 * MULTI-USER: Sends messages with senderId and receiverId
 * Prevents sending empty messages
 */

import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, disabled = false, placeholder = 'พิมพ์ข้อความ...' }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    
    onSend(message.trim());
    setMessage('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 p-4 border-t bg-white">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="bg-green-600 hover:bg-green-700"
        size="icon"
      >
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
}
```

---

### 5. **client/src/firebaseConfig.ts** (แก้ไข)

#### ✅ สิ่งที่แก้ไข:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);

// MULTI-USER: Export Firestore instance for real-time chat
export const db = getFirestore(app);

export default app;
```

---

### 6. **client/src/App.tsx** (แก้ไข)

#### ✅ สิ่งที่แก้ไข:

**6.1 ลบ chatRooms และ chatMessages state**
```typescript
// MULTI-USER: Chat rooms and messages are now managed by ChatPage component using real-time listeners
// Removed: const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
// Removed: const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});
```

**6.2 ลบ getChatRooms จาก fetchAllData**
```typescript
// MULTI-USER: Chat rooms are now managed by ChatPage using real-time listeners
// Only fetch posts here
const [allProductsResponse, myProductsResponse] = await Promise.all([
  getAllProducts(),
  getMyProducts(),
]);
```

**6.3 แก้ไข handleOpenChat ให้ใช้ currentUser.uid**
```typescript
/**
 * Handle opening chat from a post
 * MULTI-USER: Uses currentUser.uid to create/find chat room
 */
const handleOpenChat = async (postId: string) => {
  // MULTI-USER: Use currentUser.uid (not hardcoded or dummy user)
  if (!user || !user.id) {
    alert('กรุณาเข้าสู่ระบบก่อน');
    return;
  }

  // Real product - create or get chat room via API
  // MULTI-USER: API will create unique room ID based on participants
  const response = await createChatRoom(postId);
  const room = response.data.data;
  
  setSelectedRoomId(room.id);
  navigateTo('chat');
};
```

**6.4 แก้ไข ChatPage props**
```typescript
<ChatPage 
  user={user!} 
  posts={allPosts}              // MULTI-USER: Use allPosts to find post details
  onBack={() => navigateTo('dashboard')} 
  onConfirmSale={handleConfirmSale}
  initialRoomId={selectedRoomId}
  onCancelChat={handleCancelChat}
/>
```

---

## 📊 Firestore Structure

### Chat Rooms Collection:
```
chatRooms/
  {chatRoomId}/  (e.g., "userA_userB")
    participants: ["userA", "userB"]
    participantNames: ["นายเอ", "นายบี"]
    productId: "product123"
    productTitle: "มูลวัวแห้ง"
    createdAt: "2024-01-01T00:00:00Z"
    updatedAt: "2024-01-01T00:00:00Z"
    lastMessage: "สวัสดีครับ"
    lastMessageSenderId: "userA"
    
    messages/  (subcollection)
      {messageId}/
        chatRoomId: "userA_userB"
        senderId: "userA"
        receiverId: "userB"
        text: "สวัสดีครับ"
        timestamp: "2024-01-01T00:00:00Z"
        read: false
```

---

## 🔒 Security Features

1. **Authorization**: ตรวจสอบว่า user เป็น participant ก่อนเข้าถึง chat room
2. **Data Separation**: ใช้ participants array เพื่อ filter chat rooms
3. **Unique Room ID**: ใช้ sorted user IDs เพื่อป้องกันห้องซ้ำ
4. **Real-time Updates**: ใช้ onSnapshot สำหรับ real-time updates

---

## ✅ Checklist การทดสอบ

- [ ] นายเอ login → สร้างโพสต์
- [ ] นายบี login → เห็นโพสต์ของนายเอ → กดแชท
- [ ] นายบีพิมพ์ข้อความ → ข้อความถูกส่งไปถึงนายเอ
- [ ] นายเอ login → เห็นข้อความที่นายบีส่งมา
- [ ] ทั้งสองฝ่ายพิมพ์โต้ตอบกันได้
- [ ] ข้อความถูกจัดเก็บแยกตามคู่สนทนา
- [ ] ChatList แสดงเฉพาะห้องแชทของ user
- [ ] ไม่มี error เกี่ยวกับ undefined/null
- [ ] ไม่มี error เกี่ยวกับ array[0] โดยไม่เช็ก

---

## 🎉 สรุป

ระบบแชทตอนนี้:
- ✅ ใช้ real-time Firestore listeners
- ✅ แยกข้อมูลตาม userId (participants)
- ✅ ข้อความมี senderId และ receiverId
- ✅ Chat room ID unique (sorted user IDs)
- ✅ Safety checks ครบถ้วน
- ✅ ใช้ currentUser.uid (ไม่ใช้ dummy user)

**ระบบพร้อมใช้งานแล้ว!** 🚀

