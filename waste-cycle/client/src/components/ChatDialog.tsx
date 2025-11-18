import { X, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { Post, User } from '../App';

interface ChatDialogProps {
  post: Post;
  currentUser: User;
  onClose: () => void;
  onConfirm: () => void;
}

export function ChatDialog({ post, currentUser, onClose, onConfirm }: ChatDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>เริ่มการสนทนา</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-center text-gray-700">
              ต้องการแชทกับ <span className="font-medium">{post.farmName}</span> เกี่ยวกับ
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-1">{post.title}</p>
              <p className="text-sm text-gray-600">{post.animalType} • ฿{post.price}/กก.</p>
            </div>
            <p className="text-sm text-gray-600 text-center">
              เมื่อยืนยันแล้ว จะเพิ่มการสนทนานี้ไปยังรายการแชทของคุณ
            </p>
            <p className="text-sm font-medium text-red-600 text-center">
              ⚠️ เมื่อยืนยันแล้ว โพสต์นี้จะเปลี่ยนสถานะเป็น "ขายแล้ว"
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={onConfirm}>
              ยืนยัน
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}