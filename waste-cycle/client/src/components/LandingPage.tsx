import { Recycle, ArrowRight, Sprout, Beef, TrendingUp, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-6">
            <Recycle className="w-16 h-16 text-green-600" />
            <h1 className="text-5xl">Waste-Cycle</h1>
          </div>
          
          <p className="text-2xl text-gray-700 mb-4">
            หมุนของเสียให้กลายเป็นคุณค่า
          </p>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
            Smart Farming for a Sustainable Future
          </p>
          
          <p className="text-lg text-gray-600 mb-12 max-w-3xl">
            เชื่อมต่อฟาร์มสัตว์กับฟาร์มพืช ผ่านแพลตฟอร์มกลางที่ให้คุณแลกเปลี่ยนมูลสัตว์และเศษพืช
            สร้างวงจรเกษตรหมุนเวียนที่ยั่งยืน
          </p>

          <Button onClick={onGetStarted} size="lg" className="text-lg px-8 py-6">
            เริ่มต้นใช้งาน <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <FeatureCard 
            icon={<Sprout className="w-8 h-8 text-green-600" />}
            title="ฟาร์มพืช"
            description="ค้นหามูลสัตว์คุณภาพดี พร้อมข้อมูล N-P-K ครบถ้วน"
          />
          <FeatureCard 
            icon={<Beef className="w-8 h-8 text-orange-600" />}
            title="ฟาร์มสัตว์"
            description="ขายของเสียให้เป็นรายได้ แทนการจัดการทิ้ง"
          />
          <FeatureCard 
            icon={<TrendingUp className="w-8 h-8 text-blue-600" />}
            title="เพิ่มรายได้"
            description="สร้างมูลค่าจากของเสีย ลดต้นทุนปุ๋ยเคมี"
          />
          <FeatureCard 
            icon={<Globe className="w-8 h-8 text-purple-600" />}
            title="เกษตรยั่งยืน"
            description="ร่วมสร้างเศรษฐกิจหมุนเวียน ลดผลกระทบสิ่งแวดล้อม"
          />
        </div>

        {/* Statistics */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-center text-3xl mb-8">ข้อมูลจากการสำรวจ</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <StatCard value="59.4%" label="ใช้มูลสัตว์เป็นปุ๋ยเป็นประจำ" />
            <StatCard value="46.9%" label="เจอปัญหาไม่รู้จะซื้อตรงไหน" />
            <StatCard value="93.8%" label="สนใจใช้แพลตฟอร์ม Waste-Cycle" />
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <h2 className="text-center text-3xl mb-12">วงจรการทำงาน</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <ProcessStep number="1" text="ฟาร์มสัตว์ส่งมูลสัตว์" />
            <ArrowRight className="w-8 h-8 text-gray-400 rotate-90 md:rotate-0" />
            <ProcessStep number="2" text="ฟาร์มพืชรับปุ๋ย" />
            <ArrowRight className="w-8 h-8 text-gray-400 rotate-90 md:rotate-0" />
            <ProcessStep number="3" text="ส่งเศษพืชกลับ" />
            <ArrowRight className="w-8 h-8 text-gray-400 rotate-90 md:rotate-0" />
            <ProcessStep number="4" text="วงจรหมุนเวียน" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-4xl text-green-600 mb-2">{value}</div>
      <p className="text-gray-600">{label}</p>
    </div>
  );
}

function ProcessStep({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl mb-3">
        {number}
      </div>
      <p className="text-center">{text}</p>
    </div>
  );
}
