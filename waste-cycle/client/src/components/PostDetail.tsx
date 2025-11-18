import { ArrowLeft, MapPin, Calendar, Package, DollarSign, Edit, Trash2, MessageCircle, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Post } from '../App';

interface PostDetailProps {
  post: Post;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isMyPost: boolean;
  onChat: () => void;
}

export function PostDetail({ post, onBack, onEdit, onDelete, isMyPost, onChat }: PostDetailProps) {
  const handleDelete = () => {
    if (confirm('คุณต้องการลบโพสต์นี้หรือไม่?')) {
      onDelete();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> กลับ
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{post.title}</CardTitle>
              <div className="flex gap-2 mb-2">
                <Badge className={post.sold ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                  {post.sold ? "ขายแล้ว" : "พร้อมขาย"}
                </Badge>
                {post.verified && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    ยืนยันแล้ว
                  </Badge>
                )}
              </div>
            </div>
            {isMyPost && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-1" />
                  แก้ไข
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  ลบ
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Images */}
          {post.images && Array.isArray(post.images) && post.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.images.map((img, index) => (
                <div key={index} className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <ImageWithFallback 
                    src={img} 
                    alt={`${post.title || 'Product'} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {(!post.images || !Array.isArray(post.images) || post.images.length === 0) && (
            <div className="w-full h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-16 h-16 text-gray-300" />
            </div>
          )}

          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">ประเภทสัตว์</p>
                <p className="text-lg">{post.animalType}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">ประเภทของเสีย</p>
                <p className="text-lg">{post.wasteType}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">ปริมาณ</p>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" />
                  <p className="text-lg">{post.quantity} กก.</p>
                </div>
                <p className="text-sm text-gray-500">{post.unit}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">ราคา</p>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <p className="text-xl text-green-600">฿{post.price}/กก.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">ที่อยู่</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <p>{post.address}</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">ระยะทาง {post.distance.toFixed(1)} กิโลเมตร</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">คุณค่า NPK</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">N: {post.npk.n}%</Badge>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">P: {post.npk.p}%</Badge>
                  <Badge variant="outline" className="text-purple-600 border-purple-600">K: {post.npk.k}%</Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">อาหารที่ให้สัตว์</p>
                <p>{post.feedType}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">วันที่ลงประกาศ</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <p>{new Date(post.createdDate).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm text-gray-600 mb-2">รายละเอียด</p>
            <p className="text-gray-700 leading-relaxed">{post.description}</p>
          </div>

          {/* Contact Info */}
          {!isMyPost && (
            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-3">ติดต่อผู้ขาย</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={onChat}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  พูดคุย
                </Button>
                <Button variant="outline" className="flex-1">โทร {post.contactPhone}</Button>
                <Button className="flex-1 bg-green-700 hover:bg-green-800">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  จองเลย
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}