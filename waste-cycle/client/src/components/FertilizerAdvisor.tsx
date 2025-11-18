import { useState } from 'react';
import { Sprout, Calculator, TrendingUp, Leaf, Droplets, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

interface FertilizerAdvisorProps {
  defaultTab?: 'recommendation' | 'calculator';
  onTabChange?: (tab: 'recommendation' | 'calculator') => void;
}

export function FertilizerAdvisor({ defaultTab = 'recommendation', onTabChange }: FertilizerAdvisorProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (tab: 'recommendation' | 'calculator') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="recommendation">
              <BookOpen className="w-4 h-4 mr-2" />
              คำแนะนำปุ๋ย
            </TabsTrigger>
            <TabsTrigger value="calculator">
              <Calculator className="w-4 h-4 mr-2" />
              คำนวณ NPK
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommendation">
            <FertilizerRecommendation />
          </TabsContent>

          <TabsContent value="calculator">
            <NPKCalculatorContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FertilizerRecommendation() {
  const [cropType, setCropType] = useState('');
  const [area, setArea] = useState('');
  const [growthStage, setGrowthStage] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleCalculate = () => {
    if (cropType && area && growthStage) {
      setShowResults(true);
    }
  };

  const recommendedSources = [
    {
      id: '1',
      name: 'มูลไก่อินทรีย์',
      seller: 'ฟาร์มไก่ไข่ภูเก็ต',
      npk: { n: 3.5, p: 3.0, k: 1.8 },
      price: 320,
      distance: 4.2,
      matchScore: 95,
    },
    {
      id: '2',
      name: 'มูลโคนมพร้อมใช้',
      seller: 'ฟาร์มโคนมสุรินทร์',
      npk: { n: 2.5, p: 1.8, k: 2.1 },
      price: 250,
      distance: 8.3,
      matchScore: 88,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sprout className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl mb-2">ระบบแนะนำปุ๋ย</h1>
        <p className="text-gray-600">คำนวณปุ๋ยที่เหมาะสมตามชนิดของพืชและขนิดของพื้นที่</p>
      </div>

      {/* Input Form */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="crop-type" className="mb-2 block">ชนิดพืช</Label>
              <Select value={cropType} onValueChange={setCropType}>
                <SelectTrigger id="crop-type">
                  <SelectValue placeholder="เลือกชนิดพืช" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetables">ผักใบ</SelectItem>
                  <SelectItem value="fruits">ผลไม้</SelectItem>
                  <SelectItem value="rice">ข้าว</SelectItem>
                  <SelectItem value="corn">ข้าวโพด</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="area" className="mb-2 block">พื้นที่ปลูก (ไร่)</Label>
              <Input
                id="area"
                type="number"
                placeholder="0"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="growth-stage" className="mb-2 block">ระยะเจริญเติบโต</Label>
              <Select value={growthStage} onValueChange={setGrowthStage}>
                <SelectTrigger id="growth-stage">
                  <SelectValue placeholder="เลือกระยะเจริญเติบโต" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seedling">ระยะต้นเริ่มต้น</SelectItem>
                  <SelectItem value="vegetative">ระยะเจริญเติบโต</SelectItem>
                  <SelectItem value="flowering">ระยะผลไม้</SelectItem>
                  <SelectItem value="fruiting">ระยะผลผลไม้</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleCalculate} 
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              disabled={!cropType || !area || !growthStage}
            >
              คำนวณ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {showResults && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>ผลการคำนวณ</CardTitle>
              <CardDescription>ปุ๋ยที่แนะนำสำหรับ{cropType} พื้นที่ {area} ไร่</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-600 mb-2">N (ไนโตรเจน)</div>
                  <div className="text-3xl text-green-600 mb-1">2.5</div>
                  <div className="text-xs text-gray-500">สัดส่วน</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-600 mb-2">P (ฟอสฟอรัส)</div>
                  <div className="text-3xl text-blue-600 mb-1">1.8</div>
                  <div className="text-xs text-gray-500">สัดส่วน</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-600 mb-2">K (โพแทสเซียม)</div>
                  <div className="text-3xl text-orange-600 mb-1">2.1</div>
                  <div className="text-xs text-gray-500">สัดส่วน</div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm text-blue-900 mb-2">💡 คำแนะนำ</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• ควรใส่ปุ๋ยประมาณ {(Number(area) * 50).toFixed(0)} กก. ต่อครั้ง</li>
                  <li>• แบ่งใส่ 2-3 ครั้งในช่วงระยะนี้</li>
                  <li>• ควรใส่ปุ๋ยในช่วงเช้าหรือเย็น เมื่อดินมีความชื้น</li>
                  <li>• หลังใส่ปุ๋ยควรรดน้ำเบาๆ เพื่อให้ธาตุอาหารละลายซึมสู่ดิน</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>แหล่งซื้อที่แนะนำ</CardTitle>
              <CardDescription>ฟาร์มที่มีปุ๋ยตรงตามความต้องการของคุณ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendedSources.map((source) => (
                  <div
                    key={source.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-gray-900 mb-1">{source.name}</h4>
                        <p className="text-sm text-gray-600">{source.seller}</p>
                      </div>
                      <Badge className="bg-green-500">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {source.matchScore}% Match
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-xs text-gray-500">N</div>
                        <div className="text-sm text-green-600">{source.npk.n}%</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-xs text-gray-500">P</div>
                        <div className="text-sm text-blue-600">{source.npk.p}%</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2 text-center">
                        <div className="text-xs text-gray-500">K</div>
                        <div className="text-sm text-orange-600">{source.npk.k}%</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="text-lg text-green-600">฿{source.price}/กก.</span>
                        <span className="flex items-center gap-1">
                          <Leaf className="w-4 h-4" />
                          {source.distance} กม.
                        </span>
                      </div>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600">
                        ดูรายละเอียด
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full mt-4">
                <Leaf className="w-4 h-4 mr-2" />
                ดูแหล่งซื้อใกล้ฉันบนแผนที่
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function NPKCalculatorContent() {
  const [animalType, setAnimalType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [feedType, setFeedType] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleCalculate = () => {
    if (animalType && quantity && feedType) {
      setShowResults(true);
    }
  };

  const npkData: Record<string, { n: number; p: number; k: number }> = {
    chicken: { n: 3.5, p: 3.0, k: 1.8 },
    cow: { n: 2.5, p: 1.8, k: 2.1 },
    pig: { n: 3.8, p: 3.2, k: 2.4 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-2xl mb-2">เครื่องคำนวณ NPK</h1>
        <p className="text-gray-600">ประมวลคำคุณภาพทางเคมีของเสียจากชนิดสัตว์และปริมาณ</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Leaf className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-900 mb-1">
            <strong>ระบบประมวลผลค่า NPK โดยประมาณจากชนิดสัตว์และอาหารที่ให้</strong>
          </p>
          <p className="text-xs text-blue-700">
            💡 <strong>เคล็ดลับ:</strong> ค่าที่ได้เป็นการประมาณการเบื้องต้น ควรตรวจวิเคราะห์เพื่อความแม่นยำมากยิ่งขึ้นต้องได้
          </p>
        </div>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลสำหรับของคุณ</CardTitle>
          <CardDescription>กรอกข้อมูลเพื่อคำนวณค่า NPK</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="animal-type" className="mb-2 block">ชนิดสัตว์</Label>
            <Select value={animalType} onValueChange={setAnimalType}>
              <SelectTrigger id="animal-type">
                <SelectValue placeholder="เลือกชนิดสัตว์" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chicken">ไก่</SelectItem>
                <SelectItem value="cow">โค</SelectItem>
                <SelectItem value="pig">สุกร</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="feed-type" className="mb-2 block">ชนิดอาหารที่ให้</Label>
            <Select value={feedType} onValueChange={setFeedType}>
              <SelectTrigger id="feed-type">
                <SelectValue placeholder="เลือกชนิดอาหาร" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concentrate">อาหารข้น (สูตรสำเร็จรูป)</SelectItem>
                <SelectItem value="grass">หญ้า/ฟาง</SelectItem>
                <SelectItem value="mixed">อาหารผสม</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity" className="mb-2 block">ปริมาณมูลสัตว์ (กก.)</Label>
            <Input
              id="quantity"
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleCalculate} 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={!animalType || !quantity || !feedType}
          >
            <Calculator className="w-4 h-4 mr-2" />
            คำนวณค่า NPK
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {showResults && animalType && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>ผลการคำนวณ NPK</CardTitle>
              <CardDescription>
                จาก{animalType === 'chicken' ? 'ไก่' : animalType === 'cow' ? 'โค' : 'สุกร'} ปริมาณ {quantity} กก.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-600 mb-2">N (ไนโตรเจน)</div>
                  <div className="text-3xl text-green-600 mb-1">{npkData[animalType].n}</div>
                  <div className="text-xs text-gray-500">%</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-600 mb-2">P (ฟอสฟอรัส)</div>
                  <div className="text-3xl text-blue-600 mb-1">{npkData[animalType].p}</div>
                  <div className="text-xs text-gray-500">%</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-600 mb-2">K (โพแทสเซียม)</div>
                  <div className="text-3xl text-orange-600 mb-1">{npkData[animalType].k}</div>
                  <div className="text-xs text-gray-500">%</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm text-gray-900 mb-2">📊 ปริมาณธาตุอาหารที่ได้</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">N: </span>
                    <span className="text-green-600">{((Number(quantity) * npkData[animalType].n) / 100).toFixed(2)} กก.</span>
                  </div>
                  <div>
                    <span className="text-gray-600">P: </span>
                    <span className="text-blue-600">{((Number(quantity) * npkData[animalType].p) / 100).toFixed(2)} กก.</span>
                  </div>
                  <div>
                    <span className="text-gray-600">K: </span>
                    <span className="text-orange-600">{((Number(quantity) * npkData[animalType].k) / 100).toFixed(2)} กก.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>พืชที่เหมาะสม</CardTitle>
              <CardDescription>พืชที่แนะนำสำหรับค่า NPK นี้</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-900 mb-2">ผักใบเขียว</p>
                  <p className="text-xs text-gray-600">
                    เช่น ผักกาด ผักชี ต้องการ N สูง
                  </p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-900 mb-2">ผักผลไม้</p>
                  <p className="text-xs text-gray-600">
                    เช่น มะเขือเทศ พริก ต้องการ P สูง
                  </p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-900 mb-2">พืชหัว</p>
                  <p className="text-xs text-gray-600">
                    เช่น หัวหอม กระเทียม ต้องการ K สูง
                  </p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-900 mb-2">ข้าว ธัญพืช</p>
                  <p className="text-xs text-gray-600">
                    ต้องการ NPK ที่สมดุลตามช่วงเจริญเติบโต
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>คำแนะนำการใช้</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                    1
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 mb-1">หมักปุ๋ยให้สุก</p>
                    <p className="text-xs text-gray-600">
                      ควรหมักมูลสัตว์ให้สุกก่อนนำไปใช้ อย่างน้อย 30-45 วัน
                      เพื่อฆ่าเชื้อโรคและเพิ่มประสิทธิภาพ
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                    2
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 mb-1">อัตราการใช้</p>
                    <p className="text-xs text-gray-600">
                      แนะนำใส่ปุ๋ยคอก 500-1,000 กก./ไร่ ขึ้นอยู่กับชนิดพืชและสภาพดิน
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                    3
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 mb-1">ระยะเวลาที่เหมาะสม</p>
                    <p className="text-xs text-gray-600">
                      ควรใส่ก่อนหว่านหรือปลูก 7-14 วัน และพรวนคลุกเคล้ากับดิน
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}