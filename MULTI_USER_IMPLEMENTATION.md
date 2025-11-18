# Multi-User Support Implementation Guide

## 📋 สรุปการแก้ไขระบบให้รองรับ Multi-User

ระบบ Waste-Cycle ได้รับการปรับปรุงให้รองรับผู้ใช้งานหลายบัญชี (Multi-User) อย่างสมบูรณ์ โดยแยกข้อมูลผู้ใช้แต่ละคนอย่างชัดเจน

---

## 🔧 ส่วนที่แก้ไข

### 1. **Backend - Product Controller** (`productController.js`)

#### ✅ สิ่งที่แก้ไข:

**1.1 เพิ่ม Endpoint `/my-posts`**
```javascript
/**
 * @desc    Get products for the current logged-in user only
 * @route   GET /api/products/my-posts
 * @access  Private
 * @note    Filters products by userId - shows only posts belonging to the current user
 *          Used in Profile page and Dashboard
 */
export const getMyProducts = async (req, res) => {
  // ดึง userId จาก req.user (มาจาก auth middleware)
  const userId = req.user.id || req.user.uid;
  
  // Filter ตาม userId - ดึงเฉพาะโพสต์ที่ userId ตรงกัน
  const snapshot = await db.collection("products").where("userId", "==", userId).get();
  // ...
}
```

**1.2 เพิ่ม Endpoint `/all` (สำหรับ Marketplace)**
```javascript
/**
 * @desc    Get all products (for Marketplace - shows posts from all users)
 * @route   GET /api/products/all
 * @access  Private
 * @note    Returns ALL posts from ALL users for the marketplace view
 */
export const getAllProducts = async (req, res) => {
  // ดึงโพสต์ทั้งหมดจากทุกคน (ไม่ filter ตาม userId)
  const snapshot = await db.collection("products").get();
  // ...
}
```

**1.3 เพิ่ม Authorization ใน `updateProduct`**
```javascript
/**
 * @desc    Update a product
 * @note    Only the owner of the product (userId matches) can update it
 *          This ensures multi-user security - users can only edit their own posts
 */
export const updateProduct = async (req, res) => {
  const userId = req.user.id || req.user.uid;
  const productData = productDoc.data();
  
  // Authorization check: Only the owner can update their product
  if (productData.userId !== userId) {
    return res.status(403).json({ 
      success: false, 
      message: "Forbidden: You can only update your own products" 
    });
  }
  // ...
}
```

**1.4 เพิ่ม Authorization ใน `deleteProduct`**
```javascript
/**
 * @desc    Delete a product
 * @note    Only the owner of the product (userId matches) can delete it
 */
export const deleteProduct = async (req, res) => {
  const userId = req.user.id || req.user.uid;
  const productData = productDoc.data();
  
  // Authorization check: Only the owner can delete their product
  if (productData.userId !== userId) {
    return res.status(403).json({ 
      success: false, 
      message: "Forbidden: You can only delete your own products" 
    });
  }
  // ...
}
```

#### 📝 API Routes ที่เพิ่ม (`productRoutes.js`):
- `GET /api/products/all` - ดึงโพสต์ทั้งหมด (Marketplace)
- `GET /api/products/my-posts` - ดึงโพสต์เฉพาะผู้ใช้ปัจจุบัน (Profile/Dashboard)
- `GET /api/products` - Legacy endpoint (ยังใช้ได้)

---

### 2. **Frontend - API Server** (`apiServer.ts`)

#### ✅ สิ่งที่แก้ไข:

```typescript
/**
 * Get all products from all users (for Marketplace)
 * This endpoint returns posts from ALL users combined
 * Used in: Marketplace page
 */
export const getAllProducts = () => {
  return api.get('/products/all');
};

/**
 * Get products for the current logged-in user only
 * This endpoint filters by userId - shows only posts belonging to the current user
 * Used in: Profile page, Dashboard
 */
export const getMyProducts = () => {
  return api.get('/products/my-posts');
};
```

---

### 3. **Frontend - App Component** (`App.tsx`)

#### ✅ สิ่งที่แก้ไข:

**3.1 แยก State สำหรับ Multi-User**
```typescript
// เดิม: const [posts, setPosts] = useState<Post[]>([]);

// ใหม่: แยกเป็น 2 state
const [allPosts, setAllPosts] = useState<Post[]>([]);  // All posts from all users (for Marketplace)
const [myPosts, setMyPosts] = useState<Post[]>([]);    // Current user's posts only (for Profile/Dashboard)
```

