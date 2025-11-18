import React from 'react';

const DashboardPage = () => {
  const stats = [
    { label: 'ยอดขายรวม', value: '12,450', unit: 'บาท', icon: '💰', color: 'bg-green-500' },
    { label: 'การแลกเปลี่ยน', value: '48', unit: 'ครั้ง', icon: '🔄', color: 'bg-blue-500' },
    { label: 'ของเสียที่จัดการ', value: '2,340', unit: 'กก.', icon: '♻️', color: 'bg-purple-500' },
    { label: 'CO₂ ที่ลดได้', value: '567', unit: 'กก.', icon: '🌍', color: 'bg-emerald-500' },
  ];

  const recentTransactions = [
    { id: 1, farm: 'ฟาร์มโคนมสุขสันต์', type: 'มูลวัว', amount: 1500, date: '10 พ.ย. 67', status: 'สำเร็จ' },
    { id: 2, farm: 'ฟาร์มไก่ไข่ใหญ่', type: 'มูลไก่', amount: 800, date: '9 พ.ย. 67', status: 'สำเร็จ' },
    { id: 3, farm: 'ฟาร์มสุกรเจริญ', type: 'มูลหมู', amount: 1200, date: '8 พ.ย. 67', status: 'รอยืนยัน' },
    { id: 4, farm: 'ฟาร์มแพะแกะ', type: 'มูลแพะ', amount: 600, date: '7 พ.ย. 67', status: 'สำเร็จ' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">📊 Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4`}>
                {stat.icon}
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
                <span className="text-gray-500 mb-1">{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📈 ยอดขายรายเดือน</h2>
            <div className="h-64 flex items-end justify-around gap-2">
              {[65, 80, 75, 90, 85, 95].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-green-500 rounded-t"
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">🥧 ประเภทของเสีย</h2>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">มูลวัว 35%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm">มูลไก่ 25%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="text-sm">มูลหมู 20%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-sm">อื่นๆ 20%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📝 ธุรกรรมล่าสุด</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">ฟาร์ม</th>
                  <th className="text-left py-3 px-4">ประเภท</th>
                  <th className="text-left py-3 px-4">จำนวนเงิน</th>
                  <th className="text-left py-3 px-4">วันที่</th>
                  <th className="text-left py-3 px-4">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{tx.farm}</td>
                    <td className="py-3 px-4">{tx.type}</td>
                    <td className="py-3 px-4 font-semibold">{tx.amount} บาท</td>
                    <td className="py-3 px-4 text-gray-600">{tx.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        tx.status === 'สำเร็จ' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;