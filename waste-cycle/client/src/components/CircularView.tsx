import { Recycle, TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const wasteTypeData = [
  { name: 'มูลไก่', value: 40, color: '#10b981' },
  { name: 'มูลโค', value: 30, color: '#3b82f6' },
  { name: 'มูลสุกร', value: 20, color: '#f59e0b' },
  { name: 'มูลเป็ด', value: 10, color: '#a855f7' },
];

const monthlyGrowthData = [
  { month: 'ม.ค.', waste: 180, value: 32000 },
  { month: 'ก.พ.', waste: 210, value: 35000 },
  { month: 'มี.ค.', waste: 195, value: 33000 },
  { month: 'เม.ย.', waste: 240, value: 42000 },
  { month: 'พ.ค.', waste: 280, value: 48000 },
  { month: 'มิ.ย.', waste: 320, value: 60000 },
];

export function CircularView() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl mb-8">สถิติและการวิเคราะห์</h1>
        
        {/* Header Text */}
        <div className="mb-8">
          <h2 className="text-xl mb-2">ข้อมูลการแลกเปลี่ยนของเสียและมูลค่าทางเศรษฐกิจ</h2>
          <p className="text-gray-600">ข้อมูลการแลกเปลี่ยนของเสียและมูลค่าทางเศรษฐกิจ</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="ของเสียรวม (เดือนนี้)"
            value="320"
            unit="ตัน"
            change="+14.3%"
            changeLabel="จากเดือนที่แล้ว"
            icon={<Package className="w-8 h-8 text-green-600" />}
            bgColor="bg-green-50"
          />
          
          <StatsCard
            title="มูลค่า (เดือนนี้)"
            value="48,000"
            unit="บาท"
            change="+14.3%"
            changeLabel="จากเดือนที่แล้ว"
            icon={<DollarSign className="w-8 h-8 text-blue-600" />}
            bgColor="bg-blue-50"
          />
          
          <StatsCard
            title="รายการซื้อขาย"
            value="143"
            unit="ครั้ง"
            change="+8.3%"
            changeLabel="จากเดือนที่แล้ว"
            icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
            bgColor="bg-purple-50"
          />
          
          <StatsCard
            title="ผู้ใช้งานใหม่"
            value="28"
            unit="ราย"
            change="+12.0%"
            changeLabel="จากเดือนที่แล้ว"
            icon={<Users className="w-8 h-8 text-orange-600" />}
            bgColor="bg-orange-50"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>แนวโน้มรายเดือน</CardTitle>
              <CardDescription>ปริมาณของเสียและมูลค่าการซื้อขาย</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip />
                  <Legend 
                    wrapperStyle={{ fontSize: '14px' }}
                    iconType="circle"
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="waste" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="ของเสีย (ตัน)"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="มูลค่า (บาท)"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>สัดส่วนประเภทของเสีย</CardTitle>
              <CardDescription>แบ่งตามชนิดของสัตว์</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={wasteTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {wasteTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                {wasteTypeData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Impact Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="w-6 h-6 text-green-600" />
              ผลกระทบเชิงบวกต่อสิ่งแวดล้อม
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <p className="text-4xl text-green-600 mb-2">12.4</p>
                <p className="text-gray-600">ตันของเสียที่หมุนเวียน</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <p className="text-4xl text-blue-600 mb-2">8.2</p>
                <p className="text-gray-600">ตัน CO₂ ที่ลดได้</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <p className="text-4xl text-purple-600 mb-2">฿1.2M</p>
                <p className="text-gray-600">ประหยัดต้นทุนปุ๋ยเคมี</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  unit: string;
  change: string;
  changeLabel: string;
  icon: React.ReactNode;
  bgColor: string;
}

function StatsCard({ title, value, unit, change, changeLabel, icon, bgColor }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl">{value}</p>
              <p className="text-gray-600">{unit}</p>
            </div>
            <p className="text-sm text-green-600 mt-2">
              {change} <span className="text-gray-500">{changeLabel}</span>
            </p>
          </div>
          <div className={`${bgColor} p-3 rounded-lg`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