**3.2 แก้ไข `fetchAllData` Function**
```typescript
/**
 * Fetch all data for the current user
 * This function separates:
 * - allPosts: All posts from all users (for Marketplace)
 * - myPosts: Only current user's posts (for Profile/Dashboard)
 * - chatRooms: Chat rooms where current user is buyer or seller
 */
const fetchAllData = useCallback(async () => {
  // Fetch data in parallel
  const [allProductsResponse, myProductsResponse, chatRoomsResponse] = await Promise.all([
    getAllProducts(),    // Get ALL posts from ALL users (Marketplace)
    getMyProducts(),     // Get ONLY current user's posts (Profile/Dashboard)
    getChatRooms(),      // Get chat rooms where user is buyer or seller
  ]);
  
  setAllPosts(fetchedAllPosts);  // All posts for Marketplace
  setMyPosts(fetchedMyPosts);     // User's own posts for Profile/Dashboard
  setChatRooms(chatRoomsResponse.data.data || []);
}, [user]);
```

**3.3 แก้ไขการส่ง Props ให้ Components**
```typescript
// Dashboard - แสดงเฉพาะโพสต์ของผู้ใช้
<Dashboard 
  posts={myPosts}              // Show only current user's posts
  allPosts={allPosts}           // Show all posts for reference
/>

// Marketplace - แสดงโพสต์ทุกคนรวมกัน
<Marketplace 
  posts={allPosts}              // Show ALL posts from ALL users
/>

// ProfilePage - แสดงเฉพาะโพสต์ของผู้ใช้
<ProfilePage 
  posts={myPosts}              // Show only current user's posts in Profile
/>

// ChatPage - ใช้ allPosts เพื่อหา post details
<ChatPage 
  posts={allPosts}              // Use allPosts to find post details for any chat room
/>
```

---

### 4. **Frontend - ProfilePage Component** (`ProfilePage.tsx`)

#### ✅ สิ่งที่แก้ไข:

**4.1 เพิ่ม Props สำหรับ Posts**
```typescript
interface ProfilePageProps {
  user: User;
  posts: Post[];              // Only current user's posts (filtered by userId in backend)
  onViewDetail: (postId: string) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
}
```

**4.2 แสดงโพสต์ของผู้ใช้ใน Tab "ภาพรวม"**
```typescript
<TabsContent value="history">
  <Card>
    <CardHeader>
      <CardTitle>โพสต์ของฉัน ({posts.length})</CardTitle>
    </CardHeader>
    <CardContent>
      {posts.length === 0 ? (
        <div>ยังไม่มีโพสต์</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map(post => (
            // แสดงโพสต์แต่ละอันพร้อมปุ่มดู/แก้ไข/ลบ
          ))}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
```

**4.3 อัปเดต Stats Card**
```typescript
<p className="text-4xl text-blue-600 mb-2">{posts.length}</p>
<p className="text-gray-600">รายการทั้งหมด</p>
```

---

### 5. **Backend - Chat Controller** (`chatController.js`)

#### ✅ สิ่งที่แก้ไข:

**5.1 `getChatRooms` - Filter ตาม userId**
```javascript
/**
 * @desc    Get all chat rooms for the logged-in user
 * @note    Filters chat rooms where user is either buyer or seller
 *          Each user sees only their own chat rooms
 */
const getChatRooms = asyncHandler(async (req, res) => {
  const userId = req.user.uid || req.user.id;
  
  // ดึงห้องแชทที่ user เป็น buyer
  const chatsAsBuyerSnapshot = await db.collection('chats').where('buyerId', '==', userId).get();
  
  // ดึงห้องแชทที่ user เป็น seller
  const chatsAsSellerSnapshot = await db.collection('chats').where('sellerId', '==', userId).get();
  
  // รวมทั้งสองแบบ
  const chatRooms = [...chatsAsBuyer, ...chatsAsSeller];
  // ...
});
```

**5.2 `createChatRoom` - ใช้ userId จาก Auth**
```javascript
/**
 * @desc    Create a new chat room
 * @note    Uses userId from req.user (from auth middleware)
 *          buyerId is set from authenticated user
 */
const createChatRoom = asyncHandler(async (req, res) => {
  const buyerId = req.user.uid || req.user.id;  // จาก auth middleware
  // ...
});
```

---

## 🎯 ผลลัพธ์ที่ได้

### ✅ 1. หน้า Profile
- **แสดงเฉพาะโพสต์ของผู้ใช้คนปัจจุบัน**
- ถ้า login เป็น "นางเอก" → เห็นเฉพาะโพสต์ที่นางเอกเคยโพสต์
- ถ้า login เป็น "นายบี" → เห็นเฉพาะโพสต์ของนายบี
- มีปุ่มดู/แก้ไข/ลบสำหรับแต่ละโพสต์

### ✅ 2. หน้า Marketplace
- **แสดงโพสต์ของผู้ใช้ทุกคนรวมกัน**
- โพสต์ของนายเอ + นางเอก + นายบี ทั้งหมด
- ผู้ใช้สามารถดูและแชทกับโพสต์ของคนอื่นได้

