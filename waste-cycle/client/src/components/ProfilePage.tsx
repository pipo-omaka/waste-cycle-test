import { useState } from 'react';
import { MapPin, Phone, Mail, Calendar, Star, Package, TrendingUp, Edit, Save, X, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { User, Post } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProfilePageProps {
  user: User;
  posts: Post[];              // Only current user's posts (filtered by userId in backend)
  onViewDetail: (postId: string) => void;
  onEdit: (postId: string) => void;
  onDelete: (postId: string) => void;
}

/**
 * ProfilePage Component
 * 
 * MULTI-USER SUPPORT:
 * - This page displays ONLY the current logged-in user's posts
 * - Posts are filtered by userId in the backend (getMyProducts API)
 * - Each user sees only their own posts when they visit their profile
 * 
 * Example:
 * - If "นางเอก" logs in → sees only posts where userId === "นางเอก's userId"
 * - If "นายบี" logs in → sees only posts where userId === "นายบี's userId"
 */
export function ProfilePage({ user, posts, onViewDetail, onEdit, onDelete }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: user.name,
    farmName: user.farmName || '',
    email: user.email,
    phone: '081-234-5678',
    location: 'นครปฐม',
  });

  const handleSave = () => {
    // In real app, this would update the database
    alert('บันทึกข้อมูลสำเร็จ!');
    setIsEditing(false);
  };

  const transactions = [
    {
      id: '1',
      icon: <Package className="w-10 h-10 text-green-600" />,
      title: 'ปุ๋ยมูลไก่พร้อมใช้',
      subtitle: 'ฟาร์มไก่ไข่ภูเก็ต · 300 กก. · 15 พ.ค. 2024',
      status: 'สำเร็จ',
      statusColor: 'bg-green-100 text-green-800',
    },
    {
      id: '2',
      icon: <Package className="w-10 h-10 text-green-600" />,
      title: 'มูลโคหมักคุณภาพดี',
      subtitle: 'ฟาร์มโคนมสุรินทร์ · 500 กก. · 10 พ.ค. 2024',
      status: 'สำเร็จ',
      statusColor: 'bg-green-100 text-green-800',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Profile Header Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-4xl text-white overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.[0] || 'U'}</span>
                  )}
                </div>
                <Badge className="absolute top-0 right-0 bg-green-500 text-white">
                  ✓ ยืนยันแล้ว
                </Badge>
              </div>

              {/* User Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">ชื่อ</Label>
                        <Input
                          id="name"
                          value={editedData.name}
                          onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="farmName">ชื่อฟาร์ม</Label>
                        <Input
                          id="farmName"
                          value={editedData.farmName}
                          onChange={(e) => setEditedData({ ...editedData, farmName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">อีเมล</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editedData.email}
                          onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">เบอร์โทร</Label>
                        <Input
                          id="phone"
                          value={editedData.phone}
                          onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="location">ที่อยู่</Label>
                        <Input
                          id="location"
                          value={editedData.location}
                          onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        บันทึก
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4 mr-2" />
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        {/* MULTI-USER SAFETY: Check user data before displaying */}
                        <h1 className="text-2xl mb-1">{user?.name ?? 'ผู้ใช้'}</h1>
                        <p className="text-gray-600 mb-3">{user?.farmName ?? ''}</p>
                        <p className="text-sm text-gray-600">{user?.email ?? ''}</p>
                      </div>
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        แก้ไขโปรไฟล์
                      </Button>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{editedData.location || 'ยังไม่ได้ระบุ'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{editedData.phone || 'ยังไม่ได้ระบุ'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{user?.email ?? editedData.email ?? 'ยังไม่ได้ระบุ'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>มกราคม 2024</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-yellow-50">
            <CardContent className="pt-6 text-center">
              <Star className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <p className="text-4xl text-yellow-600 mb-2">4.8</p>
              <p className="text-gray-600">คะแนนเฉลี่ย</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardContent className="pt-6 text-center">
              <Package className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <p className="text-4xl text-blue-600 mb-2">{posts.length}</p>
              <p className="text-gray-600">รายการทั้งหมด</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-4xl text-green-600 mb-2">4</p>
              <p className="text-gray-600">เครือข่ายธุรกิจ</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="history" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">ภาพรวม</TabsTrigger>
            <TabsTrigger value="transactions">ประวัติการซื้อ</TabsTrigger>
            <TabsTrigger value="reviews">รางวัล</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>โพสต์ของฉัน ({posts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>ยังไม่มีโพสต์</p>
                    <p className="text-sm mt-2">ไปที่ Marketplace เพื่อสร้างโพสต์แรกของคุณ</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.map(post => (
                      <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Post Image */}
                        <div className="relative h-48 bg-gradient-to-br from-green-100 to-blue-100">
                          {post.images && Array.isArray(post.images) && post.images.length > 0 && post.images[0] ? (
                            <ImageWithFallback 
                              src={post.images[0]} 
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-16 h-16 text-gray-300" />
                            </div>
                          )}
                          {post.sold && (
                            <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                              ✓ ขายแล้ว
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 truncate">{post.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{post.farmName}</p>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-lg text-green-600">฿{post.price}</p>
                            <p className="text-sm text-gray-500">{post.quantity} {post.unit}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => onViewDetail(post.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              ดู
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onEdit(post.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (confirm('คุณต้องการลบโพสต์นี้หรือไม่?')) {
                                  onDelete(post.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>รายการซื้อขายล่าสุด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map(transaction => (
                    <TransactionCard key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">ยังไม่มีรางวัล</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface Transaction {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: string;
  statusColor: string;
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="bg-green-50 p-3 rounded-full">
        {transaction.icon}
      </div>
      <div className="flex-1">
        <h3 className="mb-1">{transaction.title}</h3>
        <p className="text-sm text-gray-600">{transaction.subtitle}</p>
      </div>
      <Badge className={transaction.statusColor}>
        {transaction.status}
      </Badge>
    </div>
  );
}