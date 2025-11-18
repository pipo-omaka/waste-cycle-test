import { useState } from 'react'
import { Home, Store, PlusCircle, MessageSquare, BarChart3, Lightbulb, Recycle } from 'lucide-react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'



// Import Pages
import HomePage from './pages/HomePage'
import MarketplacePage from './pages/MarketplacePage'
import PostPage from './pages/PostPage'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import AdvisorPage from './pages/AdvisorPage'

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const navigation = [
    { id: 'home', name: 'หน้าแรก', icon: Home },
    { id: 'marketplace', name: 'ตลาด', icon: Store },
    { id: 'post', name: 'สร้างโพสต์', icon: PlusCircle },
    { id: 'chat', name: 'แชท', icon: MessageSquare },
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'advisor', name: 'คำแนะนำ', icon: Lightbulb },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      
      case 'marketplace':
        return <MarketplacePage />;
      case 'post':
        return <PostPage />;
      case 'chat':
        return <ChatPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'advisor':
        return <AdvisorPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Recycle className="w-8 h-8 text-green-600" />
              <span className="text-xl font-bold text-gray-800">WASTE-CYCLE</span>
            </div>
            <div className="hidden md:flex gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentPage === item.id
                        ? 'bg-green-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main>{renderPage()}</main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center gap-1 py-3 px-2 flex-1 ${
                  currentPage === item.id ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;