### ✅ 3. หน้า Chat
- **แสดงเฉพาะห้องแชทที่ผู้ใช้คนนั้นเคยคุย**
- Filter ตาม userId (buyerId หรือ sellerId)
- แต่ละ user เห็นเฉพาะ chat rooms ของตัวเอง

### ✅ 4. Security (Authorization)
- **ผู้ใช้แก้ไข/ลบได้เฉพาะโพสต์ของตัวเอง**
- Backend ตรวจสอบ userId ก่อน update/delete
- ถ้าพยายามแก้ไขโพสต์ของคนอื่น → ได้ 403 Forbidden

### ✅ 5. Data Separation
- **ข้อมูลแยกตาม userId ชัดเจน**
- ทุกโพสต์มี userId ผูกไว้
- ทุก chat room มี buyerId และ sellerId
- ไม่มีข้อมูลปะปนกัน

---

## 📊 Flow การทำงาน

### Scenario 1: นางเอก Login
1. เรียก `getMyProducts()` → ได้โพสต์ที่ `userId === "นางเอก's userId"`
2. เรียก `getAllProducts()` → ได้โพสต์ทุกคนรวมกัน
3. เรียก `getChatRooms()` → ได้ chat rooms ที่ `buyerId === "นางเอก's userId"` หรือ `sellerId === "นางเอก's userId"`
4. Profile Page → แสดงเฉพาะโพสต์ของนางเอก
5. Marketplace → แสดงโพสต์ทุกคนรวมกัน

### Scenario 2: นายบี Login
1. เรียก `getMyProducts()` → ได้โพสต์ที่ `userId === "นายบี's userId"`
2. เรียก `getAllProducts()` → ได้โพสต์ทุกคนรวมกัน (เหมือนเดิม)
3. เรียก `getChatRooms()` → ได้ chat rooms ที่ `buyerId === "นายบี's userId"` หรือ `sellerId === "นายบี's userId"`
4. Profile Page → แสดงเฉพาะโพสต์ของนายบี
5. Marketplace → แสดงโพสต์ทุกคนรวมกัน

---

## 🔒 Security Features

1. **Authentication Required**: ทุก endpoint ต้อง login ก่อน (ใช้ `protect` middleware)
2. **Authorization Checks**: 
   - Update/Delete ตรวจสอบว่า userId ตรงกับเจ้าของโพสต์
   - ถ้าไม่ตรง → 403 Forbidden
3. **User ID from Auth**: ใช้ userId จาก auth middleware (ไม่ให้ client ส่งมาเอง)
4. **Prevent userId Tampering**: ใน updateProduct ลบ userId ออกจาก request body (ป้องกันการเปลี่ยน userId)

---

## 📝 API Endpoints Summary

| Endpoint | Method | Description | Returns |
|----------|--------|-------------|---------|
| `/api/products/all` | GET | Get all posts from all users | All posts (Marketplace) |
| `/api/products/my-posts` | GET | Get current user's posts only | User's posts (Profile/Dashboard) |
| `/api/products` | GET | Legacy - same as `/all` | All posts |
| `/api/products` | POST | Create new post | Auto-assigns userId |
| `/api/products/:id` | PUT | Update post | Only owner can update |
| `/api/products/:id` | DELETE | Delete post | Only owner can delete |
| `/api/chat` | GET | Get user's chat rooms | Filtered by userId |
| `/api/chat` | POST | Create chat room | Auto-assigns buyerId |

---

## ✅ Checklist การทดสอบ

- [ ] Login เป็น User A → Profile แสดงเฉพาะโพสต์ของ User A
- [ ] Login เป็น User B → Profile แสดงเฉพาะโพสต์ของ User B
- [ ] Marketplace แสดงโพสต์ทุกคนรวมกัน
- [ ] User A ไม่สามารถแก้ไขโพสต์ของ User B ได้
- [ ] User A ไม่สามารถลบโพสต์ของ User B ได้
- [ ] Chat แสดงเฉพาะห้องแชทที่ User A เคยคุย
- [ ] สร้างโพสต์ใหม่ → userId ถูกผูกอัตโนมัติ
- [ ] Logout → ข้อมูลถูกล้าง

---

## 🎉 สรุป

ระบบตอนนี้รองรับ Multi-User อย่างสมบูรณ์:
- ✅ แยกข้อมูลผู้ใช้ชัดเจน
- ✅ Profile แสดงเฉพาะโพสต์ของผู้ใช้
- ✅ Marketplace แสดงโพสต์ทุกคน
- ✅ Chat แสดงเฉพาะห้องแชทของผู้ใช้
- ✅ Security: ผู้ใช้แก้ไข/ลบได้เฉพาะโพสต์ของตัวเอง
- ✅ ทุก API filter ตาม userId

