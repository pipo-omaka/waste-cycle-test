import React, { useState } from 'react';

const AdvisorPage = () => {
  const [plantType, setPlantType] = useState('');
  const [plantAge, setPlantAge] = useState('');
  const [area, setArea] = useState('');
  const [showResult, setShowResult] = useState(false);

  const handleCalculate = (e) => {
    e.preventDefault();
    setShowResult(true);
  };

  const fertilizerRecommendations = [
    { farm: 'ฟาร์มโคนมสุขสันต์', type: 'มูลวัว', npk: '2-1-2', distance: 2.5, price: 150, match: 95 },
    { farm: 'ฟาร์มไก่ไข่ใหญ่', type: 'มูลไก่', npk: '3-2-1', distance: 5.2, price: 80, match: 88 },
    { farm: 'ฟาร์มสุกรเจริญ', type: 'มูลหมู', npk: '2-2-1', distance: 3.8, price: 120, match: 82 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">💡 ระบบให้คำแนะนำ</h1>
          <p className="text-gray-600 mb-6">คำนวณปุ๋ยที่เหมาะสมกับพืชของคุณ</p>

          <form onSubmit={handleCalculate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชนิดพืช *
              </label>
              <select
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                value={plantType}
                onChange={(e) => setPlantType(e.target.value)}
              >
                <option value="">-- เลือกชนิดพืช --</option>
                <option value="ข้าว">ข้าว</option>
                <option value="ข้าวโพด">ข้าวโพด</option>
                <option value="มะเขือเทศ">มะเขือเทศ</option>
                <option value="ผักกาดหอม">ผักกาดหอม</option>
                <option value="พริก">พริก</option>
                <option value="กล้วย">กล้วย</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  อายุพืช (วัน) *
                </label>
                <input
                  type="number"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  value={plantAge}
                  onChange={(e) => setPlantAge(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  พื้นที่ปลูก (ไร่) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              คำนวณและแนะนำ
            </button>
          </form>
        </div>

        {showResult && (
          <>
            {/* NPK Analysis */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">⚗️ วิเคราะห์ N-P-K</h2>
              <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-6">
                <p className="text-gray-800">
                  <strong>พืช:</strong> {plantType} (อายุ {plantAge} วัน)
                </p>
                <p className="text-gray-800">
                  <strong>พื้นที่:</strong> {area} ไร่
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">2.5%</div>
                  <p className="text-gray-600 mt-2">ไนโตรเจน (N)</p>
                  <p className="text-sm text-gray-500">สร้างใบและลำต้น</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-orange-600">1.8%</div>
                  <p className="text-gray-600 mt-2">ฟอสฟอรัส (P)</p>
                  <p className="text-sm text-gray-500">พัฒนารากและดอก</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">2.0%</div>
                  <p className="text-gray-600 mt-2">โพแทสเซียม (K)</p>
                  <p className="text-sm text-gray-500">เพิ่มความแข็งแรง</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">💊 คำแนะนำ:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>✓ ควรใช้ปุ๋ยในอัตรา <strong>150-200 กก./ไร่</strong></li>
                  <li>✓ แนะนำให้ใส่ปุ๋ยทุก <strong>15 วัน</strong></li>
                  <li>✓ เหมาะสมกับ<strong>มูลวัวหรือมูลไก่</strong></li>
                </ul>
              </div>
            </div>

            {/* Fertilizer Recommendations */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🌾 ฟาร์มที่แนะนำ</h2>
              <p className="text-gray-600 mb-6">เรียงตามความเหมาะสม (Matching Score)</p>

              <div className="space-y-4">
                {fertilizerRecommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{rec.farm}</h3>
                        <p className="text-sm text-gray-600">{rec.type}</p>
                      </div>
                      <div className="text-right">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {rec.match}% Match
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">N-P-K Ratio</p>
                        <p className="font-semibold text-gray-800">{rec.npk}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">ระยะทาง</p>
                        <p className="font-semibold text-gray-800">{rec.distance} กม.</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">ราคา</p>
                        <p className="font-semibold text-gray-800">{rec.price} บาท/ถุง</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">ต้นทุนรวม</p>
                        <p className="font-semibold text-green-600">
                          {Math.round(rec.price * area * 2)} บาท
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                        ติดต่อเลย
                      </button>
                      <button className="px-4 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdvisorPage;