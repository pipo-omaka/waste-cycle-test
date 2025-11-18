import React, { useState } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';

const MarketplacePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  const farms = [
    { id: 1, name: 'ฟาร์มโคนมสุขสันต์', type: 'วัว', distance: 2.5, price: 150, unit: 'ถุง', stock: 50, image: '🐄', rating: 4.8 },
    { id: 2, name: 'ฟาร์มไก่ไข่ใหญ่', type: 'ไก่', distance: 5.2, price: 80, unit: 'ถุง', stock: 100, image: '🐔', rating: 4.5 },
    { id: 3, name: 'ฟาร์มสุกรเจริญ', type: 'หมู', distance: 3.8, price: 120, unit: 'ถุง', stock: 30, image: '🐷', rating: 4.7 },
    { id: 4, name: 'ฟาร์มแพะแกะภูเขา', type: 'แพะ', distance: 7.1, price: 100, unit: 'ถุง', stock: 25, image: '🐐', rating: 4.6 },
    { id: 5, name: 'ฟาร์มเป็ดเทศ', type: 'เป็ด', distance: 4.3, price: 90, unit: 'ถุง', stock: 40, image: '🦆', rating: 4.4 },
    { id: 6, name: 'ฟาร์มกระต่ายน่ารัก', type: 'กระต่าย', distance: 6.5, price: 70, unit: 'ถุง', stock: 20, image: '🐰', rating: 4.3 },
  ];

  const filteredFarms = farms.filter(farm => {
    const matchSearch = farm.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'all' || farm.type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏪 ตลาดซื้อขายมูลสัตว์</h1>
          <p className="text-gray-600">ค้นหาและเชื่อมต่อกับฟาร์มใกล้คุณ</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาชื่อฟาร์ม..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              กรอง
            </button>
          </div>

          {showFilter && (
            <div className="flex gap-2 flex-wrap">
              {['all', 'วัว', 'ไก่', 'หมู', 'แพะ', 'เป็ด', 'กระต่าย'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full text-sm ${
                    selectedType === type
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'ทั้งหมด' : type}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Farm Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFarms.map((farm) => (
            <div key={farm.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 h-32 flex items-center justify-center text-6xl">
                {farm.image}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{farm.name}</h3>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    ⭐ {farm.rating}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">ชนิด: มูล{farm.type}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{farm.distance} กม.</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-2xl font-bold text-green-600">{farm.price}</span>
                    <span className="text-gray-600"> บาท/{farm.unit}</span>
                  </div>
                  <span className="text-sm text-gray-500">คงเหลือ {farm.stock} ถุง</span>
                </div>
                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                  ติดต่อเลย
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;