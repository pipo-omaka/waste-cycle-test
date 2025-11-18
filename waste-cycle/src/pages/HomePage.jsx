import React from 'react';
import { Recycle, TrendingUp } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Recycle className="w-20 h-20 text-green-600 animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            ♻️ WASTE-CYCLE
          </h1>
          <p className="text-2xl text-green-700 mb-2">
            หมุนของเสียให้กลายเป็นคุณค่า
          </p>
          <p className="text-lg text-gray-600">
            Smart Farming for a Sustainable Future
          </p>
        </div>

        {/* Concept Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🐄</div>
            <h3 className="text-xl font-semibold mb-2">ฟาร์มสัตว์</h3>
            <p className="text-gray-600">ส่งมูลสัตว์และของเสียให้ฟาร์มพืช สร้างรายได้จากที่เคยทิ้ง</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold mb-2">วงจรหมุนเวียน</h3>
            <p className="text-gray-600">เชื่อมโยงการแลกเปลี่ยนของเสีย สร้างเศรษฐกิจหมุนเวียน</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🌾</div>
            <h3 className="text-xl font-semibold mb-2">ฟาร์มพืช</h3>
            <p className="text-gray-600">รับมูลสัตว์คุณภาพดี ส่งเศษพืชกลับไปเลี้ยงสัตว์</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">ข้อมูลจากการสำรวจ</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">59.4%</div>
              <p className="text-gray-600">ใช้มูลสัตว์เป็นปุ๋ยเป็นประจำ</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">46.9%</div>
              <p className="text-gray-600">เจอปัญหาหาแหล่งซื้อยาก</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">93.8%</div>
              <p className="text-gray-600">สนใจใช้แพลตฟอร์มนี้</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-xl text-gray-700 mb-4">
            "ของเสียไม่สูญเปล่า สู่วิถีเกษตรยั่งยืน"
          </p>
          <button className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors">
            เริ่มใช้งานเลย
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;