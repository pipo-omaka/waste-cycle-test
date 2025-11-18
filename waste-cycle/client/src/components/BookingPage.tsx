import { useState } from 'react';
import { Calendar, Package, User, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { User as UserType } from '../App';

interface BookingPageProps {
  user: UserType;
}

interface Booking {
  id: string;
  postId: string;
  buyerName: string;
  sellerName: string;
  farmName: string;
  wasteType: string;
  quantity: number;
  totalPrice: number;
  pickupDate: string;
  status: 'requested' | 'accepted' | 'confirmed' | 'in-transit' | 'completed' | 'cancelled';
  distance: number;
  npk: { n: number; p: number; k: number };
}

const mockBookings: Booking[] = [
  {
    id: 'b1',
    postId: 'p1',
    buyerName: 'ฟาร์มผักอินทรีย์',
    sellerName: 'ฟาร์มไก่ไข่ภูเก็ต',
    farmName: 'ฟาร์มไก่ไข่ภูเก็ต',
    wasteType: 'มูลไก่แห้ง',
    quantity: 200,
    totalPrice: 60000,
    pickupDate: '2025-11-15',
    status: 'requested',
    distance: 12.5,
    npk: { n: 3.2, p: 2.8, k: 1.5 },
  },
  {
    id: 'b2',
    postId: 'p2',
    buyerName: 'ฟาร์มข้าวโพด',
    sellerName: 'ฟาร์มโคนมสุรินทร์',
    farmName: 'ฟาร์มโคนมสุรินทร์',
    wasteType: 'มูลโคหมัก',
    quantity: 500,
    totalPrice: 125000,
    pickupDate: '2025-11-12',
    status: 'in-transit',
    distance: 8.3,
    npk: { n: 2.5, p: 1.8, k: 2.1 },
  },
  {
    id: 'b3',
    postId: 'p3',
    buyerName: 'ฟาร์มผักสวนครัว',
    sellerName: 'ฟาร์มสุกรนครปฐม',
    farmName: 'ฟาร์มสุกรนครปฐม',
    wasteType: 'มูลสุกรสด',
    quantity: 300,
    totalPrice: 60000,
    pickupDate: '2025-11-08',
    status: 'completed',
    distance: 15.7,
    npk: { n: 3.8, p: 3.2, k: 2.4 },
  },
];

export function BookingPage({ user }: BookingPageProps) {
  const [selectedTab, setSelectedTab] = useState('all');

  const filteredBookings = mockBookings.filter(booking => {
    if (selectedTab === 'all') return true;
    return booking.status === selectedTab;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl mb-6">การจอง</h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value="requested">รอยืนยัน</TabsTrigger>
          <TabsTrigger value="accepted">ยืนยันแล้ว</TabsTrigger>
          <TabsTrigger value="in-transit">กำลังจัดส่ง</TabsTrigger>
          <TabsTrigger value="completed">เสร็จสิ้น</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                userRole={user.role}
              />
            ))}

            {filteredBookings.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">ไม่พบรายการจอง</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingCard({ booking, userRole }: { booking: Booking; userRole: string | null }) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      requested: { label: 'รอยืนยัน', variant: 'secondary' as const, icon: AlertCircle, color: 'text-yellow-600' },
      accepted: { label: 'ยืนยันแล้ว', variant: 'secondary' as const, icon: CheckCircle, color: 'text-blue-600' },
      confirmed: { label: 'พร้อมรับ', variant: 'secondary' as const, icon: CheckCircle, color: 'text-green-600' },
      'in-transit': { label: 'กำลังจัดส่ง', variant: 'default' as const, icon: Clock, color: 'text-purple-600' },
      completed: { label: 'เสร็จสิ้น', variant: 'secondary' as const, icon: CheckCircle, color: 'text-green-600' },
      cancelled: { label: 'ยกเลิก', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Determine if current user is seller or buyer for this booking
  const isMyPost = booking.sellerName === 'ฟาร์มของฉัน'; // Mock - in real app, check against user ID

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{booking.farmName}</CardTitle>
            <CardDescription>
              รหัสการจอง: {booking.id} • {isMyPost ? 'คุณขาย' : 'คุณซื้อ'}
            </CardDescription>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">ประเภท</p>
              <p>{booking.wasteType}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">
                {isMyPost ? 'ผู้ซื้อ' : 'ผู้ขาย'}
              </p>
              <p>{isMyPost ? booking.buyerName : booking.sellerName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">วันที่รับของ</p>
              <p>{new Date(booking.pickupDate).toLocaleDateString('th-TH')}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">ระยะทาง</p>
              <p>{booking.distance} กม.</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">ปริมาณ</p>
              <p>{booking.quantity} กก.</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ราคารวม</p>
              <p>฿{booking.totalPrice.toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600 mb-1">คุณค่า NPK</p>
              <div className="flex gap-2">
                <Badge variant="outline">N: {booking.npk.n}%</Badge>
                <Badge variant="outline">P: {booking.npk.p}%</Badge>
                <Badge variant="outline">K: {booking.npk.k}%</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons based on who you are and status */}
        <div className="flex gap-2 pt-2">
          {isMyPost && booking.status === 'requested' && (
            <>
              <Button className="flex-1">ยืนยันการจอง</Button>
              <Button variant="destructive" className="flex-1">ปฏิเสธ</Button>
            </>
          )}

          {!isMyPost && booking.status === 'accepted' && (
            <Button className="w-full">ยืนยันการรับของ</Button>
          )}

          {booking.status === 'in-transit' && (
            <Button variant="outline" className="w-full">ติดตามสถานะ</Button>
          )}

          {booking.status === 'completed' && (
            <Button variant="outline" className="w-full">ดูใบเสร็จ</Button>
          )}

          {(booking.status === 'requested' || booking.status === 'accepted') && (
            <Button variant="outline" className="flex-1">ติดต่อผู้{isMyPost ? 'ซื้อ' : 'ขาย'}</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}