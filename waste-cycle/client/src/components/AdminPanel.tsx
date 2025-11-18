import { useState } from 'react';
import { Users, FileText, CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  farmName?: string;
  verified: boolean;
  postsCount: number;
  joinedDate: string;
}

const mockUsers: UserData[] = [
  { id: '1', name: 'สมชาย', email: 'somchai@farm.com', role: 'user', farmName: 'ฟาร์มไก่ไข่ภูเก็ต', verified: true, postsCount: 12, joinedDate: '2024-08-15' },
  { id: '2', name: 'สมหญิง', email: 'somying@farm.com', role: 'user', farmName: 'ฟาร์มโคนมสุรินทร์', verified: true, postsCount: 8, joinedDate: '2024-09-20' },
  { id: '3', name: 'สมศักดิ์', email: 'somsak@crop.com', role: 'user', farmName: 'ฟาร์มผักอินทรีย์', verified: false, postsCount: 3, joinedDate: '2024-11-05' },
  { id: '4', name: 'สมพร', email: 'somporn@farm.com', role: 'user', farmName: 'ฟาร์มมังคุด', verified: true, postsCount: 5, joinedDate: '2024-10-12' },
];

const mockReports = [
  { id: 'r1', type: 'post', targetId: 'p5', reason: 'ข้อมูลไม่ตรงกับสินค้าจริง', reporter: 'ผู้ใช้ A', date: '2024-11-10', status: 'pending' },
  { id: 'r2', type: 'user', targetId: 'u12', reason: 'พฤติกรรมไม่เหมาะสม', reporter: 'ผู้ใช้ B', date: '2024-11-09', status: 'pending' },
  { id: 'r3', type: 'post', targetId: 'p8', reason: 'ราคาไม่สมเหตุสมผล', reporter: 'ผู้ใช้ C', date: '2024-11-08', status: 'resolved' },
];

export function AdminPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('users');

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.farmName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl mb-6">จัดการระบบ</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ผู้ใช้ทั้งหมด</p>
                <p className="text-2xl">248</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">รอการยืนยัน</p>
                <p className="text-2xl">7</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">โพสต์ทั้งหมด</p>
                <p className="text-2xl">342</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">รายงานปัญหา</p>
                <p className="text-2xl">2</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="users">จัดการผู้ใช้</TabsTrigger>
          <TabsTrigger value="reports">รายงานปัญหา</TabsTrigger>
          <TabsTrigger value="settings">ตั้งค่าระบบ</TabsTrigger>
        </TabsList>

        {/* Users Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>จัดการผู้ใช้</CardTitle>
                  <CardDescription>ยืนยันและจัดการบัญชีผู้ใช้ในระบบ</CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="ค้นหาผู้ใช้..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อ</TableHead>
                      <TableHead>อีเมล</TableHead>
                      <TableHead>บทบาท</TableHead>
                      <TableHead>ฟาร์ม</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead>โพสต์</TableHead>
                      <TableHead>วันที่สมัคร</TableHead>
                      <TableHead>จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">ผู้ใช้ทั่วไป</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{user.farmName || '-'}</TableCell>
                        <TableCell>
                          {user.verified ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              ยืนยันแล้ว
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              รอยืนยัน
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{user.postsCount}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(user.joinedDate).toLocaleDateString('th-TH')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!user.verified && (
                              <Button size="sm" variant="outline">
                                ยืนยัน
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              ดู
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>รายงานปัญหา</CardTitle>
              <CardDescription>จัดการรายงานจากผู้ใช้</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReports.map(report => (
                  <Card key={report.id} className={report.status === 'pending' ? 'border-yellow-200 bg-yellow-50' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={report.type === 'post' ? 'default' : 'secondary'}>
                              {report.type === 'post' ? 'โพสต์' : 'ผู้ใช้'}
                            </Badge>
                            <Badge variant={report.status === 'pending' ? 'secondary' : 'outline'}>
                              {report.status === 'pending' ? 'รอดำเนินการ' : 'ดำเนินการแล้ว'}
                            </Badge>
                          </div>
                          <p className="mb-1">
                            <span className="text-gray-600">เหตุผล:</span> {report.reason}
                          </p>
                          <p className="text-sm text-gray-600">
                            รายงานโดย: {report.reporter} • {new Date(report.date).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        {report.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              ดูรายละเอียด
                            </Button>
                            <Button size="sm">
                              ดำเนินการ
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>ตั้งค่าระบบ</CardTitle>
              <CardDescription>กำหนดค่าการทำงานของระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p>อนุมัติโพสต์อัตโนมัติ</p>
                    <p className="text-sm text-gray-600">โพสต์จากผู้ขายที่ยืนยันแล้วจะถูกเผยแพร่ทันที</p>
                  </div>
                  <Button variant="outline">เปิดใช้งาน</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p>การแจ้งเตือน</p>
                    <p className="text-sm text-gray-600">ส่งการแจ้งเตือนผ่านอีเมลและ Line</p>
                  </div>
                  <Button variant="outline">ตั้งค่า</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p>สำรองข้อมูล</p>
                    <p className="text-sm text-gray-600">สำรองข้อมูลอัตโนมัติทุก 24 ชั่วโมง</p>
                  </div>
                  <Button variant="outline">สำรองเลย</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p>ราคาตลาดกลาง</p>
                    <p className="text-sm text-gray-600">อัปเดตราคาอ้างอิงจากตลาด</p>
                  </div>
                  <Button variant="outline">อัปเดต</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}